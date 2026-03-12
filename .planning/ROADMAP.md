# Roadmap: GitOps Deployments for Jira

## Milestones

- ✅ **v1.0 Marketplace Readiness** - Phases 1-4 (shipped 2026-03-12)
- 🚧 **v1.1 Admin Config UX** - Phases 5-6 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Marketplace Readiness (Phases 1-4) -- SHIPPED 2026-03-12</summary>

- [x] **Phase 1: Site Foundation** - Migrate to just-the-docs theme with working navigation, deploy GitHub Pages, create root README
- [x] **Phase 2: Content Accuracy** - Cross-check all documentation against source code, add troubleshooting page
- [x] **Phase 3: Legal & Compliance** - Get legal docs live at GitHub Pages URLs, review for Marketplace compliance, draft P&S tab answers
- [x] **Phase 4: Marketplace Listing** - Replace TODO placeholders with live URLs, finalize listing copy and icon

</details>

### v1.1 Admin Config UX

- [x] **Phase 5: Admin Page & Storage Migration** - Build admin settings UI, wire KVS secret storage, migrate handlers from env vars to KVS
- [ ] **Phase 6: Documentation Update** - Rewrite setup guide for admin UI flow, update troubleshooting and marketplace listing

## Phase Details

<details>
<summary>v1.0 Phase Details (Phases 1-4)</summary>

### Phase 1: Site Foundation
**Goal**: Documentation site renders on GitHub Pages with sidebar navigation, search, and working links across all pages
**Depends on**: Nothing (first phase)
**Requirements**: SITE-01, SITE-02, REPO-01, REPO-02
**Success Criteria** (what must be TRUE):
  1. Visiting the GitHub Pages URL shows a site with sidebar navigation and working search
  2. Every page on the site is reachable via sidebar navigation links (no dead links, no orphan pages)
  3. Root README.md exists on GitHub and links to the live docs site
  4. LICENSE file exists in the repository root
**Plans**: 2 plans

Plans:
- [x] 01-01: Theme migration and docs page setup
- [x] 01-02: Root repository files

### Phase 2: Content Accuracy
**Goal**: Every code example, annotation reference, and configuration instruction in the docs matches what the source code actually does
**Depends on**: Phase 1
**Requirements**: ACCY-01, ACCY-02, ACCY-03, SITE-03
**Success Criteria** (what must be TRUE):
  1. FluxCD setup instructions use annotation keys that match the keys parsed in src/mapper.js
  2. ArgoCD setup instructions produce a payload format that matches what src/mapper.js expects
  3. Annotation reference table lists every annotation key for both FluxCD and ArgoCD, with correct descriptions matching code behavior
  4. Troubleshooting page exists covering HMAC auth failures, missing required annotations, and silently ignored event reasons
**Plans**: 2 plans

Plans:
- [x] 02-01: Rewrite setup.md FluxCD and ArgoCD sections
- [x] 02-02: Write troubleshooting page

### Phase 3: Legal & Compliance
**Goal**: Privacy policy and terms of service are live at publicly accessible URLs and contain everything Atlassian Marketplace review requires
**Depends on**: Phase 1
**Requirements**: LEGL-01, LEGL-02, LEGL-03, LEGL-04, LEGL-05
**Success Criteria** (what must be TRUE):
  1. Privacy policy is accessible at a public GitHub Pages URL
  2. Terms of service is accessible at a public GitHub Pages URL
  3. Privacy policy covers data collection, storage, third-party sharing, and data deletion
  4. Terms of service covers liability, termination, and acceptable use
  5. Privacy & Security tab answers are drafted and aligned with privacy policy
**Plans**: 2 plans

Plans:
- [x] 03-01: Enhance privacy policy and terms of service
- [x] 03-02: Draft P&S tab answers and update legal URLs

### Phase 4: Marketplace Listing
**Goal**: Marketplace listing materials are complete with real URLs, accurate copy, and a conforming app icon
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: MRKT-01, MRKT-02, MRKT-03
**Success Criteria** (what must be TRUE):
  1. marketplace-listing.md contains zero TODO placeholders
  2. Listing description, summary, and highlights accurately describe what the app does
  3. App icon meets Atlassian Marketplace specifications
**Plans**: 1 plan

Plans:
- [x] 04-01: Cross-check listing accuracy, verify URLs, confirm icon

</details>

### Phase 5: Admin Page & Storage Migration
**Goal**: Jira admins can configure webhook secrets through the Atlassian admin UI, and webhook handlers authenticate using those stored secrets
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, STOR-01, STOR-02, STOR-03
**Success Criteria** (what must be TRUE):
  1. Jira admin can navigate to the app's admin page and enter a FluxCD HMAC secret
  2. Jira admin can navigate to the app's admin page and enter an ArgoCD bearer token
  3. After saving a secret, the admin sees clear success or error feedback
  4. The admin page displays the webtrigger URL so the admin can copy it into their CD tool
  5. A FluxCD webhook authenticated with the admin-configured HMAC secret is accepted and creates a Jira deployment record
  6. A webhook received before any secret is configured returns an explicit "not configured" error (not a cryptic auth failure)
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Backend foundation: storage abstraction (KVS + env fallback) and Forge resolver
- [x] 05-02-PLAN.md -- Admin page UI, manifest wiring, and handler migration to KVS storage

### Phase 6: Documentation Update
**Goal**: Setup guide, troubleshooting page, and marketplace listing accurately describe the admin UI configuration flow
**Depends on**: Phase 5
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. Setup guide walks through the admin UI configuration flow -- no mention of `forge variables set` as the primary method
  2. Troubleshooting page covers "secret not configured" errors and re-consent prompts after upgrade
  3. Marketplace listing description reflects that customers self-configure their webhook secrets
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Site Foundation | v1.0 | 2/2 | Complete | 2026-03-11 |
| 2. Content Accuracy | v1.0 | 2/2 | Complete | 2026-03-11 |
| 3. Legal & Compliance | v1.0 | 2/2 | Complete | 2026-03-11 |
| 4. Marketplace Listing | v1.0 | 1/1 | Complete | 2026-03-12 |
| 5. Admin Page & Storage Migration | v1.1 | 2/2 | Complete | 2026-03-12 |
| 6. Documentation Update | v1.1 | 0/? | Not started | - |
