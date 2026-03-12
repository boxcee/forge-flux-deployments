# Pitfalls Research

**Domain:** Forge Admin Config UI + Storage migration for existing webtrigger app
**Researched:** 2026-03-12
**Confidence:** HIGH (verified against official Forge docs and community reports)

## Critical Pitfalls

### Pitfall 1: Breaking Existing Installations on Upgrade (Env Var to Storage)

**What goes wrong:**
Once `index.js` reads secrets from `kvs.getSecret()` instead of `process.env`, all existing installations that configured secrets via `forge variables set` break. The webtrigger returns 503 ("not configured") because no secret exists in KVS yet, even though the env var is still set. Worse: env vars are global (shared across ALL installations) while Storage secrets are per-installation. Removing the env var affects everyone simultaneously, but Storage adoption happens one customer at a time.

**Why it happens:**
`forge variables set` writes to environment variables scoped per app/environment. `kvs.getSecret()` reads from Forge Storage scoped per installation. These are completely separate stores with no automatic migration path between them. Developers test on their own instance where they control both, missing the asymmetry.

**How to avoid:**
1. Add a fallback during a transition period: try `kvs.getSecret()` first, fall back to `process.env` if undefined.
2. Log whether the secret was sourced from Storage or env var on each invocation. Track the ratio. Only remove env vars when env-var-sourced ratio hits zero.
3. Document a clear migration sequence: (a) upgrade app, (b) open admin page, (c) enter secret, (d) verify webhooks work.
4. Never run `forge variables unset WEBHOOK_SECRET` until all active installations have migrated.

**Warning signs:**
- Webhook 503/401 responses after app upgrade
- Missing deployment records in Jira after upgrade
- Sudden spike in failures across multiple installations after env var removal
- Support tickets from customers who haven't touched the admin page

**Phase to address:**
Phase 1 (Storage backend) -- the fallback pattern must ship in the very first deploy. Env var removal is a separate milestone entirely.

**NOTE:** This temporary dual-read path is necessary despite being technical debt. Plan to remove the env var fallback in a future release after confirmed full adoption.

---

### Pitfall 2: Scope Change Triggers Major Version + Customer Consent Gap

**What goes wrong:**
Adding `storage:app` to the manifest is a new scope. Forge treats any scope addition as a major version bump. Existing Marketplace installations receive the update via UPM within 24 hours, but the app **stops working until a Jira admin manually approves** the new scopes. Until consent is granted, the app may not function -- scope-dependent behavior varies by Forge runtime version.

**Why it happens:**
Forge enforces permission scoping by design. New scopes require explicit admin consent. Developers test on their own instance where they control consent instantly. They forget distributed installations require admin action with unpredictable timing.

**How to avoid:**
1. Keep `process.env` fallback so the app still works for installations pending consent (the webtrigger handler can still read env vars without `storage:app` scope).
2. Include re-consent explanation in Marketplace release notes.
3. Time the deployment to coincide with business hours for maximum admin availability.
4. Test the re-consent flow on a development installation first.

**Warning signs:**
- App logs show permission errors post-deploy
- Admin page may not load until consent is granted
- Jira admin pages showing "App requires updated permissions" banners

**Phase to address:**
Phase 1 (Storage backend) -- deploy to staging, install on test site, verify consent prompt appears and app works after approval.

---

### Pitfall 3: Returning Secret Values to the Frontend

**What goes wrong:**
The admin page needs to show whether a secret is configured. A naive resolver returns the actual secret value to the Custom UI frontend for display. The secret is then visible in browser DevTools network tab, Forge tunnel logs, and potentially in browser extensions or Forge analytics.

**Why it happens:**
The simplest implementation of a "view current config" resolver is `return await kvs.getSecret('key')`. Developer wants to show a "reveal" toggle or populate a text field with the current value for editing.

**How to avoid:**
- Never return the actual secret to the frontend. Return `{ configured: boolean }` only.
- Use separate resolver function keys: `getSecretStatus` (returns boolean) and `setSecret` (accepts value, returns success).
- The frontend shows "Configured" or "Not configured" status, never the actual value.

