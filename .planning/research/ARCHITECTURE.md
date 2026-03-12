# Architecture Research: Admin Config UI Integration

**Domain:** Forge Admin Page + Storage integration with existing webtrigger app
**Researched:** 2026-03-12
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Jira Admin Settings                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │            Admin Page (Custom UI / React)                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │ FluxCD Tab   │  │ ArgoCD Tab   │  │ Status/Health    │   │  │
│  │  │ HMAC secret  │  │ Bearer token │  │ Config summary   │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │  │
│  └─────────┼─────────────────┼───────────────────┼──────────────┘  │
│            │ invoke()        │ invoke()           │ invoke()        │
│            ▼                 ▼                    ▼                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Resolver Function (src/resolver.js)              │  │
│  │  setFluxSecret / setArgoSecret / deleteSecret / getConfig    │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│                             ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Forge Storage (@forge/kvs)                        │  │
│  │  Per-installation, encrypted at rest                          │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐               │  │
│  │  │ flux:hmacSecret │  │ argocd:bearerToken   │               │  │
│  │  └─────────────────┘  └──────────────────────┘               │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │ kvs.getSecret()                       │
│                             ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           Webtrigger Functions (src/index.js)                 │  │
│  │  ┌─────────────────────┐  ┌──────────────────────┐           │  │
│  │  │ handleFluxEvent     │  │ handleArgoEvent      │           │  │
│  │  │ HMAC verify -> map  │  │ Bearer verify -> map │           │  │
│  │  │ -> submit to Jira   │  │ -> submit to Jira    │           │  │
│  │  └─────────────────────┘  └──────────────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Admin Page (UI) | Secret input forms, status display, user feedback | Custom UI React app with `jira:adminPage` module |
| Resolver Function | Backend logic for admin page: validate input, read/write secrets | New `src/resolver.js` using `@forge/resolver` |
| Storage Module | Abstraction over `@forge/kvs` for secret CRUD with env var fallback | New `src/storage.js` wrapping `kvs.setSecret`/`kvs.getSecret` |
| Webtrigger Handlers | Existing webhook processing (modified to read from storage) | Modified `src/index.js` -- fallback chain: storage then env var |

## Data Flow

### Flow 1: Admin Sets Secret

```
Admin clicks "Save" in Jira Settings > Apps > GitOps Deployments
    |
    v
Custom UI Form -> invoke('setFluxSecret', { secret: '...' })
    |                  (via @forge/bridge)
    v
Resolver function validates input (non-empty, min length)
    |
    v
storage.setFluxSecret(secret) -> kvs.setSecret('flux:hmacSecret', secret)
    |
    v
Resolver returns { success: true } -> UI shows confirmation
```

### Flow 2: Webhook Reads Secret

```
FluxCD sends POST to webtrigger URL
    |
    v
handleFluxEvent(event)
    |
    v
storage.getFluxSecret()           <-- new storage.js function
    |
    |-- kvs.getSecret('flux:hmacSecret') returns value? -> use it
    |
    +-- Falls back to process.env.WEBHOOK_SECRET (backward compat)
    |
    v
verifyHmac(body, signature, secret)   <-- unchanged
    |
    v
(rest of pipeline unchanged)
```

### Flow 3: Admin Checks Config Status

```
Admin opens config page
    |
    v
Custom UI loads -> invoke('getConfigStatus')
    |                  (via @forge/bridge)
    v
Resolver calls storage.getConfigStatus():
  - kvs.getSecret('flux:hmacSecret') !== undefined -> configured: true
  - kvs.getSecret('argocd:bearerToken') !== undefined -> configured: true
    |
    v
Returns { flux: { configured: true }, argocd: { configured: false } }
    |
    v
UI renders status indicators (checkmark / warning)
```

## Manifest Changes

Current manifest needs these additions. Below shows the **diff** from current state:

