# Webhook Event Log — Design Spec

**Date:** 2026-03-16
**Status:** Draft

## Problem

Admins have zero visibility into webhook activity. When something fails — bad auth, missing annotations, Jira API errors — there's no way to diagnose it without Forge log tailing. Every support question starts with "is it even receiving events?"

## Solution

Add a SQL-backed event log that records every webhook invocation. Surface it in the existing admin page as a new tab with summary stats and a filterable table. Auto-prune entries older than 30 days.

## Data Model

Single table `webhook_events`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `timestamp` | DATETIME(3) | When the webhook was received (millisecond precision for cursor correctness) |
| `source` | VARCHAR(10) | `flux` or `argo` |
| `status_code` | INT | Handler response code (200, 204, 401, 400, 502, 503) |
| `release_name` | VARCHAR(255) | HelmRelease name or ArgoCD app name |
| `namespace` | VARCHAR(255) | Kubernetes namespace |
| `env` | VARCHAR(100) | Environment name from annotation |
| `issue_keys` | TEXT | Comma-separated Jira issue keys (TEXT to avoid truncation with many keys) |
| `deployment_state` | VARCHAR(20) | `successful`, `failed`, `rolled_back`, `in_progress`, `unknown`, or NULL for skipped/error |
| `accepted` | INT | Count from Jira API response (NULL if not submitted) |
| `rejected` | INT | Count of rejected deployments |
| `unknown_keys` | INT | Count of unknown issue keys |
| `error` | TEXT | Error message for 4xx/5xx responses, NULL on success. `logEvent()` truncates to 1000 chars before insert. |

Indexes:
- `(timestamp)` — retention cleanup
- `(source, timestamp)` — filtered listing

### Schema Initialization

`event-log.js` exports an `ensureSchema()` function that runs `CREATE TABLE IF NOT EXISTS`. It is called lazily on the first `logEvent()` invocation and caches a module-level boolean to skip subsequent calls. This avoids needing an `onInstall` trigger and handles cold starts cleanly. Race conditions between concurrent invocations are safe because `CREATE TABLE IF NOT EXISTS` is idempotent.

## Handler Integration

Each handler (`handleFluxEvent`, `handleArgoEvent`) writes one log entry at the end, regardless of outcome.

```
webhook arrives
  -> handler processes (auth, parse, map, submit)
  -> await logEvent({ source, statusCode, releaseName, ... })  // try/catch, swallow errors
  -> return response
```

Behaviors:
- **Awaited with swallowed errors** — `logEvent()` is awaited inside a try/catch in each handler. Errors are caught and logged to console. This ensures the write completes before the Forge runtime reclaims the execution context, while still preventing log failures from affecting the webhook response.
- **All outcomes logged** — 200, 204 (skipped), 401 (auth fail), 400 (bad request), 502 (Jira error), 503 (not configured). Full visibility.
- **Partial metadata on early exits** — 401/503 responses have fewer fields populated (no release name, env, etc.). This is expected.

### `submitAndRespond` Refactor

Currently `submitAndRespond()` returns an HTTP response object and does not expose Jira API counts. Refactor it to return both the HTTP response and the raw counts:

```js
// Before: returns { statusCode, headers, body }
// After: returns { response: { statusCode, headers, body }, counts: { accepted, rejected, unknownKeys } }
```

The handlers destructure this and pass `counts` to `logEvent()`. This is the only change to existing handler logic.

## Admin Page UI

The existing admin page gains a tabbed layout using `@forge/react` `Tabs` / `Tab` / `TabList` / `TabPanel` components (available since `@forge/react` v11).

- **Tab 1: Settings** — current secret configuration forms (unchanged)
- **Tab 2: Event Log** — new

### Event Log tab

**Stats strip** at the top showing 24h aggregates. SQL definitions:
- **Accepted:** `COUNT(*) WHERE status_code = 200` — successful webhook-to-Jira submissions
- **Failed:** `COUNT(*) WHERE status_code IN (400, 401, 502, 503)` — all error responses
- **Skipped:** `COUNT(*) WHERE status_code = 204` — ignored reasons / no annotation

**Source filter:** All / Flux / Argo — narrows both stats and table via `WHERE source = ?`.

**Table columns:** Time, Source, Status, Release, Env, Issues
- Newest-first, 25 rows per page
- **Keyset pagination** using `(timestamp DESC, id DESC)` cursor. The "Load more" button passes `{ beforeTimestamp, beforeId }` to the resolver. Query: `WHERE (timestamp < ? OR (timestamp = ? AND id < ?)) ORDER BY timestamp DESC, id DESC LIMIT 25`
- Status codes color-coded: 200 green, 204 grey, 4xx/5xx red

### New resolver handlers

- `getEventLog` — keyset-paginated query with optional source filter, returns 25 rows + `hasMore` flag
- `getEventStats` — three COUNT queries (accepted/failed/skipped) for the last 24h, accepts optional `source` filter parameter (same as `getEventLog`). When a source filter is active in the UI, both the stats strip and the table reflect the filtered view.

## Cleanup

A Forge scheduled trigger runs once daily (exact time is non-deterministic — Forge `DAILY` interval fires at a platform-determined time, not a configurable wall-clock offset):
- Manifest entry: `scheduledTrigger` with `interval: DAILY`
- Handler: `event-log.cleanupOldEvents` (function defined in `event-log.js`, mapped in manifest)
- SQL: `DELETE FROM webhook_events WHERE timestamp < NOW() - INTERVAL 30 DAY`
- Logs deleted row count to console
- Errors caught and logged — failed cleanup means next day catches up

## Storage Isolation

Forge SQL is automatically scoped per installation. Each Jira site gets its own isolated database. No tenant column needed.

## Manifest Permissions

Forge SQL requires additional permission scopes. Add to the existing `permissions.scopes` in `manifest.yml`:

```yaml
permissions:
  scopes:
    # ... existing scopes ...
    - 'sql:read'
    - 'sql:write'
```

This will trigger a re-consent prompt for existing installations (same as the `storage:app` addition in v1.1).

## File Changes

| File | Change |
|------|--------|
| `src/event-log.js` | **New** — `ensureSchema()`, `logEvent()`, `getEvents()`, `getStats()`, `cleanupOldEvents()` |
| `src/index.js` | Refactor `submitAndRespond` to return counts. Add `await logEvent()` in try/catch at each handler exit point. |
| `src/resolver.js` | Add `getEventLog` and `getEventStats` handlers |
| `src/frontend/index.jsx` | Add Tabs layout, Event Log tab with stats strip + table + keyset pagination |
| `manifest.yml` | Add `scheduledTrigger` module, new function entry for `event-log.cleanupOldEvents`, add `sql:read`/`sql:write` scopes |
| `package.json` | Add `@forge/sql` dependency |

No changes to: `hmac.js`, `bearer.js`, `mapper.js`, `argocd-mapper.js`, `jira.js`, `storage.js`.

## Out of Scope

- Full request/response body storage (use Forge console logs for deep debugging)
- Configurable retention period (30 days fixed)
- Real-time streaming / websocket updates
- Export/download functionality