**Warning signs:**
- Full secret visible in browser DevTools Network tab when loading admin page
- Code review finds any path that returns `kvs.getSecret()` result to the frontend

**Phase to address:**
Phase 2 (Admin UI) -- the resolver design must enforce this from day one.

---

### Pitfall 4: Webtrigger Functions Lack User Context for Storage Access

**What goes wrong:**
Webtrigger functions run without Atlassian user context -- `asUser()` calls fail. Developers use a pattern from the admin page resolver (which has user context) and copy it to the webtrigger handler, where it throws authorization errors.

**Why it happens:**
Forge Admin Pages run in user context (the Jira admin browsing the page). Webtriggers run from external HTTP calls with no Atlassian session. The `@forge/kvs` package works at app scope and does not require user context, but developers unfamiliar with this distinction reach for `asUser()` by habit.

**How to avoid:**
- Use `@forge/kvs` directly in the webtrigger handler -- it operates at app scope, not user scope.
- Never use `requestJira().asUser()` or similar user-scoped calls in webtrigger functions.
- Test the webtrigger handler by invoking it via `curl` against a Forge tunnel, not just from the Forge UI test harness.

**Warning signs:**
- Tests pass in the admin UI but webhooks return 401/500
- "Unauthenticated API call via asApp() found" warnings in Forge logs

**Phase to address:**
Phase 1 (Storage backend) -- the webtrigger handler refactor must use app-scoped Storage from the start.

---

### Pitfall 5: Storage Key Mismatch Between Admin Page and Webtrigger

**What goes wrong:**
The admin page resolver calls `kvs.setSecret('webhookSecret', value)` and the webtrigger handler calls `kvs.getSecret('webhook_secret')` -- different key names. `getSecret` returns undefined, the handler compares HMAC against undefined, and all webhooks are rejected.

**Why it happens:**
Storage key names are plain strings with no type system enforcing consistency. Admin page and webtrigger handler are in different source files, possibly developed at different times. No compile-time check that both sides agree on the key.

**How to avoid:**
- Define storage keys as constants in a shared module (e.g., `src/storage-keys.js`) imported by both the admin resolver and the webtrigger handler.
- Write an integration test that sets a secret via the same path the admin page uses, then reads it via the same path the webtrigger uses.
- Handle undefined from `getSecret` explicitly: fall back to env var (during migration) or return 503 "Not configured."

**Warning signs:**
- Webhooks fail with 401 immediately after saving a secret in the admin page
- `getSecret` returns undefined in logs despite admin page showing "saved"

**Phase to address:**
Phase 1 (Storage backend) -- shared key constants are foundational.

---

### Pitfall 6: Using `@forge/api` Storage Instead of `@forge/kvs`

**What goes wrong:**
The legacy storage module in `@forge/api` was frozen as of March 17, 2025. New code using `import { storage } from '@forge/api'` works today but receives no feature updates, bug fixes, or security patches. Additionally, `@forge/api` storage threw `UNDEFINED` errors on missing keys, while `@forge/kvs` returns `KEY_NOT_FOUND` -- different error handling behavior that can cause subtle bugs if you copy patterns from old examples.

**Why it happens:**
Most existing Forge tutorials and Stack Overflow answers reference `@forge/api` storage because `@forge/kvs` is newer. Developers copy-paste older examples.

**How to avoid:**
- Use `@forge/kvs` exclusively for all new storage code.
- Add a lint rule or code review checklist item: no `storage` imports from `@forge/api`.
- Data stored through the legacy module remains intact and accessible via `@forge/kvs` -- no data migration needed, just an import change.
- Handle the `KEY_NOT_FOUND` case explicitly; test the "secret not configured" path in unit tests.

**Warning signs:**
- `import { storage } from '@forge/api'` in new source files
- Missing `@forge/kvs` in `package.json` dependencies
- Error handling assumes thrown exceptions instead of returned error codes

**Phase to address:**
Phase 1 (Storage backend) -- correct package from the start.

---

## Moderate Pitfalls

### Pitfall 7: Empty String Passes Validation But Breaks Auth

