# Project Research Summary

**Project:** GitOps Deployments for Jira — Atlassian Marketplace Listing
**Domain:** Atlassian Marketplace submission for a Forge DevOps deployment tracking app
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

This project is a Forge webtrigger app (already built and functional) that needs to be submitted to the Atlassian Marketplace. The work is documentation and submission logistics, not feature development. The app receives FluxCD/ArgoCD webhook events and creates Jira deployment records — it is stateless, Forge-native, and processes no personal data. Because the app itself is done, the entire roadmap is about: making the GitHub Pages documentation site professional and navigable, filling compliance requirements for Marketplace review, and navigating the submission process without hitting known blockers.

The recommended approach is a three-phase sequence: first make the docs site work properly (switch to just-the-docs theme for navigation, cross-check content accuracy), then prepare everything required for submission (fill TODO placeholders with live URLs, draft Privacy & Security tab answers, verify production deployment), then execute the submission itself (start KYC early — it blocks everything else). The architecture is intentionally simple: a flat 5-page Jekyll site on GitHub Pages, with no build pipeline beyond Jekyll's native GitHub Pages integration.

The dominant risks are process-based, not technical. KYC/KYB verification can take weeks and must start before code or docs work begins. The Privacy Policy and Terms URLs must resolve to live, rendered pages before submission. There is an undocumented Marketplace portal quirk (making the wrong version public causes "lacks details" rejection). Missing or inconsistent Privacy & Security tab answers are the most common cause of cloud app listing delays. None of these risks require novel engineering — they require checklists and sequencing.

## Key Findings

### Recommended Stack

The existing `jekyll-theme-minimal` is inadequate for a multi-page documentation site: it has no sidebar navigation, no search, and no breadcrumbs. Users landing on any non-index page cannot navigate without manually editing the URL. The recommended fix is migrating to `just-the-docs` via `remote_theme: just-the-docs/just-the-docs@v0.12.0` in `_config.yml`. This is GitHub Pages native (no custom build pipeline), gives sidebar nav, client-side search, and responsive layout for free. Alternatively, the architecture research identified that a `_layouts/default.html` override to the minimal theme is a viable lighter-weight path for 4 pages — but just-the-docs is the better long-term choice.

**Core technologies:**
- Jekyll (GitHub Pages built-in): Static site generator — zero-config deployment from `docs/` folder, no Actions pipeline needed
- just-the-docs v0.12.0: Documentation theme — sidebar nav, search, TOC, breadcrumbs out of the box; far superior to current minimal theme
- GitHub Pages: Hosting — free, tied to repo, satisfies Atlassian's requirement for publicly accessible URLs
- GitHub Actions + markdownlint-cli2: Markdown linting CI — catch broken formatting before merge, lightweight

### Expected Features

The Marketplace submission has two distinct feature sets: hard requirements that block approval, and polish that improves conversion after listing.

**Must have (table stakes — blocks submission):**
- Privacy Policy at a live, publicly accessible URL — exists in repo, needs GitHub Pages deployed and URL filled into listing
- End User Terms at a live, publicly accessible URL — same status as above
- Setup documentation (install + configure) — exists, needs cross-check against source code for accuracy
- API scope justification — already drafted in marketplace-listing.md
- Remote hostname disclosure — already documented as "None"
- App icon meeting Atlassian branding guidelines — exists, needs verification
- Privacy & Security tab completed in Marketplace portal — 20+ fields, straightforward answers for a stateless app
- Security questionnaire completed — 2025 requirement, app's HMAC + bearer token auth should pass
- KYC/KYB partner verification — administrative, takes 2-3 business days

**Should have (competitive, improves trust and conversion):**
- Troubleshooting / FAQ page — does not exist, reduces support burden
- Architecture data-flow diagram (Mermaid) — does not exist, builds trust for security-conscious buyers
- Root README.md for the GitHub repo — does not exist, flagged as active task
- Complete annotation reference table (Flux + Argo with all keys) — partially done
- Changelog or GitHub Releases — does not exist, signals active maintenance

**Defer (v2+):**
- Demo video — requires a running Jira instance with real deployment data
- Screenshots of Jira deployment panel — same constraint
- Cloud Fortified certification — requires bug bounty, pen testing, incident management

### Architecture Approach

The documentation site is a flat 5-page Jekyll site (index, setup, privacy-policy, terms-of-service, marketplace-listing). The critical architectural move is adding a layout layer — either via just-the-docs theme (recommended) or a `_layouts/default.html` override on the minimal theme — to give consistent navigation across all pages. The layout is the unblocking dependency: everything else (content improvements, new pages, URL finalization) depends on the site rendering correctly with working navigation first.

