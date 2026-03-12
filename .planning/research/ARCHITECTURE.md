# Architecture Patterns

**Domain:** Forge Admin Configuration UI for webhook secret management
**Researched:** 2026-03-12
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Jira Admin Settings                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Admin Page (UI Kit / @forge/react)                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ FluxCD       │  │ ArgoCD       │  │ Status       │    │  │
│  │  │ Secret Field │  │ Token Field  │  │ Indicators   │    │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘    │  │
│  │         │                 │                                │  │
│  │         └────────┬────────┘                                │  │
│  │                  │ invoke()                                │  │
│  └──────────────────┼────────────────────────────────────────┘  │
│                     │                                            │
│  ┌──────────────────┼────────────────────────────────────────┐  │
│  │  Resolver (src/resolver.js)                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ getConfig    │  │ saveSecret   │  │ deleteSecret │    │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │  │
│  │         │                 │                  │             │  │
│  │         └────────┬────────┴──────────────────┘             │  │
│  │                  │                                         │  │
│  │         ┌────────┴────────┐                                │  │
│  │         │   @forge/kvs    │                                │  │
│  │         │  Secret Store   │  (encrypted, per-installation) │  │
│  │         └────────┬────────┘                                │  │
│  └──────────────────┼────────────────────────────────────────┘  │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │ kvs.getSecret()
┌─────────────────────┼────────────────────────────────────────────┐
│  Webtrigger Handlers (src/index.js)                               │
│  ┌──────────────────┼──────────────────┐                          │
│  │  handleFluxEvent │ handleArgoEvent  │                          │
│  │  reads flux-     │ reads argocd-    │                          │
│  │  hmac-secret     │ bearer-token     │                          │
│  └──────────┬───────┴──────────┬───────┘                          │
│             │                  │                                   │
│  ┌──────────┴──────┐ ┌────────┴────────┐                          │
│  │ hmac.js         │ │ bearer.js       │ (unchanged)              │
│  │ (verify HMAC)   │ │ (verify token)  │                          │
│  └─────────────────┘ └─────────────────┘                          │
└───────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/frontend/index.jsx` | UI Kit admin page. Renders form fields, status indicators, handles user input. | Resolver via `invoke()` |
| `src/resolver.js` | Backend logic for admin page. Reads/writes secrets. Returns config status. | `@forge/kvs`, `@forge/api` (webTrigger URLs) |
| `src/index.js` | Webtrigger handlers. Reads secrets for auth verification. | `@forge/kvs`, `src/hmac.js`, `src/bearer.js` |
| `src/hmac.js` | HMAC-SHA256 verification. Accepts secret as parameter. | None (pure function) |
| `src/bearer.js` | Bearer token verification. Accepts token as parameter. | None (pure function) |
| `@forge/kvs` (Secret Store) | Encrypted per-installation secret storage. | Forge platform (managed) |

## Data Flow

### Admin Configures Secret

```
Admin opens Settings > Apps > GitOps Deployments Settings
  |
  v
Frontend calls invoke('getConfig')
  |
  v
Resolver reads kvs.getSecret('flux-hmac-secret') and kvs.getSecret('argocd-bearer-token')
  |
  v
Returns { fluxConfigured: true/false, argoConfigured: true/false }
  |
  v
Frontend shows status badges and empty input fields
  |
  v
Admin enters secret, clicks Save
  |
  v
Frontend calls invoke('saveFluxSecret', { secret: '...' })
  |
  v
Resolver validates non-empty, calls kvs.setSecret('flux-hmac-secret', secret)
  |
  v
Returns { success: true }
  |
  v
Frontend shows success SectionMessage, refreshes status
```

### Webhook Arrives (Modified Flow)

```
FluxCD sends POST to webtrigger URL
  |
  v
handleFluxEvent reads secret: await kvs.getSecret('flux-hmac-secret')
  |
  v
  ├── secret is null/undefined --> return { statusCode: 503, body: 'Webhook secret not configured' }
  |
  └── secret exists --> verifyHmac(event.body, signature, secret)
        |
        └── (rest of existing flow unchanged)
