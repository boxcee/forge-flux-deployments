# Requirements: GitOps Deployments for Jira -- Marketplace Readiness

**Defined:** 2026-03-11
**Core Value:** Every documentation page renders correctly on GitHub Pages, passes Atlassian Marketplace review, and accurately reflects what the app does.

## v1 Requirements

### Documentation Site

- [x] **SITE-01**: Site uses just-the-docs theme with sidebar navigation and search
- [x] **SITE-02**: All pages render correctly on GitHub Pages with working links
- [ ] **SITE-03**: Troubleshooting page covers common issues (auth failures, missing annotations, ignored reasons)

### Legal & Compliance

- [ ] **LEGL-01**: Privacy policy is accessible at a live GitHub Pages URL
- [ ] **LEGL-02**: Terms of service/EULA is accessible at a live GitHub Pages URL
- [ ] **LEGL-03**: Privacy policy content is reviewed for Marketplace compliance completeness
- [ ] **LEGL-04**: Terms of service content is reviewed for Marketplace compliance completeness
- [ ] **LEGL-05**: Privacy & Security tab answers are drafted for Marketplace submission

### Marketplace Listing

- [ ] **MRKT-01**: TODO placeholder URLs in marketplace-listing.md are replaced with live links
- [ ] **MRKT-02**: Listing description, summary, and highlights are cross-checked for accuracy
- [ ] **MRKT-03**: App icon meets Atlassian Marketplace size and format specifications

### Content Accuracy

- [x] **ACCY-01**: Setup guide FluxCD instructions match actual source code behavior
- [x] **ACCY-02**: Setup guide ArgoCD instructions match actual payload format in code
- [x] **ACCY-03**: Annotation reference table is complete for both FluxCD and ArgoCD

### Repository

- [x] **REPO-01**: Root README.md exists as GitHub landing page with links to docs site
- [x] **REPO-02**: LICENSE file exists with appropriate license

## v2 Requirements

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
| New app features | This milestone is docs/listing only |
| Marketing website beyond GitHub Pages | Marketplace listing + GitHub Pages is sufficient |
| KYC/KYB verification | Manual process done in Atlassian Partner portal, not code |
| License enforcement in code | Code concern, separate from docs milestone |
| Mobile-optimized docs | just-the-docs is responsive by default |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 1: Site Foundation | Complete |
| SITE-02 | Phase 1: Site Foundation | Complete |
| SITE-03 | Phase 2: Content Accuracy | Pending |
| LEGL-01 | Phase 3: Legal & Compliance | Pending |
| LEGL-02 | Phase 3: Legal & Compliance | Pending |
| LEGL-03 | Phase 3: Legal & Compliance | Pending |
| LEGL-04 | Phase 3: Legal & Compliance | Pending |
| LEGL-05 | Phase 3: Legal & Compliance | Pending |
| MRKT-01 | Phase 4: Marketplace Listing | Pending |
| MRKT-02 | Phase 4: Marketplace Listing | Pending |
| MRKT-03 | Phase 4: Marketplace Listing | Pending |
| ACCY-01 | Phase 2: Content Accuracy | Complete |
| ACCY-02 | Phase 2: Content Accuracy | Complete |
| ACCY-03 | Phase 2: Content Accuracy | Complete |
| REPO-01 | Phase 1: Site Foundation | Complete |
| REPO-02 | Phase 1: Site Foundation | Complete |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
