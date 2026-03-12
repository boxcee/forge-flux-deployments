# Stack Research

**Domain:** Forge Admin Configuration UI for per-installation webhook secret management
**Researched:** 2026-03-12
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@forge/react` | ^11.9.0 | UI Kit frontend framework | Official Forge UI framework. Renders natively inside Jira admin. No build pipeline needed -- Forge bundles it. `render: native` in manifest. |
| `@forge/resolver` | ^1.7.1 | Backend function definitions | Bridges UI Kit frontend to backend logic. Resolvers handle storage reads/writes and are invoked from the frontend via `@forge/bridge`. |
| `@forge/bridge` | ^5.10.0 | Frontend-to-backend invocation | Provides `invoke()` to call resolver functions from UI Kit components. Included automatically in UI Kit apps. |
| `@forge/kvs` | ^1.2.0 | Encrypted secret storage | Replaces `@forge/api` storage (legacy, no new features since March 2025). Provides `kvs.setSecret()` / `kvs.getSecret()` with automatic per-installation scoping and encryption at rest. |

### Manifest Modules (New)

These manifest entries must be added to the existing `manifest.yml`:

| Module | Key | Purpose |
|--------|-----|---------|
| `jira:adminPage` | `admin-config` | Main admin settings page in Jira Apps section |
| `function` | `resolver` | Resolver function for UI Kit backend calls |
| `resources` | `admin-page` | Points to `src/frontend/index.jsx` |

### Manifest Changes

```yaml
# ADD to existing manifest.yml
modules:
  jira:adminPage:
    - key: admin-config
      resource: admin-page
      title: GitOps Deployments Settings
      render: native
      resolver:
        function: resolver

  function:
    # existing functions stay
    - key: handleFluxEvent
      handler: index.handleFluxEvent
    - key: handleArgoEvent
      handler: index.handleArgoEvent
    # NEW resolver function
    - key: resolver
      handler: resolver.handler

resources:
  - key: admin-page
    path: src/frontend/index.jsx

permissions:
  scopes:
    # existing scopes stay
    - write:deployment-info:jira
    - write:deployment:jira-software
    - read:deployment:jira-software
    # NEW scope for @forge/kvs
    - storage:app
```

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@forge/api` | ^4.0.0 (existing) | Jira REST API calls | Keep for `submitDeployment` in `src/jira.js`. Do NOT use its storage module -- use `@forge/kvs` instead. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `forge tunnel` | Live debug admin page locally | Already in workflow. Tunnels both webtrigger and admin page modules. |
| `forge deploy -e development` | Deploy to dev environment | Already in workflow. Must redeploy after manifest changes. |

## Project Structure Changes

```
src/
  frontend/
    index.jsx          # NEW - UI Kit admin page component
  resolver.js          # NEW - Resolver functions (getSecrets, setSecrets)
  index.js             # MODIFY - read secrets from kvs instead of process.env
  hmac.js              # NO CHANGE
  bearer.js            # NO CHANGE
  mapper.js            # NO CHANGE
  argocd-mapper.js     # NO CHANGE
  jira.js              # NO CHANGE
  __tests__/
    resolver.test.js   # NEW - test resolver functions
    index.test.js      # MODIFY - mock kvs instead of process.env
```

## Installation

```bash
# New production dependencies
npm install @forge/kvs @forge/react @forge/resolver @forge/bridge

# No new dev dependencies needed -- existing Jest setup works
```

## Integration Points with Existing Code

### Secret Retrieval Migration

Current (`src/index.js` lines 27-28, 74):
```javascript
const secret = process.env.WEBHOOK_SECRET;
const token = process.env.ARGOCD_WEBHOOK_TOKEN;
```

After migration:
```javascript
import { kvs } from '@forge/kvs';

const secret = await kvs.getSecret('flux-hmac-secret');
const token = await kvs.getSecret('argocd-bearer-token');
```

Key storage keys:
- `flux-hmac-secret` -- FluxCD HMAC webhook secret
- `argocd-bearer-token` -- ArgoCD bearer token

### Resolver Pattern

