# GitOps Deployments for Jira

## What This Is

Forge app that receives FluxCD/ArgoCD webhook events and creates Jira deployment records via the Deployments API. Runs as a Forge webtrigger function on Node.js 22. Jira admins configure webhook secrets through the built-in admin settings page. Documentation site, legal pages, and Marketplace listing are published on GitHub Pages.

## Core Value

Customers can install the app and configure their webhook secrets entirely through the Atlassian UI — no CLI access or vendor intervention required.

## Requirements

### Validated

- ✓ GitHub Pages site with just-the-docs theme, sidebar navigation, search — v1.0
- ✓ Setup guides for FluxCD and ArgoCD cross-checked against source code — v1.0
- ✓ Privacy policy and terms of service live at GitHub Pages URLs — v1.0
- ✓ Marketplace listing complete with accurate copy, live URLs, app icon — v1.0
- ✓ Annotation reference tables complete for FluxCD and ArgoCD — v1.0
- ✓ Troubleshooting page covers auth failures, missing annotations, ignored reasons — v1.0
- ✓ Root README.md, LICENSE (ELv2), CONTRIBUTING.md — v1.0
- ✓ Admin page for FluxCD HMAC secret and ArgoCD bearer token configuration — v1.1
- ✓ KVS per-installation secret storage with env var fallback — v1.1
- ✓ Webhook handlers migrated from env vars to KVS storage — v1.1
- ✓ 503 error when secrets not configured — v1.1
- ✓ Setup guide, troubleshooting, marketplace listing updated for admin UI flow — v1.1

### Active

- [ ] SQL-backed webhook event log with per-invocation recording — v1.2
- [ ] Admin page Event Log tab with stats strip and filterable table — v1.2
- [ ] Scheduled trigger for 30-day log retention cleanup — v1.2
- [ ] CHANGELOG.md tracking releases — v1.2
- [ ] Version bump to 1.2.0 in package.json — v1.2

### Out of Scope

- Secret rotation / key management — single active secret per installation is sufficient
- Custom UI (React iframe) — UI Kit is sufficient for settings form
- Multi-tenant secret scoping — Forge KVS provides automatic per-installation isolation
- Marketing website beyond GitHub Pages
- Screenshots/video — no running Jira instance available for capture
- KYC/KYB verification — manual process in Atlassian Partner portal

## Context

Shipped v1.1 with 2,172 LOC JavaScript/JSX across 4 source modules + admin page frontend.
Tech stack: Forge (Node.js 22, ESM), @forge/kvs, @forge/resolver, @forge/react (UI Kit).
148 tests passing across 8 test suites.
GitHub repo: `boxcee/forge-flux-deployments`
Docs site: `https://boxcee.github.io/forge-flux-deployments/`

**Known issues:**
- `deleteFluxSecret`/`deleteArgoSecret` resolver handlers exist but no UI delete button
- `storage:app` scope addition triggers re-consent for existing installations
- UI Kit has no password TextField — secret value visible while typing (not redisplayed after save)
- KYC/KYB verification blocks actual Marketplace submission

## Constraints

- **Platform**: Forge runtime — must use Forge-compatible storage and UI modules
- **Security**: Secrets must be stored per-installation, not shared across tenants
- **Backwards compatibility**: Env var fallback ensures existing installations work during migration
- **Accuracy**: Setup docs must match the current configuration flow exactly

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use GitHub Pages for hosting legal docs | Free, tied to repo, easy to maintain | ✓ Good |
| just-the-docs theme | Full navigation, search, responsive | ✓ Good |
| Single setup guide for both CD tools | Users configure one or both — single page with sections | ✓ Good |
| ELv2 license | Protects against unauthorized redistribution | ✓ Good |
| UI Kit over Custom UI | Settings form is two text fields, no bundler needed | ✓ Good |
| @forge/kvs Secret Store | Per-installation isolation, Forge-native, no external deps | ✓ Good |
| Env var fallback in storage.js | Bridge for existing installations during scope re-consent | ✓ Good |
| 503 for unconfigured secrets | Clearer than 500, signals recoverable state | ✓ Good |
| Combined admin page + handler migration | Neither is useful alone — single phase | ✓ Good |
| forge variables set as developer fallback | Not removed; storage.js env fallback supports it | ✓ Good |

| Forge SQL for event log | Queryable storage, proper indexing, unlimited rows — right tool for a log | — Pending |
| Keyset pagination over OFFSET | Correct under concurrent writes, no skipped/duplicate rows | — Pending |
| Awaited log writes with swallowed errors | Ensures write completes before Forge runtime reclaims context | — Pending |

---
*Last updated: 2026-03-16 after v1.2 milestone start*