**Major components:**
1. `docs/_config.yml` — theme selection, site title, nav config; switching theme here changes the entire site experience
2. `_layouts/default.html` (or just-the-docs equivalent) — navigation sidebar, footer with legal links; must exist before other pages are polished
3. `docs/*.md` pages — content layer (index, setup, privacy-policy, terms-of-service); each needs Jekyll front matter for nav ordering
4. `docs/assets/` — icons and images; currently only has icon files, needs at least one workflow diagram before submission
5. `marketplace-listing.md` — internal reference for submission form fields; should remain unlisted from public nav

### Critical Pitfalls

1. **KYC/KYB not started early enough** — this is the only pitfall that cannot be fixed with more work hours. Start Marketplace Partner profile and KYC verification immediately, in parallel with all documentation work. It can take weeks.

2. **Legal URLs not live before submission** — `marketplace-listing.md` has TODO placeholders for both Privacy Policy and Terms URLs. GitHub Pages must be deployed and rendering correctly before these URLs can be filled in, and those URLs must be in the listing form before Atlassian will accept the submission.

3. **Privacy & Security tab incomplete or contradicting privacy policy** — this is a separate form in the Marketplace portal, not just a privacy policy link. Draft all answers before entering the portal. Key answers for this stateless app: no data stored outside Atlassian, no external hosts contacted, no PATs required. Answers must align exactly with what privacy-policy.md says.

4. **Undocumented versioning quirk causes "lacks details" rejection** — after submission, Atlassian generates a second version ("Released by Marketplace Hub"). The developer must make THIS version public, not their own submitted version. Making the wrong one public triggers a misleading rejection with no clear error message.

5. **Licensing manifest / code mismatch** — `manifest.yml` has `licensing: enabled: true` but source code has zero license checks. For a free app, either remove this from the manifest or implement a minimal check. Leaving it inconsistent may trigger reviewer questions.

## Implications for Roadmap

Based on research, the phase structure follows the hard dependency chain: deploy docs site → finalize submission materials → execute submission. KYC runs in parallel from day one.

### Phase 0: KYC Pre-work (Parallel Track)
**Rationale:** KYC is the only blocker with a non-deterministic timeline (2-3+ business days, potentially weeks). It must start immediately and run in parallel with all other phases. Nothing in Phase 1 or 2 depends on it, but submission in Phase 3 does.
**Delivers:** Completed Marketplace Partner profile and approved KYC/KYB verification
**Avoids:** KYC blocking submission after all documentation is complete (PITFALLS.md Pitfall 6)

### Phase 1: Documentation Site Rebuild
**Rationale:** The GitHub Pages site must be live, navigable, and accurate before any submission-facing URLs can be recorded. Navigation is the foundational dependency — all other content improvements build on it.
**Delivers:** A professional, multi-page docs site with working navigation, accurate content, and at least one workflow diagram
**Addresses:** GitHub Pages nav improvements (P1 from FEATURES.md), theme migration to just-the-docs (STACK.md), cross-check setup docs against source code
**Implements:** Layout layer + flat page hierarchy (ARCHITECTURE.md build order steps 1-4)
**Avoids:** Missing legal URLs at submission time (PITFALLS.md Pitfall 1), missing visual assets (Pitfall 3)

Key tasks:
- Migrate `_config.yml` from `jekyll-theme-minimal` to `just-the-docs@v0.12.0`
- Add front matter with `nav_order` to all pages
- Cross-check `setup.md` annotations table against `src/mapper.js` for accuracy
- Add architecture/data-flow Mermaid diagram
- Create `docs/troubleshooting.md`
- Add `.markdownlint.json` and GitHub Actions lint workflow

### Phase 2: Submission Materials Preparation
**Rationale:** Once the docs site is live and URLs are known, all submission-facing materials can be finalized. This phase clears every blocker before touching the Marketplace portal.
**Delivers:** Complete, accurate marketplace-listing.md with real URLs; pre-drafted P&S tab answers; production Forge deployment; resolved licensing question
**Uses:** Live GitHub Pages URLs from Phase 1
**Addresses:** Fix TODO placeholders (P1 from FEATURES.md), Privacy & Security tab prep, scope justification review
**Avoids:** P&S tab contradicting privacy policy (PITFALLS.md Pitfall 4), licensing mismatch (Pitfall 2), trademark naming violation (Pitfall 5)

Key tasks:
- Deploy app to production environment (`forge deploy -e production`)
- Fill `marketplace-listing.md` Privacy Policy and Terms URLs with live GitHub Pages URLs
- Resolve licensing: either remove `licensing: enabled` from manifest (free app) or implement check
- Draft all Privacy & Security tab answers aligned with privacy-policy.md
- Create root `README.md` linking to the docs site
- Add keywords ("kubernetes", "helm", "webhook") to listing draft