```yaml
modules:
  # EXISTING -- unchanged
  webtrigger:
    - key: flux-webhook
      function: handleFluxEvent
      response:
        type: dynamic
    - key: argo-webhook
      function: handleArgoEvent
      response:
        type: dynamic

  devops:deploymentInfoProvider:
    # ... unchanged ...

  function:
    - key: handleFluxEvent
      handler: index.handleFluxEvent
    - key: handleArgoEvent
      handler: index.handleArgoEvent
    # NEW -- resolver for admin page
    - key: resolver
      handler: resolver.handler

  # NEW -- admin page module
  jira:adminPage:
    - key: admin-config-page
      resource: admin-page
      resolver:
        function: resolver
      title: GitOps Deployments

# NEW -- Custom UI resource
resources:
  - key: admin-page
    path: static/admin/build

permissions:
  scopes:
    - write:deployment-info:jira
    - write:deployment:jira-software
    - read:deployment:jira-software
    - storage:app                      # NEW -- required for @forge/kvs

app:
  # ... unchanged ...
```

**Changes summary:**
1. Add `resolver` function definition under `function:`
2. Add `jira:adminPage` module block
3. Add `resources:` block pointing to Custom UI build output
4. Add `storage:app` scope to permissions

### Custom UI vs UI Kit Decision

**Use Custom UI** because:
1. Full DOM control allows standard HTML password inputs with show/hide toggle.
2. UI Kit restricts to `@forge/react` components only (no DOM access), and its form components may lack password-field UX.
3. The admin page is simple (two forms, status display) so the React build step overhead is minimal.
4. Custom UI uses `@forge/bridge` to call resolver functions -- well-documented pattern.
5. The app has zero existing frontend code -- starting fresh either way.

**UI Kit alternative:** Avoids the build step, uses `render: native` with a `.jsx` source path directly. However, UI Kit's component restrictions limit UX for secret management forms. Not worth the trade-off here.

## Recommended Project Structure

```
forge-flux-deployments/
  src/
    index.js              # MODIFIED -- use storage.js for secret retrieval
    hmac.js               # UNCHANGED
    bearer.js             # UNCHANGED
    mapper.js             # UNCHANGED
    argocd-mapper.js      # UNCHANGED
    jira.js               # UNCHANGED
    shared.js             # UNCHANGED
    storage.js            # NEW -- wraps @forge/kvs secret operations
    resolver.js           # NEW -- Forge resolver for admin page backend
    __tests__/
      storage.test.js     # NEW
      resolver.test.js    # NEW
      ...existing...
  static/
    admin/                # NEW -- Custom UI React app
      src/
        App.jsx           # Main admin page component
        index.html        # Entry point
        index.jsx         # React root
      package.json        # React + @forge/bridge deps
      build/              # Built output (referenced in manifest)
  manifest.yml            # MODIFIED -- adminPage, function, resource, scope
  package.json            # MODIFIED -- add @forge/kvs, @forge/resolver
```

### Structure Rationale

- **`src/storage.js`**: Single abstraction for all secret operations. Both resolver and webtrigger handlers import from here. Keeps `@forge/kvs` usage in one place.
- **`src/resolver.js`**: Forge resolver pattern -- exports a `handler` that routes `invoke()` calls by function key. Sits at the same level as `index.js` since it is a Forge entry point referenced in `manifest.yml`.
- **`static/admin/`**: Separate directory with its own `package.json` for the Custom UI React app. Standard Forge convention. The `build/` output is what the manifest's `resources` path references.

## Architectural Patterns

### Pattern 1: Storage Abstraction with Env Var Fallback

**What:** A `storage.js` module that wraps `@forge/kvs` and provides a fallback to `process.env` for backward compatibility during migration.

**When to use:** During the transition period when existing installations may still use `forge variables` while new installations use the admin UI. Keep the fallback permanently or until a major version bump with migration guide.

**Trade-offs:** One layer of indirection. Worth it because it isolates the migration concern and makes testing straightforward (mock one module).

