# Roadmap: GitOps Deployments for Jira -- Marketplace Readiness

## Overview

The app works. The goal is to get the documentation, legal pages, and Marketplace listing to a state where Atlassian approves the submission on first attempt. The work follows a hard dependency chain: the GitHub Pages site must render with working navigation before content accuracy can be verified, legal URLs can be confirmed live, and listing materials can reference real links. Four phases move from site foundation through content accuracy, legal compliance, and finally the complete listing package.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Site Foundation** - Migrate to just-the-docs theme with working navigation, deploy GitHub Pages, create root README
- [ ] **Phase 2: Content Accuracy** - Cross-check all documentation against source code, add troubleshooting page
- [ ] **Phase 3: Legal & Compliance** - Get legal docs live at GitHub Pages URLs, review for Marketplace compliance, draft P&S tab answers
- [ ] **Phase 4: Marketplace Listing** - Replace TODO placeholders with live URLs, finalize listing copy and icon

## Phase Details

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
- [ ] 01-01-PLAN.md -- Theme migration and docs page setup (just-the-docs config, front matter, index rewrite, troubleshooting placeholder)
- [ ] 01-02-PLAN.md -- Root repository files (ELv2 LICENSE, overview README, CONTRIBUTING.md)

### Phase 2: Content Accuracy
**Goal**: Every code example, annotation reference, and configuration instruction in the docs matches what the source code actually does
**Depends on**: Phase 1
**Requirements**: ACCY-01, ACCY-02, ACCY-03, SITE-03
**Success Criteria** (what must be TRUE):
  1. FluxCD setup instructions use annotation keys that match the keys parsed in src/mapper.js
  2. ArgoCD setup instructions produce a payload format that matches what src/mapper.js expects
  3. Annotation reference table lists every annotation key for both FluxCD and ArgoCD, with correct descriptions matching code behavior
  4. Troubleshooting page exists covering HMAC auth failures, missing required annotations, and silently ignored event reasons
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Legal & Compliance
**Goal**: Privacy policy and terms of service are live at publicly accessible URLs and contain everything Atlassian Marketplace review requires
**Depends on**: Phase 1
**Requirements**: LEGL-01, LEGL-02, LEGL-03, LEGL-04, LEGL-05
**Success Criteria** (what must be TRUE):
  1. Privacy policy is accessible at a public GitHub Pages URL (returns 200, renders correctly)
  2. Terms of service is accessible at a public GitHub Pages URL (returns 200, renders correctly)
  3. Privacy policy covers data collection, storage, third-party sharing, and data deletion -- consistent with the app being stateless and Forge-hosted
  4. Terms of service covers liability, termination, and acceptable use
  5. Privacy & Security tab answers are drafted in a document, aligned with what the privacy policy states
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Marketplace Listing
**Goal**: Marketplace listing materials are complete with real URLs, accurate copy, and a conforming app icon -- ready to paste into the Marketplace portal
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: MRKT-01, MRKT-02, MRKT-03
**Success Criteria** (what must be TRUE):
  1. marketplace-listing.md contains zero TODO placeholders -- all URLs point to live GitHub Pages
  2. Listing description, summary, and highlights accurately describe what the app does (cross-checked against source code and setup guide)
  3. App icon meets Atlassian Marketplace specifications (correct dimensions, format, no trademarked imagery)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
Note: Phase 2 and Phase 3 can execute in parallel (both depend only on Phase 1).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Site Foundation | 0/2 | Planning complete | - |
| 2. Content Accuracy | 0/? | Not started | - |
| 3. Legal & Compliance | 0/? | Not started | - |
| 4. Marketplace Listing | 0/? | Not started | - |
