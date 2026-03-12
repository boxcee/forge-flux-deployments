# Phase 5: Admin Page & Storage Migration - Research

**Researched:** 2026-03-12
**Domain:** Forge Admin Page (UI Kit) + KVS Secret Storage + Webtrigger migration
**Confidence:** HIGH

## Summary

Phase 5 adds a Jira admin settings page where admins can configure FluxCD HMAC secrets and ArgoCD bearer tokens, replacing the current `forge variables set` workflow. Secrets are stored per-installation using `@forge/kvs` secret store. Webtrigger handlers are modified to read secrets from KVS instead of environment variables, with env var fallback during the transition period.

The UI Kit (`@forge/react`, `render: native`) approach is the locked decision. UI Kit supports `type="password"` on `Textfield`, has `useForm` + validation, and requires no build step. The admin page uses `@forge/bridge` `invoke()` to call resolver functions that wrap `@forge/kvs` operations. Webtrigger functions share the same per-installation storage namespace, so secrets saved by the admin page are immediately available to webhook handlers.

**Primary recommendation:** Build storage.js abstraction first (shared by resolver and handlers), then resolver, then UI Kit admin page, then modify index.js handlers last. This order ensures zero risk to existing functionality until the final step.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONF-01 | Jira admin can set FluxCD HMAC webhook secret via admin settings page | UI Kit form with `type="password"` Textfield, resolver `setFluxSecret`, KVS `setSecret` |
| CONF-02 | Jira admin can set ArgoCD bearer token via admin settings page | Same form pattern, resolver `setArgoSecret`, separate KVS key |
| CONF-03 | Admin page shows save confirmation feedback (success/error) | UI Kit `SectionMessage`/`Flag` components + resolver return `{ success, error }` |
| CONF-04 | Admin page displays the webtrigger URL for copying into CD tool config | `webTrigger.getUrl(moduleKey)` from `@forge/api` called in resolver, returned to frontend |
| STOR-01 | Secrets stored per-installation using Forge KVS secret store | `kvs.setSecret(key, value)` from `@forge/kvs`, `storage:app` scope in manifest |
| STOR-02 | Webtrigger handlers read secrets from KVS instead of env vars | `storage.js` abstraction: KVS first, env var fallback |
| STOR-03 | Webhook returns clear error when secrets not configured | Explicit 503 "Secret not configured" when both KVS and env var return undefined |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@forge/kvs` | latest | KVS secret store (setSecret/getSecret/deleteSecret) | Official replacement for `@forge/api` storage (frozen March 2025) |
| `@forge/resolver` | latest | Backend function routing for admin page | Standard Forge pattern for UI Kit/Custom UI backend communication |
| `@forge/react` | latest | UI Kit components (Textfield, Form, Button, etc.) | Locked decision: UI Kit over Custom UI, no build step needed |
| `@forge/bridge` | latest | Frontend-to-resolver invoke() calls | Required for UI Kit to call resolver functions |
| `@forge/api` | ^4.0.0 | Existing: Jira API calls + `webTrigger.getUrl()` | Already in use; webTrigger API provides URL retrieval for CONF-04 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@jest/globals` | ^29.7.0 | Test imports (existing) | All test files |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| UI Kit (`@forge/react`) | Custom UI (React iframe) | Custom UI gives full DOM control but requires separate build step, `static/admin/` directory, own `package.json`. Not worth it for two text fields. **Decision locked: use UI Kit.** |
| `@forge/kvs` | `@forge/api` storage | Legacy, frozen since March 2025. No new features or fixes. Never use for new code. |

**Installation:**
```bash
npm install @forge/kvs @forge/resolver @forge/react @forge/bridge
```

## Architecture Patterns

### Recommended Project Structure

```
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
  frontend/
    index.jsx           # NEW -- UI Kit admin page (render: native entry point)
  __tests__/
    storage.test.js     # NEW
    resolver.test.js    # NEW
    index.test.js       # MODIFIED -- mock storage.js instead of process.env
    ...existing...
manifest.yml            # MODIFIED -- adminPage, resolver, resource, storage:app scope
package.json            # MODIFIED -- add @forge/kvs, @forge/resolver, @forge/react, @forge/bridge
```

