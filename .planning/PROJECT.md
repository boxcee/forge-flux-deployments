# GitOps Deployments for Jira — Marketplace Readiness

## What This Is

Documentation and listing polish for a Forge app that receives FluxCD/ArgoCD webhook events and creates Jira deployment records. The app already works. This milestone focuses on getting the existing docs, legal pages, and GitHub Pages site to Atlassian Marketplace publishing quality.

## Core Value

Every documentation page renders correctly on GitHub Pages, passes Atlassian Marketplace review, and accurately reflects what the app does — so the listing is approved on first submission.

## Requirements

### Validated

- v GitHub Pages site exists with Jekyll minimal theme (`docs/_config.yml`)
- v Setup guide covers both FluxCD and ArgoCD configuration (`docs/setup.md`)
- v Privacy policy exists (`docs/privacy-policy.md`)
- v Terms of service exists (`docs/terms-of-service.md`)
- v Marketplace listing draft exists with description, highlights, scopes (`docs/marketplace-listing.md`)
- v Index page exists (`docs/index.md`)
- v App icons exist (`docs/assets/icon.png`, `docs/assets/icon.svg`)

### Active

- [ ] Fix marketplace-listing.md TODO placeholders (Privacy Policy URL, End User Terms URL)
- [ ] Cross-check all docs against actual source code for accuracy
- [ ] Improve GitHub Pages rendering (navigation, links, layout)
- [ ] Add root README.md (GitHub landing page for the repo)
- [ ] Review and strengthen legal docs for Marketplace compliance
- [ ] Ensure annotation reference table is complete and matches code
- [ ] Verify ArgoCD setup instructions match actual payload format in code

### Out of Scope

- New app features — this is docs/listing only
- ArgoCD `envType` annotation docs — code uses `envType` but this is a standard Argo annotation, not custom
- Marketing website beyond GitHub Pages — Marketplace listing + GitHub Pages is sufficient
- Screenshots/video — no running Jira instance available for capture

## Context

- App is a Forge webtrigger app (Node.js 22, ESM, no build step)
- Two webhook handlers: `handleFluxEvent` (HMAC auth) and `handleArgoEvent` (bearer token auth)
- Manifest has `licensing: enabled: true` — ready for paid/free Marketplace listing
- Current docs use Jekyll minimal theme via `remote_theme: pages-themes/minimal@v0.2.0`
- GitHub repo: `boxcee/forge-flux-deployments`
- Flux annotations: `jira`, `env`, `env-type`, `url`, `revision` (short keys in webhook payloads)
- Argo annotations: `jira`, `env`, `envType`, `url` (in `annotations` object of the custom payload)
- The setup.md ArgoCD template sends `envType` not `env-type` — this matches the code

## Constraints

- **Platform**: Must render on GitHub Pages (Jekyll) — no custom build pipelines
- **Marketplace**: Must satisfy Atlassian Marketplace review requirements (privacy policy, EULA, scope justification, security disclosures)
- **No secrets**: Docs must not contain real tokens, URLs, or credentials
- **Accuracy**: Every annotation, API scope, and configuration example must match the actual source code

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use GitHub Pages for hosting legal docs | Free, tied to repo, easy to maintain | — Pending |
| Jekyll minimal theme | Already configured, lightweight, professional | — Pending |
| Single setup guide for both CD tools | Users configure one or both — single page with sections | — Pending |

---
*Last updated: 2026-03-11 after initialization*
