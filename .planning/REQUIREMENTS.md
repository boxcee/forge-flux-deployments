# Requirements: GitOps Deployments for Jira

**Defined:** 2026-03-11
**Core Value:** Customers can install the app and configure their webhook secrets entirely through the Atlassian UI — no CLI access or vendor intervention required.

## v1.0 Requirements (Complete)

### Documentation Site

- [x] **SITE-01**: Site uses just-the-docs theme with sidebar navigation and search
- [x] **SITE-02**: All pages render correctly on GitHub Pages with working links
- [x] **SITE-03**: Troubleshooting page covers common issues (auth failures, missing annotations, ignored reasons)

### Legal & Compliance

- [x] **LEGL-01**: Privacy policy is accessible at a live GitHub Pages URL
- [x] **LEGL-02**: Terms of service/EULA is accessible at a live GitHub Pages URL
- [x] **LEGL-03**: Privacy policy content is reviewed for Marketplace compliance completeness
- [x] **LEGL-04**: Terms of service content is reviewed for Marketplace compliance completeness
- [x] **LEGL-05**: Privacy & Security tab answers are drafted for Marketplace submission

### Marketplace Listing

- [x] **MRKT-01**: TODO placeholder URLs in marketplace-listing.md are replaced with live links
- [x] **MRKT-02**: Listing description, summary, and highlights are cross-checked for accuracy
- [x] **MRKT-03**: App icon meets Atlassian Marketplace size and format specifications

### Content Accuracy

- [x] **ACCY-01**: Setup guide FluxCD instructions match actual source code behavior
- [x] **ACCY-02**: Setup guide ArgoCD instructions match actual payload format in code
- [x] **ACCY-03**: Annotation reference table is complete for both FluxCD and ArgoCD

### Repository

- [x] **REPO-01**: Root README.md exists as GitHub landing page with links to docs site
- [x] **REPO-02**: LICENSE file exists with appropriate license

## v1.1 Requirements

### Admin Configuration

- [ ] **CONF-01**: Jira admin can set FluxCD HMAC webhook secret via admin settings page
- [ ] **CONF-02**: Jira admin can set ArgoCD bearer token via admin settings page
- [ ] **CONF-03**: Admin page shows save confirmation feedback (success/error)
- [ ] **CONF-04**: Admin page displays the webtrigger URL for copying into CD tool config

### Storage

- [ ] **STOR-01**: Secrets are stored per-installation using Forge KVS secret store
- [ ] **STOR-02**: Webtrigger handlers read secrets from KVS instead of environment variables
- [ ] **STOR-03**: Webhook returns clear error when secrets have not been configured

### Documentation

- [ ] **DOCS-01**: Setup guide documents admin UI configuration flow (replaces forge variables set)
- [ ] **DOCS-02**: Troubleshooting page covers configuration-related failure modes
- [ ] **DOCS-03**: Marketplace listing reflects self-service configuration capability

## Future Requirements

### Documentation Site

- **SITE-04**: Architecture/data flow diagram showing webhook-to-Jira path
- **SITE-05**: Screenshots or workflow visuals for Marketplace listing

### Legal & Compliance

- **LEGL-06**: GDPR/CCPA specific language in privacy policy

### Marketplace Listing

- **MRKT-04**: Screenshots embedded in listing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Secret rotation / key management | Single active secret per installation is sufficient for v1.1 |
| Environment variable fallback | Clean cut — existing installations must re-configure via admin UI |
| Custom UI (React iframe) | UI Kit is sufficient for a settings form with two text fields |
| Multi-tenant secret scoping | Forge KVS provides automatic per-installation isolation |
| Marketing website beyond GitHub Pages | Marketplace listing + GitHub Pages is sufficient |
| KYC/KYB verification | Manual process done in Atlassian Partner portal, not code |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | v1.0 Phase 1: Site Foundation | Complete |
| SITE-02 | v1.0 Phase 1: Site Foundation | Complete |
| SITE-03 | v1.0 Phase 2: Content Accuracy | Complete |
| LEGL-01 | v1.0 Phase 3: Legal & Compliance | Complete |
| LEGL-02 | v1.0 Phase 3: Legal & Compliance | Complete |
| LEGL-03 | v1.0 Phase 3: Legal & Compliance | Complete |
| LEGL-04 | v1.0 Phase 3: Legal & Compliance | Complete |
| LEGL-05 | v1.0 Phase 3: Legal & Compliance | Complete |
| MRKT-01 | v1.0 Phase 4: Marketplace Listing | Complete |
| MRKT-02 | v1.0 Phase 4: Marketplace Listing | Complete |
| MRKT-03 | v1.0 Phase 4: Marketplace Listing | Complete |
| ACCY-01 | v1.0 Phase 2: Content Accuracy | Complete |
| ACCY-02 | v1.0 Phase 2: Content Accuracy | Complete |
| ACCY-03 | v1.0 Phase 2: Content Accuracy | Complete |
| REPO-01 | v1.0 Phase 1: Site Foundation | Complete |
| REPO-02 | v1.0 Phase 1: Site Foundation | Complete |
| CONF-01 | Phase 5: Admin Page & Storage Migration | Pending |
| CONF-02 | Phase 5: Admin Page & Storage Migration | Pending |
| CONF-03 | Phase 5: Admin Page & Storage Migration | Pending |
| CONF-04 | Phase 5: Admin Page & Storage Migration | Pending |
| STOR-01 | Phase 5: Admin Page & Storage Migration | Pending |
| STOR-02 | Phase 5: Admin Page & Storage Migration | Pending |
| STOR-03 | Phase 5: Admin Page & Storage Migration | Pending |
| DOCS-01 | Phase 6: Documentation Update | Pending |
| DOCS-02 | Phase 6: Documentation Update | Pending |
| DOCS-03 | Phase 6: Documentation Update | Pending |

**Coverage:**
- v1.0 requirements: 16 total (all complete)
- v1.1 requirements: 10 total
- Mapped to phases: 10/10
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-12 after v1.1 roadmap creation*