**What goes wrong:**
Admin accidentally submits a form with whitespace-only input. `kvs.setSecret('key', '')` succeeds -- Forge does not reject empty strings. All subsequent HMAC verifications fail because `createHmac('sha256', ' ')` produces a different hash than expected.

**Prevention:** Server-side trim and non-empty validation in the resolver before calling `kvs.setSecret()`. Enforce minimum length (e.g., 8 characters). Client-side `required` attribute is a first line of defense but not sufficient alone.

### Pitfall 8: Race Condition on Concurrent Secret Reads During Write

**What goes wrong:** A webhook arrives while an admin is saving a new secret. The webtrigger reads the old secret, verification fails, and the webhook is rejected.

**Prevention:** This is inherently low risk -- KVS writes are atomic and fast. The window is milliseconds. Accept as an expected edge case. CD tools retry on failure. No mitigation needed beyond documentation.

### Pitfall 9: Forge Tunnel Does Not Persist KVS Data Reliably

**What goes wrong:** During local development with `forge tunnel`, secrets saved via the admin page may appear lost between tunnel restarts. Developer thinks storage is broken.

**Prevention:** `forge tunnel` connects to the real Forge runtime -- KVS data should persist. But tunnel disconnects can cause writes to fail silently. Always verify storage-dependent features with `forge deploy` to the development environment.

### Pitfall 10: ESM Import Path for Resolver

**What goes wrong:** The project uses `"type": "module"` (ESM). The resolver file must use `export const handler = ...` syntax. If the manifest `handler:` value does not match the export, Forge silently fails to resolve the function.

**Prevention:** Manifest says `handler: resolver.handler`. File `src/resolver.js` must have `export const handler = resolver.getDefinitions()`. Verify the handler path matches exactly.

### Pitfall 11: Forgetting to Migrate ArgoCD Token

**What goes wrong:** Developer migrates FluxCD `WEBHOOK_SECRET` to Storage but forgets `ARGOCD_WEBHOOK_TOKEN`. The ArgoCD handler still reads from `process.env` only. When env vars are eventually removed, ArgoCD webhooks break while FluxCD continues working.