```javascript
// src/storage.js
import { kvs } from '@forge/kvs';

const KEYS = {
  fluxHmacSecret: 'flux:hmacSecret',
  argocdBearerToken: 'argocd:bearerToken',
};

export async function getFluxSecret() {
  const stored = await kvs.getSecret(KEYS.fluxHmacSecret);
  return stored ?? process.env.WEBHOOK_SECRET;
}

export async function getArgoSecret() {
  const stored = await kvs.getSecret(KEYS.argocdBearerToken);
  return stored ?? process.env.ARGOCD_WEBHOOK_TOKEN;
}

export async function setFluxSecret(value) {
  await kvs.setSecret(KEYS.fluxHmacSecret, value);
}

export async function setArgoSecret(value) {
  await kvs.setSecret(KEYS.argocdBearerToken, value);
}

export async function deleteFluxSecret() {
  await kvs.deleteSecret(KEYS.fluxHmacSecret);
}

export async function deleteArgoSecret() {
  await kvs.deleteSecret(KEYS.argocdBearerToken);
}

export async function getConfigStatus() {
  const flux = await kvs.getSecret(KEYS.fluxHmacSecret);
  const argo = await kvs.getSecret(KEYS.argocdBearerToken);
  return {
    flux: { configured: flux !== undefined },
    argocd: { configured: argo !== undefined },
  };
}
```

### Pattern 2: Resolver as Backend Router

**What:** A single resolver function that dispatches `invoke()` calls by function key. Each action maps to a storage operation.

**When to use:** Always -- this is the standard Forge pattern for Custom UI backend communication.

```javascript
// src/resolver.js
import Resolver from '@forge/resolver';
import {
  setFluxSecret, setArgoSecret,
  deleteFluxSecret, deleteArgoSecret,
  getConfigStatus,
} from './storage.js';

const resolver = new Resolver();

resolver.define('getConfigStatus', async () => {
  return await getConfigStatus();
});

resolver.define('setFluxSecret', async ({ payload }) => {
  const { secret } = payload;
  if (!secret || typeof secret !== 'string' || secret.length < 8) {
    return { success: false, error: 'Secret must be at least 8 characters' };
  }
  await setFluxSecret(secret);
  return { success: true };
});

resolver.define('setArgoSecret', async ({ payload }) => {
  const { token } = payload;
  if (!token || typeof token !== 'string' || token.length < 8) {
    return { success: false, error: 'Token must be at least 8 characters' };
  }
  await setArgoSecret(token);
  return { success: true };
});

resolver.define('deleteFluxSecret', async () => {
  await deleteFluxSecret();
  return { success: true };
});

resolver.define('deleteArgoSecret', async () => {
  await deleteArgoSecret();
  return { success: true };
});

export const handler = resolver.getDefinitions();
```

### Pattern 3: Minimal Change to Existing Handlers

**What:** Modify `index.js` with minimal, surgical changes -- replace `process.env.X` with `await getXSecret()` calls. Everything else stays identical.

**When to use:** Always. The webhook handler logic is correct; only the secret source changes.

**Change in `src/index.js`:**
```javascript
// Before (line 27-28):
const secret = process.env.WEBHOOK_SECRET;

// After:
import { getFluxSecret, getArgoSecret } from './storage.js';
// ...in handleFluxEvent:
const secret = await getFluxSecret();

// ...in handleArgoEvent:
const token = await getArgoSecret();
```

Both `verifyHmac()` and `verifyBearerToken()` receive the secret as a parameter and are completely unaffected.

### Pattern 4: Custom UI Bridge Communication

**What:** The Custom UI React app uses `@forge/bridge` `invoke()` to call resolver functions. One-way request/response: UI sends function key + payload, resolver processes and returns result.

**Frontend side:**
```javascript
// static/admin/src/App.jsx
import { invoke } from '@forge/bridge';

async function saveFluxSecret(secret) {
  const result = await invoke('setFluxSecret', { secret });
  if (!result.success) throw new Error(result.error);
  return result;
}

async function loadStatus() {
  return await invoke('getConfigStatus');
}
```

### Pattern 5: Write-Only Secret UI

**What:** The admin page never displays secret values. Only shows configured/not-configured status.

**Why:** Reduces exposure surface. Admins pasted the secret -- they know it. If they need to change it, they enter a new one.