**Key difference from ARCHITECTURE.md:** UI Kit uses `render: native` with a single `.jsx` source file path in `resources`, not a Custom UI build directory. No `static/admin/` directory, no separate `package.json`, no build step.

### Pattern 1: Storage Abstraction Module

**What:** `src/storage.js` wraps all `@forge/kvs` operations. Both the resolver and webtrigger handlers import from here. Single source of truth for storage key constants.

**When to use:** Always. Prevents key drift between admin page and webhook handlers.

```javascript
// src/storage.js
import { kvs } from '@forge/kvs';

const KEYS = {
  fluxHmacSecret: 'flux:hmacSecret',
  argocdBearerToken: 'argocd:bearerToken',
};

export async function getFluxSecret() {
  const stored = await kvs.getSecret(KEYS.fluxHmacSecret);
  return stored ?? process.env.WEBHOOK_SECRET ?? undefined;
}

export async function getArgoSecret() {
  const stored = await kvs.getSecret(KEYS.argocdBearerToken);
  return stored ?? process.env.ARGOCD_WEBHOOK_TOKEN ?? undefined;
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

**What:** Single resolver function routes `invoke()` calls by function key. Each action maps to a storage operation.

```javascript
// src/resolver.js
import Resolver from '@forge/resolver';
import { webTrigger } from '@forge/api';
import {
  setFluxSecret, setArgoSecret,
  deleteFluxSecret, deleteArgoSecret,
  getConfigStatus,
} from './storage.js';

const resolver = new Resolver();

resolver.define('getConfigStatus', async () => {
  return await getConfigStatus();
});

resolver.define('getWebtriggerUrls', async () => {
  const fluxUrl = await webTrigger.getUrl('flux-webhook');
  const argoUrl = await webTrigger.getUrl('argo-webhook');
  return { flux: fluxUrl, argocd: argoUrl };
});

resolver.define('setFluxSecret', async ({ payload }) => {
  const { secret } = payload;
  if (!secret || typeof secret !== 'string' || secret.trim().length < 8) {
    return { success: false, error: 'Secret must be at least 8 characters' };
  }
  await setFluxSecret(secret.trim());
  return { success: true };
});

