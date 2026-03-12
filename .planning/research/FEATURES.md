# Feature Landscape

**Domain:** Forge admin configuration UI for per-installation webhook secret management
**Researched:** 2026-03-12
**Confidence:** HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Admin settings page in Jira | Customers need a place to configure their secrets. `jira:adminPage` module puts it under Apps in Jira admin. | MEDIUM | Requires manifest changes, resolver function, UI Kit resource. |
| FluxCD HMAC secret input | Primary secret. Customers must enter/update their FluxCD webhook HMAC secret. | LOW | Single text field + save button. `kvs.setSecret('flux-hmac-secret', value)`. |
| ArgoCD bearer token input | Second secret. Same pattern as FluxCD. | LOW | Single text field + save button. `kvs.setSecret('argocd-bearer-token', value)`. |
| Per-installation tenant isolation | Forge Storage is automatically namespaced per installation. Secrets from tenant A must never leak to tenant B. | NONE | `@forge/kvs` handles this automatically. No extra work. |
| Migrate webhook handlers to Forge Storage | Currently `process.env.WEBHOOK_SECRET` and `process.env.ARGOCD_WEBHOOK_TOKEN`. Must switch to `kvs.getSecret()`. | MEDIUM | Changes `index.js` both handlers. Must handle secret-not-yet-configured case. |
| Save confirmation feedback | After saving, user must see success/error. Standard form UX. | LOW | UI Kit `SectionMessage` with success/error variant. |
| Non-empty validation | Empty secrets break webhook verification silently. Must reject empty input. | LOW | Client-side required validation + server-side check in resolver. |
| Configuration status indicator | User needs to know which secrets are already configured vs missing. | LOW | Resolver returns `{ configured: boolean }` per secret. Never expose actual values. |
| `storage:app` permission scope | Required by `@forge/kvs`. Must be in manifest. | LOW | Add to `permissions.scopes`. Existing installations get a re-consent prompt. |
| Updated setup documentation | Docs must reflect "configure in Jira admin" instead of "ask vendor to run forge variables set". | MEDIUM | Rewrite setup guide configuration section. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Webhook URL display on admin page | Show webtrigger URL so customers can copy it directly. Eliminates "where's my webhook URL?" support question. | LOW | `webTrigger.getUrl('flux-webhook')` in resolver. Read-only copyable text. |
| Inline help text with docs links | Contextual guidance: "Paste the HMAC secret from your FluxCD notification provider." | LOW | Static text with link to setup guide. |
| Get Started page | `useAsGetStarted: true` shows "Get Started" button post-install in Manage Apps. Guides user directly to config. | LOW | Single manifest property. Improves first-run experience. |
| Per-tool section separation | Visually separate FluxCD and ArgoCD config so single-tool users are not confused. | LOW | Clear section headings or tabs. |
| Clear/delete secret | Allow removing a configured secret to reset to unconfigured state. | LOW | `kvs.deleteSecret()` + confirmation. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Show/reveal secret value | Displaying secrets in the browser increases exposure surface. Once saved, treat as opaque. | Show "Configured" status only. User re-enters if wrong. |
| Secret rotation (old + new simultaneously) | Doubles verification complexity. Two HMAC checks per request. Edge case for v1. | Document "update in both places at the same time" in setup guide. |
| Auto-generate secret button | Secret must match CD tool config. Generating in Jira creates confusion about source of truth. | Document that CD tool is source of truth. |
| Webhook event log / history | Forge has no persistent request logging. Storing payloads adds storage costs and data retention concerns. | Document troubleshooting steps. Point to CD tool logs. |
| Configuration via REST API | Forge admin pages don't expose REST endpoints. Building custom API doubles attack surface. | Admin UI is sufficient for initial setup. |
| Test connection / ping button | Requires self-invocation of webtrigger from Forge, which is not straightforward. High complexity for low value. | Document how to test via `curl` in setup guide. |

## Feature Dependencies

```
[storage:app scope in manifest]
    --> [Forge deploy + user re-consent]

[Admin settings page (jira:adminPage)]
    --> [Resolver function for storage operations]
    --> [UI resource (UI Kit)]
    --> [storage:app scope in manifest]

[FluxCD secret input]
    --> [Admin settings page]
    --> [kvs.setSecret / kvs.getSecret]

[ArgoCD token input]
    --> [Admin settings page]
    --> [kvs.setSecret / kvs.getSecret]

[Configuration status indicator]
    --> [kvs.getSecret]

[Webhook URL display]
    --> [Admin settings page]
    --> [webTrigger.getUrl() API]

[Migrate handlers to Forge Storage]
    --> [kvs.getSecret]
    --> conflicts with process.env (must replace)

[Updated setup docs]
    --> [Admin settings page exists]
    --> [Handler migration complete]
```

### Dependency Notes

- **storage:app scope requires re-consent:** Adding a new permission scope means existing installations get a consent prompt on next use. Plan for this in release communications.
- **Handler migration conflicts with env var approach:** Once handlers read from `kvs.getSecret()`, `forge variables set` no longer works. Breaking change -- existing installations must configure via admin UI after upgrade. Need fallback strategy or migration guide.
- **Docs depend on everything else:** Documentation update is the final step. Must accurately describe the finished UI.

## MVP Recommendation

Prioritize:
1. **Admin page with two secret fields** -- FluxCD HMAC secret and ArgoCD bearer token
2. **Configuration status display** -- configured/not-configured per tool
3. **Save with success/error feedback** -- SectionMessage after save
4. **Migrate webtrigger handlers** -- `kvs.getSecret()` instead of `process.env`
5. **Graceful "not configured" response** -- 503 with helpful message, not silent 401

Defer:
- **Webhook URL display**: Low effort, include if time allows.
- **Delete/clear secret**: Users can overwrite with new value.
- **Documentation updates**: Separate task after UI is built and tested.

## Sources

- [Forge jira:adminPage module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/) -- manifest definition, useAsConfig, useAsGetStarted
- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/) -- kvs.setSecret/getSecret, 128 KiB limit, tenant isolation
- [Forge UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/) -- Form, TextField, Button, SectionMessage
- PROJECT.md -- out of scope constraints

---
*Feature research for: Forge Admin Configuration UI*
*Researched: 2026-03-12*
