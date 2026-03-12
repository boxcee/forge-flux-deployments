# GitOps Deployments for Jira

## What This Is

Forge app that receives FluxCD/ArgoCD webhook events and creates Jira deployment records via the Deployments API. Runs as a Forge webtrigger function on Node.js 22. Documentation site, legal pages, and Marketplace listing are published on GitHub Pages.

## Core Value

Customers can install the app and configure their webhook secrets entirely through the Atlassian UI — no CLI access or vendor intervention required.

## Requirements

### Validated

- v1.0: GitHub Pages site with just-the-docs theme, sidebar navigation, search
- v1.0: Setup guide covers both FluxCD and ArgoCD configuration
- v1.0: Privacy policy and terms of service live at GitHub Pages URLs
- v1.0: Marketplace listing complete with accurate copy, live URLs, app icon
- v1.0: Annotation reference tables complete for FluxCD and ArgoCD
- v1.0: Troubleshooting page covers auth failures, missing annotations, ignored reasons
- v1.0: Root README.md, LICENSE (ELv2), CONTRIBUTING.md

### Active

- [ ] Replace `forge variables set` with admin config UI for per-installation secrets
- [ ] Admin page for FluxCD HMAC secret configuration
- [ ] Admin page for ArgoCD bearer token configuration
- [ ] Migrate app code from env vars to Forge Storage for secret retrieval
- [ ] Update setup guide to reflect admin UI configuration flow
- [ ] Update troubleshooting docs for new configuration method
- [ ] Update marketplace listing to reflect self-service configuration

### Out of Scope

- New webhook handlers or CD tool integrations — this milestone is config UX only
- Multi-secret rotation / key management — single active secret per installation is sufficient
- Marketing website beyond GitHub Pages
- Screenshots/video — no running Jira instance available for capture

## Context

- App is a Forge webtrigger app (Node.js 22, ESM, no build step)
- Two webhook handlers: `handleFluxEvent` (HMAC auth) and `handleArgoEvent` (bearer token auth)
- Current secrets (`WEBHOOK_SECRET`, `ARGOCD_WEBHOOK_TOKEN`) set via `forge variables set` — vendor-side only
- Customers cannot configure their own secrets — this is the core problem
- Forge provides `@forge/api` storage API for per-installation data
- Forge Admin Page module (Custom UI or UI Kit) enables settings screens in Jira admin
- Manifest has `licensing: enabled: true` — ready for Marketplace listing
- GitHub repo: `boxcee/forge-flux-deployments`
- Docs site: `https://boxcee.github.io/forge-flux-deployments/`

## Constraints

- **Platform**: Forge runtime — must use Forge-compatible storage and UI modules
- **Security**: Secrets must be stored per-installation, not shared across tenants
- **Backwards compatibility**: Existing webhook endpoints must continue working
- **Accuracy**: Setup docs must match the new configuration flow exactly
- **Marketplace**: P&S tab answers may need updating if data handling changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use GitHub Pages for hosting legal docs | Free, tied to repo, easy to maintain | ✓ Good |
| just-the-docs theme | Full navigation, search, responsive | ✓ Good |
| Single setup guide for both CD tools | Users configure one or both — single page with sections | ✓ Good |
| ELv2 license | Protects against unauthorized redistribution | ✓ Good |
| Replace env vars with Forge Storage + Admin Page | Customers must self-serve secret config | — Pending |

---
*Last updated: 2026-03-12 after v1.1 milestone start*