resolver.define('setArgoSecret', async ({ payload }) => {
  const { token } = payload;
  if (!token || typeof token !== 'string' || token.trim().length < 8) {
    return { success: false, error: 'Token must be at least 8 characters' };
  }
  await setArgoSecret(token.trim());
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

### Pattern 3: UI Kit Admin Page with useForm

**What:** UI Kit page with `render: native`, using `@forge/react` components and `@forge/bridge` `invoke()`.

```jsx
// src/frontend/index.jsx
import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Form, FormHeader, FormSection, FormFooter,
  Label, Textfield, Button, useForm,
  SectionMessage, Stack, Box, Text, Heading,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [status, setStatus] = useState(null);
  const [urls, setUrls] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    invoke('getConfigStatus').then(setStatus);
    invoke('getWebtriggerUrls').then(setUrls);
  }, []);

  const fluxForm = useForm();
  const argoForm = useForm();

  const saveFlux = async (data) => {
    const result = await invoke('setFluxSecret', { secret: data.fluxSecret });
    setFeedback(result.success
      ? { type: 'success', msg: 'FluxCD secret saved' }
      : { type: 'error', msg: result.error });
    if (result.success) setStatus(s => ({ ...s, flux: { configured: true } }));
  };

  const saveArgo = async (data) => {
    const result = await invoke('setArgoSecret', { token: data.argoToken });
    setFeedback(result.success
      ? { type: 'success', msg: 'ArgoCD token saved' }
      : { type: 'error', msg: result.error });
    if (result.success) setStatus(s => ({ ...s, argocd: { configured: true } }));
  };

  return (
    <Stack space="space.300">
      <Heading as="h2">GitOps Deployments Configuration</Heading>

      {feedback && (
        <SectionMessage appearance={feedback.type === 'success' ? 'success' : 'error'}>
          <Text>{feedback.msg}</Text>
        </SectionMessage>
      )}

      {/* Webtrigger URLs */}
      {urls && (
        <SectionMessage appearance="information">
          <Text>FluxCD webhook URL: {urls.flux}</Text>
          <Text>ArgoCD webhook URL: {urls.argocd}</Text>
        </SectionMessage>
      )}

      {/* FluxCD Section */}
      <Form onSubmit={fluxForm.handleSubmit(saveFlux)}>
        <FormHeader title="FluxCD HMAC Secret" />
        <FormSection>
          <Label labelFor={fluxForm.getFieldId('fluxSecret')}>
            Webhook Secret {status?.flux?.configured ? '(configured)' : '(not configured)'}
          </Label>
          <Textfield
            type="password"
            placeholder="Enter HMAC secret (min 8 characters)"
            {...fluxForm.register('fluxSecret', { required: true, minLength: 8 })}
          />
        </FormSection>
        <FormFooter>
          <Button appearance="primary" type="submit">Save FluxCD Secret</Button>
        </FormFooter>
      </Form>

      {/* ArgoCD Section */}
      <Form onSubmit={argoForm.handleSubmit(saveArgo)}>
        <FormHeader title="ArgoCD Bearer Token" />
        <FormSection>
          <Label labelFor={argoForm.getFieldId('argoToken')}>
            Bearer Token {status?.argocd?.configured ? '(configured)' : '(not configured)'}
          </Label>
          <Textfield
            type="password"
            placeholder="Enter bearer token (min 8 characters)"
            {...argoForm.register('argoToken', { required: true, minLength: 8 })}
          />
        </FormSection>
        <FormFooter>
          <Button appearance="primary" type="submit">Save ArgoCD Token</Button>
        </FormFooter>
      </Form>
    </Stack>
  );
};

ForgeReconciler.render(<App />);
```

### Pattern 4: Minimal Handler Modification

**What:** Replace `process.env.X` with `await getXSecret()` in `src/index.js`. Everything else stays identical.

```javascript
// Before:
const secret = process.env.WEBHOOK_SECRET;
// After:
import { getFluxSecret, getArgoSecret } from './storage.js';
const secret = await getFluxSecret();

// Add explicit "not configured" check:
if (!secret) {
  return { statusCode: 503, body: 'Webhook secret not configured' };
}
```

### Pattern 5: Manifest Changes

```yaml
modules:
  # EXISTING (unchanged)
  webtrigger: [...]
  devops:deploymentInfoProvider: [...]

  function:
    - key: handleFluxEvent
      handler: index.handleFluxEvent
    - key: handleArgoEvent
      handler: index.handleArgoEvent
    # NEW
    - key: resolver
      handler: resolver.handler

  # NEW
  jira:adminPage:
    - key: admin-config-page
      resource: admin-page
      resolver:
        function: resolver
      render: native
      title: GitOps Deployments

# NEW
resources:
  - key: admin-page
    path: src/frontend/index.jsx

permissions:
  scopes:
    - write:deployment-info:jira
    - write:deployment:jira-software
    - read:deployment:jira-software
    - storage:app                      # NEW
```

### Anti-Patterns to Avoid

- **Using `kvs.set()` instead of `kvs.setSecret()`:** Regular storage is queryable via `kvs.query()`. Always use `setSecret`/`getSecret` for credentials.
- **Returning secret values to frontend:** Only return `{ configured: boolean }`, never the actual secret.
- **Caching secrets in module-level variables:** Forge warm starts would use stale values. Read from KVS on every invocation.
- **Single composite key for all secrets:** Race conditions on concurrent writes. Use one key per secret.
- **Importing storage from `@forge/api`:** Frozen since March 2025. Use `@forge/kvs` exclusively.
- **Hardcoded storage keys in each file:** Key drift between resolver and handler. Use shared constants in `storage.js`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secret storage | Custom encryption/file storage | `@forge/kvs` `setSecret`/`getSecret` | Encrypted at rest, per-installation isolation, 128 KiB limit |
| Form validation | Custom validation logic in frontend | `useForm` + `register({ required, minLength })` | Built-in validation, error state management, touched tracking |
| Admin page routing | Custom URL routing | `jira:adminPage` manifest module | Automatic sidebar integration, admin-only access |
| Frontend-backend communication | Custom fetch/XHR to endpoints | `@forge/bridge` `invoke()` | Handles Forge auth, CORS, serialization automatically |
| Webtrigger URL retrieval | Hardcoded URL strings | `webTrigger.getUrl(moduleKey)` | URL is stable per module+app+site, auto-generated by Forge |

## Common Pitfalls

### Pitfall 1: Breaking Existing Installations on Upgrade

**What goes wrong:** Replacing `process.env.WEBHOOK_SECRET` with `kvs.getSecret()` breaks all existing installations that haven't configured secrets via admin UI yet.
**Why it happens:** Env vars and KVS are separate stores with no automatic migration.
**How to avoid:** Fallback chain in `storage.js`: try KVS first, fall back to `process.env`. Keep env vars until all installations migrate.
**Warning signs:** Webhook 401/503 responses after app upgrade.

### Pitfall 2: Scope Change Triggers Re-consent

**What goes wrong:** Adding `storage:app` scope triggers a major version bump. Existing installations stop working until a Jira admin approves the new scopes.
**Why it happens:** Forge enforces explicit admin consent for new scopes.
**How to avoid:** Keep env var fallback so handlers work during the consent gap. Document re-consent in release notes.
**Warning signs:** App logs show permission errors post-deploy.

### Pitfall 3: Storage Key Mismatch

**What goes wrong:** Resolver writes to `'webhookSecret'`, handler reads from `'webhook_secret'`. `getSecret` returns undefined, all webhooks rejected.
**Why it happens:** Keys are plain strings with no compile-time checks.
**How to avoid:** Define all keys as constants in `storage.js`. Both resolver and handler import from the same module.
**Warning signs:** Webhooks fail with 401 immediately after saving a secret in admin page.

### Pitfall 4: Webtrigger Functions Have No User Context

**What goes wrong:** Using `asUser()` patterns in webtrigger handler causes authorization errors.
**Why it happens:** Webtriggers run from external HTTP calls with no Atlassian session.
**How to avoid:** Use `@forge/kvs` directly -- it works at app scope, no user context needed.

### Pitfall 5: Empty String Saves as Valid Secret

**What goes wrong:** Whitespace-only input passes client validation but breaks HMAC verification.
**How to avoid:** Server-side trim + minimum length validation in resolver before calling `kvs.setSecret()`.

### Pitfall 6: ESM Handler Path Mismatch

**What goes wrong:** Manifest says `handler: resolver.handler` but the file doesn't export `handler`. Forge silently fails.
**How to avoid:** Verify `export const handler = resolver.getDefinitions()` in `src/resolver.js`.

## Code Examples

### Webtrigger URL Retrieval (CONF-04)

```javascript
// Source: https://developer.atlassian.com/platform/forge/runtime-reference/web-trigger-api/
import { webTrigger } from '@forge/api';

// In resolver:
resolver.define('getWebtriggerUrls', async () => {
  const fluxUrl = await webTrigger.getUrl('flux-webhook');
  const argoUrl = await webTrigger.getUrl('argo-webhook');
  return { flux: fluxUrl, argocd: argoUrl };
});
```

### KVS Secret Operations

```javascript
// Source: https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/
import { kvs } from '@forge/kvs';

// Set: kvs.setSecret(key: string, value: any, options?: SetOptions): Promise<void>
await kvs.setSecret('flux:hmacSecret', 'my-secret-value');

// Get: returns undefined if key doesn't exist
const secret = await kvs.getSecret('flux:hmacSecret');

// Delete:
await kvs.deleteSecret('flux:hmacSecret');
```

### Modified Handler (STOR-02, STOR-03)

```javascript
// src/index.js -- changes to handleFluxEvent
import { getFluxSecret, getArgoSecret } from './storage.js';

export const handleFluxEvent = async (event) => {
  const signature = (event.headers?.['x-signature'] ?? [])[0];
  const secret = await getFluxSecret();

  if (!secret) {
    console.warn('FluxCD webhook secret not configured');
    return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
  }

  if (!verifyHmac(event.body, signature, secret)) {
    console.warn('HMAC verification failed');
    return { statusCode: 401, body: 'Unauthorized' };
  }
  // ...rest unchanged
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@forge/api` storage | `@forge/kvs` | March 2025 | Legacy module frozen, use `@forge/kvs` for all new code |
| UI Kit 1 (`@forge/ui`) | UI Kit 2 (`@forge/react`) | 2024 | Full React model, `useForm`, `useEffect`, standard React hooks |
| `forge variables set` for secrets | `@forge/kvs` setSecret via admin UI | This phase | Per-installation isolation, self-service configuration |

## Open Questions

1. **`webTrigger.getUrl()` in resolver context**
   - What we know: API exists in `@forge/api`, documented for use in functions
   - What's unclear: Whether it works correctly when called from a resolver function (not a webtrigger function itself)
   - Recommendation: Test in dev environment first. Fallback: use `forge webtrigger` CLI output as static text if needed.

2. **Re-consent timing for `storage:app` scope**
   - What we know: Scope additions require admin consent. App may not work until consent is granted.
   - What's unclear: Exact behavior during the gap -- do webtrigger calls fail entirely, or only storage calls?
   - Recommendation: Keep env var fallback. Test consent flow on development installation.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7 with native ESM (`--experimental-vm-modules`) |
| Config file | `package.json` jest section |
| Quick run command | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>'` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STOR-01 | KVS setSecret/getSecret/deleteSecret operations | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='storage' -x` | No -- Wave 0 |
| STOR-02 | Handler reads from KVS, falls back to env var | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='index' -x` | Yes (needs modification) |
| STOR-03 | Handler returns 503 when no secret configured | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='index' -x` | Yes (needs new test case) |
| CONF-01 | Resolver setFluxSecret validates and stores | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='resolver' -x` | No -- Wave 0 |
| CONF-02 | Resolver setArgoSecret validates and stores | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='resolver' -x` | No -- Wave 0 |
| CONF-03 | Resolver returns success/error feedback | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='resolver' -x` | No -- Wave 0 |
| CONF-04 | Resolver returns webtrigger URLs | unit | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='resolver' -x` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<changed_module>' -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/storage.test.js` -- covers STOR-01, STOR-02, STOR-03 (mock `@forge/kvs`)
- [ ] `src/__tests__/resolver.test.js` -- covers CONF-01, CONF-02, CONF-03, CONF-04 (mock storage.js + `@forge/api`)
- [ ] Update `src/__tests__/index.test.js` -- mock `storage.js` instead of `process.env`, add 503 "not configured" test case
- [ ] Framework install: `npm install @forge/kvs @forge/resolver @forge/react @forge/bridge`

## Sources

### Primary (HIGH confidence)
- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- setSecret/getSecret/deleteSecret signatures, return values, 128 KiB limit
- [Forge Jira Admin Page module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- manifest config, `render: native`, `useAsConfig`
- [Forge Resolver](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) -- define(), getDefinitions(), payload structure
- [Forge Resources](https://developer.atlassian.com/platform/forge/manifest-reference/resources/) -- UI Kit path points to source `.jsx` file, not directory
- [Forge Textfield](https://developer.atlassian.com/platform/forge/ui-kit/components/textfield/) -- `type="password"` supported
- [Forge Form](https://developer.atlassian.com/platform/forge/ui-kit/components/form/) -- useForm, handleSubmit, register with validation
- [Forge Web Trigger API](https://developer.atlassian.com/platform/forge/runtime-reference/web-trigger-api/) -- `webTrigger.getUrl(moduleKey)` for CONF-04
- [KVS migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/) -- `@forge/api` storage frozen March 2025

### Secondary (MEDIUM confidence)
- [Community: webtrigger storage access](https://community.developer.atlassian.com/t/access-storage-api-in-webtrigger/50997) -- webtrigger and resolver share storage scope
- [Community: password textfield](https://community.developer.atlassian.com/t/password-textfield/48355) -- UI Kit password field limitations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages are official Forge packages with current documentation
- Architecture: HIGH -- patterns verified against official docs, aligned with locked decisions
- Pitfalls: HIGH -- verified against official docs and community reports

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable Forge platform, 30-day window)
