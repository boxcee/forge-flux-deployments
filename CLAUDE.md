# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Atlassian Forge app that receives webhook events from **FluxCD** (generic-hmac) and **ArgoCD** and creates Jira deployment records via the Deployments API. It runs as two Forge webtrigger functions on Node.js 22, with an admin page for configuration and an event log for monitoring.

## Commands

```bash
npm install                                              # install deps
npm test                                                 # run all tests (Jest, native ESM)
node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>'  # run a single test file
node --experimental-vm-modules node_modules/.bin/jest --coverage  # run with coverage
node --experimental-vm-modules node_modules/.bin/jest --watch     # watch mode
npm run lint                                             # ESLint (src/ only)
forge deploy --environment development                   # deploy to Forge
forge tunnel                                             # live debug with tunnel
forge logs --environment development                    # tail live function logs
```

## Architecture

Ten source modules in `src/`, no build step.

### Webhook handlers & auth

- **index.js** — Entry point. Exports `handleFluxEvent` and `handleArgoEvent`. Each orchestrates: secret retrieval → auth verification → JSON parse → metadata extraction → reason/phase filtering → payload build → Jira submit → event logging. Returns HTTP-like `{ statusCode, body }`.
- **hmac.js** — HMAC verification for FluxCD. Verifies `X-Signature` header (`sha256=<hex>`) using timing-safe comparison.
- **bearer.js** — Bearer token verification for ArgoCD. Extracts `Authorization: Bearer <token>` and compares using timing-safe comparison.

### Metadata extraction & payload building

- **mapper.js** — FluxCD-specific. Maps `reason` field to Jira deployment states. Extracts metadata from `event.metadata` using both full annotation keys (`event.toolkit.fluxcd.io/jira`) and short keys (`jira`) — Flux strips the prefix in webhook payloads. Builds Jira Deployments API bulk payload.
- **argocd-mapper.js** — ArgoCD-specific. Maps `phase` field to Jira deployment states. Extracts metadata from direct annotation fields (short keys only). Uses 7-char git SHA as revision display.
- **shared.js** — Utilities: `deterministicId()` generates deployment sequence numbers via SHA-256 of `name:namespace:version:timestamp`; `parseIssueKeys()` splits comma-separated keys.

### Platform integration

- **jira.js** — Thin wrapper around `@forge/api` calling `POST /rest/deployments/0.1/bulk`.
- **resolver.js** — Resolver handlers for admin page: `getConfigStatus`, `getWebtriggerUrls`, `setFluxSecret`, `setArgoSecret`, `deleteFluxSecret`, `deleteArgoSecret`, `getEventLog`, `getEventStats`.

### Data persistence

- **storage.js** — Secret management via `@forge/kvs` with fallback to `process.env.WEBHOOK_SECRET` / `process.env.ARGOCD_WEBHOOK_TOKEN`. Provides typed getters and setters.
- **event-log.js** — SQL event logging to `webhook_events` table. Records: timestamp, source, status code, release/app name, namespace, env, issue keys, deployment state, accepted/rejected/unknown counts, error text. 30-day retention via `cleanupOldEvents` scheduled trigger. Provides paginated query (cursor-based: `beforeTimestamp + beforeId`) and 24h stats aggregation.

### Frontend

- **src/frontend/index.jsx** — Admin page React UI. Displays configuration status, webhook URLs, event log, and 24h stats. Calls resolver handlers.

Tests live in `src/__tests__/` and mirror source files. They mock `@forge/api` and use `@jest/globals` imports.

## Dual-Provider Architecture

| Aspect | FluxCD | ArgoCD |
|--------|--------|--------|
| Webtrigger | `flux-webhook` | `argo-webhook` |
| Handler | `handleFluxEvent` | `handleArgoEvent` |
| Auth method | HMAC SHA-256 (`X-Signature` header) | Bearer token (`Authorization` header) |
| Secret env var | `WEBHOOK_SECRET` | `ARGOCD_WEBHOOK_TOKEN` |
| Mapper | `mapper.js` | `argocd-mapper.js` |
| Status field | `reason` (e.g. `UpgradeSucceeded`) | `phase` (e.g. `Succeeded`) |
| Version display | Full chart version (e.g. `1.4.2`) | Short git SHA (7 chars) |
| Annotation keys | Full or short (Flux strips prefix) | Short only |

Both providers produce the same Jira Deployments API payload shape. The `source` field in the event log distinguishes them.

