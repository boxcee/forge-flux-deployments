# Research Summary: Admin Configuration UI

**Domain:** Forge admin page for per-installation webhook secret management
**Researched:** 2026-03-12
**Overall confidence:** HIGH

## Executive Summary

This milestone adds a Jira admin page where customers configure their own FluxCD HMAC secret and ArgoCD bearer token. The current approach (vendor runs `forge variables set`) is the only thing preventing true self-service. The solution is straightforward: a `jira:adminPage` module using UI Kit (`@forge/react`) that stores secrets via `@forge/kvs` Secret Store, plus a migration of the webtrigger handlers from `process.env` to `kvs.getSecret()`.

The stack additions are well-scoped. Four new npm packages (`@forge/react`, `@forge/resolver`, `@forge/bridge`, `@forge/kvs`), three new source files (`src/frontend/index.jsx`, `src/resolver.js`, tests), and manifest changes (admin page module, resolver function, resource declaration, `storage:app` scope). No build pipeline is needed -- UI Kit with `render: native` handles bundling.

The dominant risk is the upgrade path for existing installations. Switching from `process.env` to `kvs.getSecret()` is a breaking change: secrets configured via `forge variables set` are invisible to KVS. A temporary fallback (try KVS first, fall back to env var) is necessary for the transition period. The secondary risk is the `storage:app` scope addition triggering re-consent for existing installations, creating a brief period of broken functionality until a Jira admin approves the new permissions.

UI Kit (`@forge/react`) is the correct choice over Custom UI. The admin page is a simple settings form (two text fields, two save buttons, status indicators). Custom UI would require a bundler (Webpack/Vite), an `index.html` entry point, and a `static/` resource directory -- overhead with zero benefit for this use case. UI Kit renders natively inside Jira admin with Atlassian Design System components, which is exactly what a settings page should look like.

## Key Findings

**Stack:** Add `@forge/kvs` (secret storage), `@forge/react` + `@forge/resolver` + `@forge/bridge` (UI Kit admin page). Use `render: native` in manifest.

**Architecture:** Three new components (frontend JSX, resolver, KVS integration) bridged by the standard Forge invoke pattern. Existing auth modules (`hmac.js`, `bearer.js`) are pure functions accepting secrets as parameters -- no changes needed.

**Critical pitfall:** Breaking existing installations on upgrade. Process.env secrets are invisible to KVS. Need a temporary fallback during transition.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Admin Page + KVS Integration** - Build the admin UI and resolver, wire up KVS secret storage.
   - Addresses: Admin settings page, secret input fields, status indicators, save feedback
   - Avoids: Over-engineering (no Custom UI, no secret rotation, no REST API)
   - Deliverable: Working admin page where secrets can be saved and read back as status

2. **Webtrigger Migration** - Switch handlers from `process.env` to `kvs.getSecret()` with transition fallback.
   - Addresses: Handler migration, graceful "not configured" response, backwards compatibility
   - Avoids: Breaking existing installations without warning (Pitfall 1)
   - Deliverable: Webhooks authenticated via KVS-stored secrets, env var fallback for transition

3. **Documentation Update** - Rewrite setup guide, update troubleshooting, update marketplace listing.
   - Addresses: Setup guide rewrite, troubleshooting additions, marketplace listing update
   - Avoids: Documenting a moving target (waits until UI is final)
   - Deliverable: Accurate docs reflecting the admin UI configuration flow

**Phase ordering rationale:**
- Phase 1 before Phase 2 because the admin page must exist to store secrets before handlers can read them
- Phase 2 before Phase 3 because docs must describe the final behavior, not an intermediate state
- Phases 1 and 2 could potentially be combined into a single phase since the admin page is useless without the handler migration, and the handler migration is pointless without the admin page

**Research flags for phases:**
- Phase 1: Standard Forge patterns. Official docs are comprehensive. No deeper research needed.
- Phase 2: Test the `process.env` fallback approach on a dev environment. Verify that `process.env` still works after adding `storage:app` scope. LOW uncertainty.
- Phase 3: Standard documentation work. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified on npm with recent versions. Official Forge docs confirm APIs. |
| Features | HIGH | Feature set is well-constrained by PROJECT.md. Anti-features clearly scoped. |
| Architecture | HIGH | Standard Forge patterns (admin page + resolver + KVS). Official examples exist. |
| Pitfalls | HIGH | Migration risk (Pitfall 1) is the main concern. Well-understood with clear mitigation. |

## Gaps to Address

- **Process.env fallback behavior:** Verify that `process.env.WEBHOOK_SECRET` still works after adding `storage:app` scope and deploying with the new manifest. Test on dev environment.
- **Re-consent UX:** Confirm what happens to in-flight webhooks during the re-consent window. Do they queue, fail silently, or return errors?
- **UI Kit TextField for secrets:** Forge UI Kit has no dedicated password/secret field. Standard TextField will show the value as typed. This is acceptable (the value is never redisplayed after save), but worth noting in the setup guide.

## Sources

### Primary (HIGH confidence)
- [Forge jira:adminPage manifest reference](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/)
- [Forge Secret Store API](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api-secret/)
- [Forge KVS migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/)
- [Forge Resolver reference](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/)
- [Forge UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)
- [Forge UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/)
- [Forge manifest permissions](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/)
- [@forge/react on npm](https://www.npmjs.com/package/@forge/react) -- v11.9.0
- [@forge/kvs on npm](https://www.npmjs.com/package/@forge/kvs) -- v1.2.0
- [@forge/resolver on npm](https://www.npmjs.com/package/@forge/resolver) -- v1.7.1

### Secondary (MEDIUM confidence)
- [Community: Storing secrets in Forge](https://community.developer.atlassian.com/t/storing-secrets-in-forge/85786)
- [Community: Storage API in admin panel app](https://community.developer.atlassian.com/t/storage-api-in-admin-panel-app/72923)

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
