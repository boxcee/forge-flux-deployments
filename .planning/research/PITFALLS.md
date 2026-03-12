# Domain Pitfalls

**Domain:** Forge admin configuration UI for webhook secret management
**Researched:** 2026-03-12
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Breaking Existing Installations on Upgrade

**What goes wrong:** Once `index.js` reads secrets from `kvs.getSecret()` instead of `process.env`, all existing installations that configured secrets via `forge variables set` will break. The webtrigger returns 503 ("not configured") because no secret exists in KVS yet, even though the env var is still set.

**Why it happens:** `forge variables set` writes to environment variables. `kvs.getSecret()` reads from Forge Storage. They are completely separate stores with no migration path between them.

**Consequences:** All existing webhook integrations stop working immediately on upgrade. Deployment tracking goes dark.

**Prevention:**
1. Add a fallback during a transition period: try `kvs.getSecret()` first, fall back to `process.env` if null
2. Document a clear migration sequence: (a) upgrade app, (b) open admin page, (c) re-enter secrets, (d) verify webhooks work
3. After a release cycle, remove the `process.env` fallback

**Detection:** Webhook 503 responses. Missing deployment records in Jira after app upgrade.

**NOTE:** This contradicts the "no fallback" anti-pattern in ARCHITECTURE.md. For the transition period only, the fallback is necessary. Remove it in the next release.

---

### Pitfall 2: Re-Consent Prompt Blocks Silent Upgrades

**What goes wrong:** Adding `storage:app` scope to the manifest triggers a re-consent prompt for existing installations. Until a Jira admin approves the new permissions, the app may not function (scope-dependent behavior varies by Forge runtime version).

**Why it happens:** Forge enforces permission scoping. New scopes require explicit admin consent. This is by design for security, but the upgrade UX is disruptive.

**Consequences:** Period of broken functionality between app deploy and admin consent. CD tools keep sending webhooks that fail.

**Prevention:**
1. Include re-consent in release communications
2. Time the deployment to coincide with admin availability
3. Test the re-consent flow on a development installation first

**Detection:** App logs show permission errors. Admin page may not load until consent is granted.

---

### Pitfall 3: Returning Secret Values to the Frontend

**What goes wrong:** Resolver function returns the actual secret value to the UI for display or verification. The secret is now in the browser, in memory, in network logs, potentially in browser extensions.

**Why it happens:** Developer wants to show a "reveal" toggle or confirm the saved value. Feels intuitive but violates security principles.

**Consequences:** Secret exposure. Browser extensions, dev tools, or network proxies could capture the value.

**Prevention:** Never return secret values from resolver. Only return `{ configured: boolean }`. The frontend shows "Configured" or "Not configured" status, never the actual value.

**Detection:** Code review. Search resolver for any path that returns the result of `kvs.getSecret()` directly.

## Moderate Pitfalls

### Pitfall 4: Race Condition on Concurrent Secret Reads During Write

**What goes wrong:** A webhook arrives while an admin is saving a new secret. The webtrigger reads the old secret (or null if first-time save is in progress), verification fails, and the webhook is rejected.

**Prevention:** This is inherently low risk -- KVS writes are atomic and fast. The window is milliseconds. Accept this as an expected edge case. If it happens, the CD tool retries. No mitigation needed beyond documentation.

### Pitfall 5: Empty String Passes Validation But Breaks Auth

**What goes wrong:** Admin accidentally submits a form with whitespace-only input. The resolver stores an empty or whitespace string as the secret. All subsequent HMAC verifications fail because `createHmac('sha256', ' ')` produces a different hash than expected.

**Prevention:** Server-side trim and non-empty validation in the resolver before calling `kvs.setSecret()`. Client-side `required` attribute on the text field is a first line of defense but not sufficient alone.

### Pitfall 6: KVS getSecret Returns Null vs Throwing on Missing Key

**What goes wrong:** Developer expects `kvs.getSecret()` to throw when a key does not exist (like the legacy `@forge/api` storage which threw `UNDEFINED` error). Instead, `@forge/kvs` returns a `KEY_NOT_FOUND` error. Code that catches a generic exception may handle it differently than expected.

**Prevention:** Handle the `KEY_NOT_FOUND` case explicitly, or check for null/undefined return value. Test the "secret not configured" path in unit tests.

### Pitfall 7: Forge Tunnel Does Not Persist KVS Data

**What goes wrong:** During local development with `forge tunnel`, secrets saved via the admin page may not persist between tunnel restarts. Developer thinks storage is broken.

**Prevention:** `forge tunnel` connects to the real Forge runtime -- KVS data should persist. But tunnel disconnects can cause writes to fail silently. Always verify with a `forge deploy` to the development environment for storage-dependent features.

## Minor Pitfalls

### Pitfall 8: UI Kit Component Import Errors

**What goes wrong:** Importing a UI Kit component that does not exist in the installed `@forge/react` version. Error messages from Forge are not always clear.

**Prevention:** Pin `@forge/react` to a specific major version (`^11`). Check the [UI Kit components page](https://developer.atlassian.com/platform/forge/ui-kit/components/) for available components before using them. The key components needed (Form, TextField, Button, SectionMessage, Stack, Text) are all stable.

### Pitfall 9: ESM Import Path for Resolver

**What goes wrong:** The project uses `"type": "module"` (ESM). The resolver file must use `export const handler = ...` syntax. If the manifest `handler:` value does not match the export, Forge silently fails to resolve the function.

**Prevention:** Manifest says `handler: resolver.handler`. File `src/resolver.js` must have `export const handler = resolver.getDefinitions()`. Verify the handler path matches exactly.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Manifest changes | Re-consent prompt (Pitfall 2) | Test on dev env first. Plan admin notification. |
| Resolver implementation | Returning secret values (Pitfall 3) | Code review gate. Only return booleans. |
| Storage migration | Breaking existing installs (Pitfall 1) | Temporary process.env fallback. Migration docs. |
| Input validation | Empty string (Pitfall 5) | Server-side trim + non-empty check. |
| KVS integration | Null vs throw (Pitfall 6) | Test missing-key path explicitly. |
| Frontend development | Component imports (Pitfall 8) | Use only documented stable components. |

## Sources

- [Forge KVS migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/) -- KEY_NOT_FOUND vs UNDEFINED behavior change
- [Forge Secret Store](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- encryption, per-installation scoping
- [Forge permissions](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/) -- scope consent model
- [Forge UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/) -- component availability
- [Community: Storing secrets in Forge](https://community.developer.atlassian.com/t/storing-secrets-in-forge/85786) -- community patterns for secret management

---
*Pitfalls research for: Forge Admin Configuration UI*
*Researched: 2026-03-12*