**Prevention:** Both handlers must be migrated together. The shared constants module should define keys for both secrets. Test matrix must cover both FluxCD and ArgoCD paths.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Dual read path (Storage + env var fallback) | Zero-downtime migration | Two code paths to maintain, confusion about source of truth | During migration only -- remove env var path once adoption is 100% |
| Storing secrets in plain KVS (`set`) instead of `setSecret` | Simpler API, secrets queryable | Secrets accessible via `kvs.query()`, lower security posture | Never -- always use `setSecret` for credentials |
| Hardcoded storage keys in each file | Faster to write | Key drift between admin page and webtrigger handler | Never -- use shared constants module |
| Skipping `@forge/kvs` migration (staying on `@forge/api` storage) | No package change needed | `@forge/api` storage module frozen since March 2025, no new features or fixes | Never for new code |
| Single resolver for both get and set operations | Fewer functions to register | Harder to restrict read vs write, easier to leak secrets | Never -- separate `getStatus` and `setSecret` resolvers |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Webtrigger + Storage | Using `asUser()` for Storage calls in webtrigger context | Use `@forge/kvs` directly -- works at app scope, no user context needed |
| Admin Page + Webtrigger | Different function modules sharing state via Storage without key agreement | Shared constants module (`src/storage-keys.js`) for all storage keys |
| Forge deploy + scope changes | Deploying and assuming existing installations auto-update seamlessly | Major version requires admin consent; plan for the consent gap period |
| Custom UI + resolver | Returning secret values to the frontend for "edit" UI | Return only `{ configured: boolean }` -- treat save as write-only |
| `@forge/kvs` + manifest | Forgetting to add `storage:app` scope when adopting `@forge/kvs` | Add scope before first deploy that uses Storage; test in staging environment |
| Admin page + existing env vars | Removing env vars immediately after admin page ships | Keep env vars as fallback; monitor source ratio; remove only at zero env-var usage |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Calling `getSecret` on every webhook invocation | ~50-100ms added latency per webhook | Acceptable for this use case -- deployment events are low volume. Do NOT cache secrets (must be fresh). | >1000 webhooks/minute, unlikely for deployment events |
| KVS 128 KiB value size limit | Storage write fails | Webhook secrets are <1 KiB; validate input length in admin UI as defense-in-depth | Only if storing complex config objects |
| Admin page loading all config on mount | Slow initial render if many Storage calls | Load only what is needed; `getSecret` is fast for single keys | >10 config keys fetched on page load |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `kvs.set` instead of `kvs.setSecret` for webhook secrets | Secrets readable via `kvs.query()`, exposed in debug tooling | Always use `setSecret`/`getSecret` pair for any credential |
| Returning full secret value to Custom UI frontend | Secret visible in browser DevTools, Forge tunnel logs | Return `{ configured: boolean }` only -- never the actual value |
| No input validation on admin page secret field | Empty string saved as secret, breaking HMAC verification | Validate minimum length, trim whitespace, reject empty strings |
| Logging the secret value in webtrigger handler | Secret in Forge runtime logs, potentially in Atlassian log infrastructure | Never log secret values. Log `secretSource: 'storage' \| 'env'` for debugging |
| Not encrypting the env var during migration period | `forge variables set` without `--encrypt` stores value readable | Always use `forge variables set --encrypt` for secrets |
| Missing admin-only restriction on resolver | Non-admin users could invoke resolver to overwrite secrets | Forge admin pages are restricted to Jira admins by default -- verify this holds; do not expose resolver outside admin page context |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback after saving secret | User unsure if save worked, re-enters or navigates away | Show success banner with timestamp; show "configured" indicator |
| No way to verify secret is correct after entry | User enters wrong secret, webhooks fail silently for days | After save, display last webhook status or offer a "test connection" button |
| Requiring page refresh to see updated state | User saves, sees stale state, thinks save failed | Optimistic UI update on save success |
| No "Get Started" guidance on admin page | New installs see empty config, don't know what to enter | Use `useAsGetStarted: true` admin page with inline setup instructions |
| Separate pages for FluxCD and ArgoCD config | Users confused about which page to use | Single admin page with sections/tabs for each provider |
| No indication of which auth method is active | User doesn't know if webhook uses Storage or env var | Show config source: "Using admin-configured secret" vs "Using default" |

## "Looks Done But Isn't" Checklist