### Phase 3: Marketplace Submission
**Rationale:** Sequential gate — execute only after KYC is approved and all Phase 2 materials are complete. The submission itself involves multiple portal steps that must be done in the right order.
**Delivers:** Live Marketplace listing for "GitOps Deployments for Jira"
**Avoids:** Versioning quirk (PITFALLS.md Pitfall 7) — must make Marketplace Hub version public, not own submitted version

Key tasks:
- Enter listing details in Marketplace partner portal
- Complete Privacy & Security tab
- Complete security questionnaire
- Submit app for review
- After submission: find and make the "Released by Marketplace Hub [Atlassian]" version public (not the developer-submitted version)

### Phase Ordering Rationale

- KYC runs in parallel because it has external dependencies and unpredictable timing — decoupling it prevents it from blocking the critical path
- Phase 1 precedes Phase 2 because the live GitHub Pages URLs are inputs to Phase 2 materials
- Phase 3 is a strict gate — attempting submission with incomplete P&S tab or TODO placeholders in the listing will cause rejection
- Troubleshooting page and README are Phase 1 work (not Phase 2) because they improve the site before URLs are linked into the listing

### Research Flags

Phases with standard patterns (skip additional research):
- **Phase 1 (docs site):** Jekyll + just-the-docs is thoroughly documented with official sources. No unknown patterns.
- **Phase 1 (markdownlint CI):** Standard GitHub Actions workflow, no research needed.

Phases that may benefit from deeper research during planning:
- **Phase 2 (licensing decision):** Whether `context.license` is available in Forge webtrigger invocations is not well-documented. Needs a quick test against the Forge runtime before finalizing the approach.
- **Phase 3 (submission flow):** The versioning quirk (Pitfall 7) is from community reports, not official docs. Verify the current state of the Marketplace portal before submission — Atlassian may have fixed or changed this behavior.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All sources are official (GitHub Pages docs, just-the-docs releases, Atlassian Marketplace guidelines). Version compatibility verified. |
| Features | HIGH | Directly from official Atlassian Marketplace approval guidelines and partner docs. Table stakes are explicitly listed in official rejection criteria. |
| Architecture | HIGH | Jekyll documentation structure is well-established. Component responsibilities and dependency order are clear. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls sourced from official docs (HIGH confidence). Two pitfalls — versioning quirk and webtrigger license context — sourced from community reports (MEDIUM confidence). |

**Overall confidence:** HIGH

### Gaps to Address

- **Forge webtrigger license context availability:** `context.license` in webtrigger invocations is not well-documented. Before making the licensing decision, test a deployed webtrigger handler to see what context is available. This informs whether to remove `licensing: enabled` or implement a real check.
- **Current GitHub Pages deployment status:** Research assumes GitHub Pages is or can be configured to serve from `docs/` on `main`. Verify the Pages configuration in repo settings before starting Phase 1 — if it is pointing to root `/` instead of `/docs`, pages will 404.
- **Marketplace Partner profile existence:** Research does not confirm whether a Marketplace Partner profile already exists for the publisher. If not, KYC cannot start until the profile is created.

## Sources

### Primary (HIGH confidence)
- [App approval guidelines](https://developer.atlassian.com/platform/marketplace/app-approval-guidelines/) — rejection criteria, documentation requirements
- [Creating a Marketplace listing](https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/) — required fields, branding rules
- [Listing Forge apps](https://developer.atlassian.com/platform/marketplace/listing-forge-apps/) — Forge-specific licensing and testing requirements
- [Privacy and Security tab](https://developer.atlassian.com/platform/marketplace/security-privacy-tab/) — mandatory disclosure fields
- [Security workflow for app approval](https://developer.atlassian.com/platform/marketplace/app-approval-security-workflow/) — KYC/KYB, vulnerability scanning, 2025 security questionnaire
- [Atlassian brand guidelines for Marketplace Partners](https://developer.atlassian.com/platform/marketplace/atlassian-brand-guidelines-for-marketplace-partners/) — naming and icon rules
- [Just the Docs official site](https://just-the-docs.com/) — theme features and configuration
- [Just the Docs GitHub releases](https://github.com/just-the-docs/just-the-docs/releases) — v0.12.0 verified Jan 2025
- [GitHub Pages Jekyll docs](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) — remote_theme support and plugin whitelist

### Secondary (MEDIUM confidence)
- [Marketplace submission "lacks details" community thread](https://community.developer.atlassian.com/t/marketplace-submission-lacks-details/67911) — undocumented versioning quirk (publish Marketplace Hub version, not own version)
- [Marketplace app listing instantly rejected community thread](https://community.developer.atlassian.com/t/marketplace-app-listing-instantly-rejected-by-plugin-checker-with-no-reason-forge-jira-cloud/99247) — Plugin Checker auto-rejection patterns

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