```javascript
// src/resolver.js
import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();

resolver.define('getConfig', async () => {
  // Return presence flags, never the actual secret values
  const fluxSecret = await kvs.getSecret('flux-hmac-secret');
  const argoToken = await kvs.getSecret('argocd-bearer-token');
  return {
    fluxSecretConfigured: !!fluxSecret,
    argoTokenConfigured: !!argoToken,
  };
});

resolver.define('saveFluxSecret', async (req) => {
  await kvs.setSecret('flux-hmac-secret', req.payload.secret);
  return { success: true };
});

resolver.define('saveArgoToken', async (req) => {
  await kvs.setSecret('argocd-bearer-token', req.payload.token);
  return { success: true };
});

export const handler = resolver.getDefinitions();
```

### Frontend Pattern

```jsx
// src/frontend/index.jsx
import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Text, Form, TextField, Button, Stack, SectionMessage,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    invoke('getConfig').then(setConfig);
  }, []);
  // Form UI for setting secrets
  // ...
};

ForgeReconciler.render(<App />);
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| UI Kit (`@forge/react`) | Custom UI (full React + bundler) | When you need complex UI beyond Atlassian design system components. Overkill here -- a settings form with two text fields and two buttons is trivially expressible in UI Kit. |
| `@forge/kvs` | `@forge/api` storage module | Never for new code. Legacy module, no new features since March 2025. `@forge/kvs` is the replacement. |
| `@forge/kvs` | Forge environment variables (`forge variables set`) | Never for customer-facing secrets. Env vars are vendor-side only -- customers cannot set them. This is the entire problem we are solving. |
| `kvs.setSecret()` | `kvs.set()` (non-secret) | Never for credentials. `setSecret` encrypts values and prevents them from being returned by query methods. `set` stores in plaintext. |
| Single admin page | Separate pages per tool | When there are 5+ configuration sections. Two secrets on one page is cleaner. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@forge/ui` (UI Kit 1) | Deprecated. Uses `useState` from `@forge/ui` instead of React. Not compatible with `render: native`. | `@forge/react` (UI Kit 2/latest) |
| `@forge/api` storage | Legacy. No new features since March 2025. Will not receive TTL, transactions, or bulk operations. | `@forge/kvs` |
| `process.env.*` for secrets | Vendor-side only. Customers cannot configure. Defeats the purpose of this milestone. | `@forge/kvs` `setSecret`/`getSecret` |
| Custom UI with bundler | Requires Webpack/Vite build step, separate `static/` directory, `index.html` entry point. Massive overhead for a two-field form. | UI Kit with `render: native` |
| `useAsConfig: true` on admin page | Creates a small "Configure" button in Manage Apps that opens a limited modal. We want a full admin page with proper layout. | Standard `jira:adminPage` without `useAsConfig` |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@forge/react@^11` | `render: native` in manifest | Requires `render: native`. Do NOT use `render: default` (that is UI Kit 1). |
| `@forge/kvs@^1.2` | `storage:app` scope | Must add `storage:app` to manifest permissions. |
| `@forge/resolver@^1.7` | `@forge/bridge@^5` | Resolver defines backend, bridge invokes from frontend. Versions are compatible. |
| `@forge/react@^11` | Node.js 22.x runtime | App runtime is `nodejs22.x`. Compatible. |

## Sources

- [Jira Admin Page manifest reference](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- module config, required properties (HIGH confidence)
- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- `kvs.setSecret`/`getSecret` API, per-installation scoping (HIGH confidence)
- [Forge KVS migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/) -- `@forge/api` to `@forge/kvs` migration (HIGH confidence)
- [Forge Resolver reference](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) -- resolver pattern, invoke bridge (HIGH confidence)
- [Forge UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/) -- `@forge/react`, `render: native` (HIGH confidence)
- [Forge UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/) -- Form, TextField, Button, SectionMessage (HIGH confidence)
- [@forge/react on npm](https://www.npmjs.com/package/@forge/react) -- v11.9.0 latest (HIGH confidence)
- [@forge/kvs on npm](https://www.npmjs.com/package/@forge/kvs) -- v1.2.0 latest (HIGH confidence)
- [@forge/resolver on npm](https://www.npmjs.com/package/@forge/resolver) -- v1.7.1 latest (HIGH confidence)
- [Forge manifest permissions](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/) -- `storage:app` scope (HIGH confidence)

---
*Stack research for: Forge Admin Configuration UI*
*Researched: 2026-03-12*