- [ ] **Storage scope:** `storage:app` added to `permissions.scopes` in `manifest.yml` -- deploy works but Storage calls fail without it
- [ ] **Fallback logic:** Webtrigger handler reads from Storage first, falls back to `process.env` -- verify BOTH paths with tests
- [ ] **Key consistency:** Storage keys identical between admin resolver and webtrigger handler -- use shared constants, not string literals
- [ ] **Empty secret handling:** Admin page rejects empty string saves; webtrigger handler treats undefined secret as "not configured" (503), not "skip auth" (200)
- [ ] **Secret masking:** Resolver never returns actual secret to frontend -- verify in DevTools Network tab
- [ ] **Consent flow tested:** Deploy to staging, install on test site, verify consent prompt and post-consent functionality
- [ ] **Env var still works:** After deploying Storage code, verify installations WITHOUT admin-configured secrets still work via env var fallback
- [ ] **`@forge/kvs` not `@forge/api`:** New code uses `@forge/kvs` package, not the frozen `@forge/api` storage module
- [ ] **Both secrets migrated:** Both `WEBHOOK_SECRET` (FluxCD HMAC) and `ARGOCD_WEBHOOK_TOKEN` (ArgoCD bearer) have Storage+fallback logic
- [ ] **P&S tab updated:** Privacy and Security tab in Marketplace portal updated to reflect per-installation config data storage
- [ ] **Admin page accessible:** Admin page appears in Jira admin sidebar; `useAsConfig: true` adds Configure button in Manage Apps
- [ ] **ESM handler path:** Manifest `handler:` value matches the exact export in the resolver source file

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Removed env vars too early | MEDIUM | Re-set env vars via `forge variables set --encrypt`, redeploy. Webhooks resume within minutes. No data loss (missed deployment records only). |
| Secret exposed to frontend | HIGH | Rotate exposed secret immediately. Fix resolver. Redeploy. Notify affected customers to regenerate webhook secrets. |
| Wrong Storage key in webtrigger | LOW | Fix the key constant, redeploy. Secrets still in Storage under the correct key. |
| Scope change broke existing installs | MEDIUM | Cannot roll back scope changes. Communicate urgently to admins to approve consent. Keep env var fallback longer than planned. |
| Used `kvs.set` instead of `kvs.setSecret` | MEDIUM | Read with `kvs.get`, rewrite with `kvs.setSecret`, delete old key with `kvs.delete`. One-time migration function. |
| Empty string saved as secret | LOW | Add validation, redeploy. Admin re-enters correct secret. No permanent damage. |
| P&S tab not updated | MEDIUM | Update P&S tab answers in Marketplace portal. May require re-review. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Breaking existing installations (Pitfall 1) | Phase 1: Storage backend | Both Storage and env var paths tested; fallback works |
| Scope consent gap (Pitfall 2) | Phase 1: Storage backend | Deploy to staging, install on test site, confirm consent flow |
| Secret exposed to frontend (Pitfall 3) | Phase 2: Admin UI | DevTools network audit during code review |
| Webtrigger user context (Pitfall 4) | Phase 1: Storage backend | `curl` test against Forge tunnel with Storage-backed secret |
| Storage key mismatch (Pitfall 5) | Phase 1: Storage backend | Shared constants module exists; both admin and webtrigger import it |
| `@forge/api` vs `@forge/kvs` (Pitfall 6) | Phase 1: Storage backend | Import audit -- zero `@forge/api` storage imports in new code |
| Empty secret accepted (Pitfall 7) | Phase 2: Admin UI | Test saving empty string; verify rejection |
| ArgoCD token forgotten (Pitfall 11) | Phase 1: Storage backend | Both handlers have Storage+fallback in tests |
| ESM handler path (Pitfall 10) | Phase 2: Admin UI | Forge deploy succeeds; admin page loads |
| P&S tab outdated | Phase 3: Docs + Marketplace update | P&S tab reflects "stores per-installation config" |
| Premature env var removal | Post-milestone | Logging confirms 0% env-var-sourced requests |

## Sources

- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- `setSecret`/`getSecret` reference, 128 KiB limit, TTL support, HIGH confidence
- [Forge Key-Value Store](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-basic/) -- `@forge/kvs` migration notice, `@forge/api` storage frozen March 2025, HIGH confidence
- [Forge Web Trigger module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/web-trigger/) -- no built-in auth, no user context, HIGH confidence
- [Forge Jira Admin Page module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- manifest config, `useAsConfig`/`useAsGetStarted`, HIGH confidence
- [Forge App Versions](https://developer.atlassian.com/platform/forge/versions/) -- scope changes trigger major version requiring consent, HIGH confidence
- [Forge Permissions / Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/) -- `storage:app` scope requirement, HIGH confidence
- [Community: Env vars and app distribution](https://community.developer.atlassian.com/t/environment-variables-and-app-distribution/49622) -- env vars are per-app not per-installation, confirmed by Atlassian staff, HIGH confidence
- [Community: Access Storage API in webtrigger](https://community.developer.atlassian.com/t/access-storage-api-in-webtrigger/50997) -- webtriggers can access Storage with `storage:app` scope, MEDIUM confidence
- [Community: Storage API unauthorized errors from webtrigger](https://community.developer.atlassian.com/t/calling-storage-api-using-web-trigger-sometimes-gives-unauthorized-error/94895) -- intermittent platform issue (resolved), MEDIUM confidence
- [Community: Password textfield in Forge UI Kit](https://community.developer.atlassian.com/t/password-textfield/48355) -- `type="password"` limitations, MEDIUM confidence
- [Forge KVS migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/) -- KEY_NOT_FOUND vs UNDEFINED behavior change, HIGH confidence

---
*Pitfalls research for: Forge Admin Config UI + Storage migration*
*Researched: 2026-03-12*