## Event Logging & Monitoring

Every webhook event is logged to SQL via `event-log.js`:

- **Table:** `webhook_events` with indexes on `timestamp` and `(source, timestamp)`
- **Retention:** 30 days; cleanup runs daily via `cleanupOldEvents` scheduled trigger
- **Pagination:** Cursor-based using `beforeTimestamp + beforeId` tuple (not offset/limit)
- **Admin dashboard:** resolver exposes `getEventLog` (25 events per page) and `getEventStats` (24h aggregates: accepted, failed, skipped)

Use the admin page to monitor webhook health and debug failures.

## Key Conventions

- **One deployment record per upgrade** — Every `UpgradeSucceeded` event creates a new deployment record in Jira. Two Helm upgrades = two records. This is correct; Jira tracks deployment history, not just current state.
- **ESM only** — `"type": "module"` in package.json. All imports use `.js` extensions.
- **Forge manifest** — `manifest.yml` defines both webtrigger keys, function mappings, the admin page resource, and the DevOps deployment provider registration.
- **Deterministic deployment IDs** — `shared.js` derives each deployment's sequence number via SHA-256 of `name:namespace:version:timestamp`. Jira uses this for deduplication. Do not change this logic without understanding the implications.
- **Ignored reasons** — FluxCD: `UninstallSucceeded` and `DependencyNotReady` are silently skipped (204). ArgoCD: only `Succeeded`, `Failed`, and `Error` phases are processed.
- **Secret storage** — `storage.js` reads from `@forge/kvs` first, then falls back to env vars. Use env vars for local testing; KVS is the production path set via the admin page.

## HelmRelease / ArgoApp Annotations

| FluxCD annotation | ArgoCD annotation | Required | Example | Purpose |
|-------------------|-------------------|----------|---------|---------|
| `event.toolkit.fluxcd.io/jira` | `jira` | Yes | `DPS-123,DPS-456` | Jira issue keys |
| `event.toolkit.fluxcd.io/env` | `env` | Yes | `production` | Environment name |
| `event.toolkit.fluxcd.io/env-type` | `envType` | No | `production` | Jira env type; defaults to `unmapped` |
| `event.toolkit.fluxcd.io/url` | `url` | No | `https://github.com/org/repo` | Link shown in Jira deployment details |

## Initial Setup

1. Deploy the app: `forge deploy --environment production`
2. Navigate to admin page: Jira Settings → Apps → GitOps Deployments
3. Configure secrets via the admin page UI (sets values in `@forge/kvs`)
4. Copy the webhook URLs from the admin page and register them in FluxCD/ArgoCD
5. Trigger a test deployment and verify it appears in the event log

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `401` response | Wrong secret/token or malformed header | Verify secret matches; check `X-Signature` (FluxCD) or `Authorization` (ArgoCD) header format |
| `204` response (no deployment in Jira) | Missing `jira` or `env` annotation, or filtered reason/phase | Add required annotations; check reason/phase is not in ignore list |
| `400` response | Malformed JSON payload | Check Flux/Argo version; payload format may have changed |
| `502` response | Jira API error | Check Forge app permissions; verify issue keys exist in Jira |
| No events in admin log | Webhook not firing or wrong URL | Verify webhook URL registered in FluxCD/ArgoCD; trigger a manual deployment |

## Forge Tunnel & Deploy Gotchas

- **Flux Alert `namespace: '*'` unsupported** — When configuring a FluxCD `Alert` to watch HelmReleases across namespaces, `namespace: '*'` silently fails (events are discarded). Use the explicit namespace instead: `namespace: default`.
- **`forge tunnel` registers a persistent tunnel URL** with the Forge platform. Even after stopping the tunnel, the platform keeps routing the resource iframe to `localhost:800x`. The admin page will not load without an active tunnel in development until a clean `forge deploy` clears the registration.
- **Always `forge deploy` before `forge tunnel`** when adding new manifest modules. The tunnel can only override already-registered functions; new ones added only in the tunnel won't be found (404).
- **`@forge/resolver` ESM interop (fixed)** — The package exports CJS. `resolver.js` imports it as `import ResolverModule from '@forge/resolver'` then uses `const Resolver = ResolverModule.default || ResolverModule` to handle both CJS and ESM correctly.
- **Admin page location** — `jira:adminPage` modules appear under Jira Settings → Apps (left sidebar), NOT in the app overview/manage apps page. URL pattern: `/jira/settings/apps/{appId}/{envId}`.