**Implementation:** `getConfigStatus` returns booleans, not secret values. The resolver has no "getFluxSecret" action exposed to the frontend.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Forge Storage (`@forge/kvs`) | `setSecret`/`getSecret`/`deleteSecret` | Per-installation, encrypted at rest, 128 KiB max value, 500 byte max key |
| Jira Admin Settings | `jira:adminPage` module | Renders in Apps section at `/jira/settings/apps/{appId}/{envId}` |
| Forge Bridge (`@forge/bridge`) | `invoke(functionKey, payload)` | Custom UI frontend calls resolver backend |
| Forge Resolver (`@forge/resolver`) | `resolver.define(key, handler)` | Backend function routing for admin page |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Admin UI <-> Resolver | `invoke()` via `@forge/bridge` | Async, Promise-based, JSON payloads only |
| Resolver <-> Storage | Direct import of `storage.js` | Same Node.js runtime, synchronous module boundary |
| Webtrigger <-> Storage | Direct import of `storage.js` | Same `@forge/kvs` instance, same installation scope |
| Storage <-> Env Vars | Fallback chain in `storage.js` | Storage takes priority; env var is backward compat |

### Critical Detail: Webtrigger + Storage Share Scope

Forge Storage is scoped per-installation. Webtrigger functions and resolver functions within the same app installation share the same storage namespace. A secret set by the admin page resolver is readable by the webtrigger handler for the same Jira site installation.