```

## Patterns to Follow

### Pattern 1: Write-Only Secret UI

**What:** The admin page never displays secret values. It only shows whether a secret is configured (boolean).

**When:** Always, for any credential storage UI.

**Why:** Reduces exposure surface. Even admin users should not see the raw secret -- they pasted it, they know it. If they need to change it, they enter a new one.

**Implementation:**
```javascript
// Resolver: CORRECT -- return boolean, not value
resolver.define('getConfig', async () => {
  const flux = await kvs.getSecret('flux-hmac-secret');
  return { fluxConfigured: flux != null };
});

// Resolver: WRONG -- never return secret values to frontend
resolver.define('getConfig', async () => {
  const flux = await kvs.getSecret('flux-hmac-secret');
  return { fluxSecret: flux }; // DO NOT DO THIS
});
```

### Pattern 2: Graceful Degradation for Unconfigured Secrets

**What:** When a webhook arrives but the secret is not yet configured, return 503 (Service Unavailable) with a descriptive message, not 401 (Unauthorized).

**When:** After migrating from `process.env` to `kvs.getSecret()`.

**Why:** 401 implies the caller sent wrong credentials. 503 tells the CD tool operator that the receiving end is not ready yet. This distinction matters for debugging.

**Implementation:**
```javascript
const secret = await kvs.getSecret('flux-hmac-secret');
if (!secret) {
  return { statusCode: 503, body: 'Webhook secret not configured. Configure it in Jira admin settings.' };
}
```

### Pattern 3: Resolver as Thin Adapter

**What:** Keep resolver functions thin. They validate input, call `kvs`, and return results. No business logic in the resolver.

**When:** Always.

**Why:** Resolvers are hard to unit test in isolation (they depend on the Forge runtime). Keep logic in pure functions that are easy to test.

**Implementation:**
```javascript
// CORRECT: thin resolver
resolver.define('saveFluxSecret', async (req) => {
  const { secret } = req.payload;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    return { success: false, error: 'Secret must not be empty' };
  }
  await kvs.setSecret('flux-hmac-secret', secret.trim());
  return { success: true };
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Caching Secrets in Module-Level Variables

**What:** Reading the secret once at module load and caching it in a variable.

**Why bad:** Forge functions may be reused across invocations (warm starts). A cached secret would not reflect updates made via the admin page until the function cold-starts again.

**Instead:** Read from `kvs.getSecret()` on every webtrigger invocation. The KVS call is fast (sub-100ms).

### Anti-Pattern 2: Using `process.env` as Fallback

**What:** Trying both `kvs.getSecret()` and `process.env.WEBHOOK_SECRET` as a migration aid.

**Why bad:** Creates confusion about which secret is authoritative. Customers configure via admin UI but the app might silently use the old env var. Debugging becomes a nightmare.

**Instead:** Clean cut. Remove all `process.env` secret reads. If `kvs.getSecret()` returns null, the secret is not configured. Period.

### Anti-Pattern 3: Storing Both Secrets Under a Single Key

**What:** `kvs.setSecret('config', { flux: '...', argo: '...' })` to store everything in one object.

**Why bad:** Cannot update one without reading and rewriting the other. Race condition if two admins save simultaneously. Also means reading the ArgoCD token to update the FluxCD secret.

**Instead:** One key per secret. `flux-hmac-secret` and `argocd-bearer-token` are independent keys.

## File Layout

```
manifest.yml                    # MODIFY: add jira:adminPage, resolver, resource, storage:app scope
src/
  frontend/
    index.jsx                   # NEW: UI Kit admin page (React component)
  resolver.js                   # NEW: Resolver functions (getConfig, saveFluxSecret, saveArgoToken)
  index.js                      # MODIFY: replace process.env with kvs.getSecret()
  hmac.js                       # UNCHANGED
  bearer.js                     # UNCHANGED
  mapper.js                     # UNCHANGED
  argocd-mapper.js              # UNCHANGED
  jira.js                       # UNCHANGED
  __tests__/
    resolver.test.js            # NEW: test resolver logic
    index.test.js               # MODIFY: mock @forge/kvs instead of process.env
    frontend/
      index.test.jsx            # OPTIONAL: UI tests are low value for a simple form
```

## Sources

- [Forge Resolver API](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) -- resolver pattern, invoke bridge
- [Forge Secret Store](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- per-installation scoping, encryption
- [Forge UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/) -- render: native, @forge/react
- [Forge jira:adminPage](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- manifest config

---
*Architecture research for: Forge Admin Configuration UI*
*Researched: 2026-03-12*