**Confidence: HIGH** -- Verified via [official docs](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-basic/) (per-installation namespacing) and [community confirmation](https://community.developer.atlassian.com/t/access-storage-api-in-webtrigger/50997).

## New vs Modified Files

| File | Status | Change Description |
|------|--------|--------------------|
| `src/storage.js` | **NEW** | Storage abstraction wrapping `@forge/kvs` with env var fallback |
| `src/resolver.js` | **NEW** | Forge resolver for admin page backend |
| `src/__tests__/storage.test.js` | **NEW** | Tests for storage module |
| `src/__tests__/resolver.test.js` | **NEW** | Tests for resolver |
| `static/admin/` | **NEW** | Custom UI React app (config forms, build tooling) |
| `src/index.js` | **MODIFIED** | Replace `process.env.X` with `storage.js` calls (2 lines changed + 1 import) |
| `manifest.yml` | **MODIFIED** | Add `jira:adminPage`, resolver function, resources, `storage:app` scope |
| `package.json` | **MODIFIED** | Add `@forge/kvs` and `@forge/resolver` dependencies |
| `src/hmac.js` | UNCHANGED | Receives secret as parameter |
| `src/bearer.js` | UNCHANGED | Receives secret as parameter |
| `src/mapper.js` | UNCHANGED | No secret involvement |
| `src/argocd-mapper.js` | UNCHANGED | No secret involvement |
| `src/jira.js` | UNCHANGED | No secret involvement |
| `src/shared.js` | UNCHANGED | No secret involvement |

## Build Order (Dependency-Aware)

Webhook handlers must keep working throughout. Build in this order:

| Step | What | Risk to Existing | Rationale |
|------|------|-------------------|-----------|
| 1 | `src/storage.js` + tests | None | Pure addition, not imported by anything yet |
| 2 | `package.json`: add `@forge/kvs`, `@forge/resolver` | None | New deps, not used by existing code yet |
| 3 | `manifest.yml`: add `storage:app` scope, resolver function def | None | Scope addition is additive; function def unused until imported |
| 4 | `src/resolver.js` + tests | None | New file, referenced by manifest but admin page module not yet defined |
| 5 | `static/admin/` Custom UI app | None | New directory, not connected until manifest update |
| 6 | `manifest.yml`: add `jira:adminPage` + `resources` | None | Admin page appears in Jira settings. Handlers still use env vars |
| 7 | Deploy + verify admin page works | None | Test secret save/load via admin UI in isolation |
| 8 | `src/index.js`: switch to `storage.js` | **Low** | Fallback chain ensures env vars still work if storage is empty |
| 9 | Deploy + verify webhooks use stored secrets | **Low** | End-to-end: set secret in admin, send webhook, verify it works |
| 10 | Documentation updates | None | Setup guide, troubleshooting, marketplace listing |

**Why this order:** Steps 1-6 are pure additions with zero risk to existing functionality. Step 7 validates the admin page in isolation. Step 8 is the only change that touches existing handler logic, and the fallback chain guarantees backward compatibility.

## Anti-Patterns

### Anti-Pattern 1: Storing Secrets in Regular Storage

**What people do:** Use `kvs.set()` instead of `kvs.setSecret()` for sensitive values.
**Why it's wrong:** Regular storage values are queryable via `kvs.query()` and may appear in debug output. Secret storage encrypts values and restricts access to `getSecret()` only.
**Do this instead:** Always use `kvs.setSecret()` / `kvs.getSecret()` for webhook secrets and tokens.

### Anti-Pattern 2: Exposing Secret Values in Admin UI

**What people do:** Load and display the actual secret value in the config page for "edit" functionality.
**Why it's wrong:** Secrets should be write-only from the UI perspective. Displaying them increases exposure surface.
**Do this instead:** Only show "configured" / "not configured" status. Provide "update" (overwrite) and "delete" actions. Never read the secret value back to the frontend.

### Anti-Pattern 3: Caching Secrets in Module-Level Variables

**What people do:** Read the secret once at module load and cache it.
**Why it's wrong:** Forge functions may be reused across invocations (warm starts). A cached secret would not reflect updates made via the admin page until the function cold-starts again.
**Do this instead:** Read from `kvs.getSecret()` on every webtrigger invocation. The KVS call is fast (sub-100ms).

### Anti-Pattern 4: Storing Both Secrets Under a Single Key

**What people do:** `kvs.setSecret('config', { flux: '...', argo: '...' })` to store everything in one object.
**Why it's wrong:** Cannot update one without reading and rewriting the other. Race condition if two admins save simultaneously.
**Do this instead:** One key per secret: `flux:hmacSecret` and `argocd:bearerToken` as independent keys.

### Anti-Pattern 5: Using Legacy @forge/api Storage

**What people do:** Use `storage.setSecret()` from `@forge/api` instead of `kvs.setSecret()` from `@forge/kvs`.
**Why it's wrong:** Atlassian froze the legacy `@forge/api` storage module on 2025-03-17. No new features.
**Do this instead:** Use `@forge/kvs` exclusively for all new storage code.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-100 installations | Current design. One `kvs.getSecret()` call per webhook invocation. |
| 100-1000 installations | Still fine. Storage is per-installation, no cross-tenant contention. |
| 1000+ installations | Monitor Forge invocation rate limits. No structural changes needed. |

Not a scaling concern. Admin page is accessed rarely (initial setup + occasional rotation). Webhook handlers add one async storage read per invocation, negligible compared to the Jira API call they already make.

## Sources

- [Jira Admin Page module reference](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- manifest configuration, properties, validation rules
- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- `@forge/kvs` setSecret/getSecret/deleteSecret API
- [Forge Resources reference](https://developer.atlassian.com/platform/forge/manifest-reference/resources/) -- Custom UI resource path configuration
- [Custom UI invoke bridge](https://developer.atlassian.com/platform/forge/custom-ui-bridge/invoke/) -- `@forge/bridge` invoke pattern
- [Forge Key-Value Store](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-basic/) -- storage:app scope, per-installation namespacing
- [Webtrigger storage access (community)](https://community.developer.atlassian.com/t/access-storage-api-in-webtrigger/50997) -- confirms webtrigger and resolver share storage scope
- [Build a Custom UI app in Jira](https://developer.atlassian.com/platform/forge/build-a-custom-ui-app-in-jira/) -- Custom UI project structure and build process
- [Admin config page with Custom UI (community)](https://community.developer.atlassian.com/t/admin-configuration-page-with-forge-using-custom-ui/77325) -- community patterns

---
*Architecture research for: Admin Config UI Integration with existing webtrigger app*
*Researched: 2026-03-12*
