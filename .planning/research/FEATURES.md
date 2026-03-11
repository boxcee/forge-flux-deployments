# Feature Research

**Domain:** Atlassian Marketplace listing documentation for a Forge DevOps deployment app
**Researched:** 2026-03-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Marketplace Review Will Reject Without These)

Features that Atlassian's review process explicitly requires. Missing any of these blocks listing approval.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Privacy Policy (hosted, linkable URL) | Mandatory for all cloud apps. Marketplace listing form requires a URL. | LOW | Already exists at `docs/privacy-policy.md`. Needs live GitHub Pages URL filled into listing. |
| End User Terms / EULA (hosted, linkable URL) | Mandatory for all cloud apps. Marketplace listing form requires a URL. | LOW | Already exists at `docs/terms-of-service.md`. Needs live GitHub Pages URL filled into listing. |
| Setup documentation (how to install and configure) | App approval guidelines: listing "should reference documentation that describes how to set up and use your app." | LOW | Already exists at `docs/setup.md`. Needs accuracy cross-check against source code. |
| API scope justification | Required disclosure: what scopes the app requests and why each is necessary. | LOW | Already in `marketplace-listing.md`. Three scopes documented with rationale. |
| Remote hostname disclosure | Forge apps must disclose all external hosts contacted and what data is sent. | LOW | Already documented as "None" in listing draft. Accurate for this stateless app. |
| Privacy & Security tab answers | Mandatory for cloud app onboarding. 20+ fields covering data handling, GDPR, storage, PATs. | MEDIUM | Must be completed in the Marketplace partner portal during submission. Answers are straightforward (stateless app, no PII, no external hosts). |
| Security questionnaire | New (2025) app-specific security questionnaire covering auth, data security, secrets management, vulnerabilities. Failures block listing. | MEDIUM | App uses HMAC and bearer token auth. No persistent storage. Should pass cleanly. |
| KYC/KYB partner verification | Identity and business verification required for all new app submissions. 2-3 business days. | LOW | Administrative task, not a documentation feature. One-time. |
| App icon/logo | Branding asset required for listing. Cannot incorporate Atlassian brand elements. | LOW | Already exists at `docs/assets/icon.png` and `icon.svg`. Verify it meets branding guidelines. |
| App description with value proposition | Listing must describe actual functionality, benefits, and setup. | LOW | Already drafted in `marketplace-listing.md`. Solid content. |
| Support URL | Required field in listing form. | LOW | Already set to GitHub Issues URL. |

### Differentiators (Competitive Advantage in Listing Quality)

Features not required for approval but that make the listing stand out to evaluators and customers.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Comprehensive annotation reference table | Customers evaluating the app need to understand the configuration surface. A clear, complete annotation table (Flux + Argo) builds trust. | LOW | Partially in setup.md. Needs `env-type` for Flux and `envType` for Argo added. Must match source code exactly. |
| Architecture/data flow explanation | "How it works" section showing webhook -> Forge -> Jira flow. Demonstrates the app is stateless and secure. Builds trust for security-conscious buyers. | LOW | Not currently documented as a visual/diagram. Add a Mermaid diagram to docs site. |
| Troubleshooting / FAQ page | Reduces support burden and signals maturity. Common questions: "Why don't deployments show up?" (missing annotations, wrong HMAC secret, issue key format). | MEDIUM | Does not exist. Create `docs/troubleshooting.md`. |
| GitHub README (repo landing page) | First impression for developers evaluating the app. Links to docs site, shows badges, quick overview. | LOW | Does not exist (flagged in PROJECT.md as active task). |
| Demo video or screenshots | Marketplace listing supports video. Shows the deployment panel in Jira with real data. Significantly increases conversion. | HIGH | Out of scope per PROJECT.md (no running Jira instance). Could use annotated mockups instead. |
| SEO-optimized listing keywords | Marketplace has internal search. Keywords like "gitops", "fluxcd", "argocd", "deployments", "kubernetes" improve discoverability. | LOW | Already has 4 keywords in listing draft. Consider adding "kubernetes", "helm", "webhook". |
| Changelog / release notes | Signals active maintenance. Marketplace changelog field exists. | LOW | Does not exist. Create `CHANGELOG.md` or use GitHub Releases. |
| "Runs on Atlassian" badge eligibility | Forge-native apps qualify for the "Runs on Atlassian" badge, which signals trust and performance to customers. | LOW | Automatic for Forge apps. Verify eligibility by checking manifest compliance. |
| Filled Privacy & Security tab (all fields) | While not mandatory (except for Cloud Fortified), complete answers signal trustworthiness. Customers filter by this. | LOW | Straightforward for a stateless app: no data storage, no PII, no third-party sharing, no PATs required. |
| Landing page with navigation | GitHub Pages site with proper nav (Home, Setup, Troubleshooting, Legal). Professional impression vs a single-page dump. | MEDIUM | Currently has index.md with links. Jekyll minimal theme supports basic navigation. Improve layout. |

### Anti-Features (Deliberately NOT Include)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Marketing website separate from GitHub Pages | Looks more professional | Maintenance burden for a free/small app. GitHub Pages is sufficient and tied to the repo. Atlassian explicitly supports GitHub-hosted docs. | Polish the GitHub Pages site instead. |
| Extensive legal boilerplate (DPA, sub-processor list) | GDPR compliance signals | App processes zero personal data. Adding a DPA implies data processing obligations that don't apply. Over-lawyering creates false expectations. | State clearly in privacy policy: "No personal data processed." |
| Screenshots with fake/mocked Jira data | Listings with screenshots convert better | Fabricated screenshots risk Marketplace rejection if they misrepresent functionality. Also violates Atlassian brand guidelines if Jira UI is reproduced. | Use annotated diagrams showing the data flow instead. Wait for real Jira instance access. |
| Multi-page feature comparison matrix | Shows competitive positioning | For a focused, single-purpose app there are no direct competitors to compare against. GitOps-to-Jira deployment tracking is a niche. | Let the listing description speak for itself. |
| Cloud Fortified certification | Highest trust badge | Requires bug bounty program, penetration testing, incident management, and full Privacy & Security tab. Overkill for initial listing of a free stateless app. | Pursue after gaining traction and installs. |
| In-app configuration UI | Users expect config screens | Forge webtrigger apps have no UI surface. Config is done via CD tool annotations. Adding a Forge UI module would add complexity without value. | Document the annotation-based config clearly in setup guide. |

## Feature Dependencies

```
[Privacy Policy URL] ──requires──> [GitHub Pages site live and accessible]
[Terms of Service URL] ──requires──> [GitHub Pages site live and accessible]
[Marketplace listing submission] ──requires──> [Privacy Policy URL]
                                 ──requires──> [Terms of Service URL]
                                 ──requires──> [Setup documentation]
                                 ──requires──> [App icon]
                                 ──requires──> [Scope justification]
                                 ──requires──> [KYC/KYB verification]

[Privacy & Security tab] ──requires──> [Marketplace listing created (draft)]
[Security questionnaire] ──requires──> [Marketplace listing created (draft)]

[Troubleshooting page] ──enhances──> [Setup documentation]
[README] ──enhances──> [GitHub Pages site]
[Architecture diagram] ──enhances──> [Setup documentation]
[Changelog] ──enhances──> [Marketplace listing]
```

### Dependency Notes

- **Listing submission requires live URLs:** The Privacy Policy and Terms URLs must resolve before submitting the listing form. GitHub Pages must be deployed and accessible.
- **Security assessments happen during submission:** The security questionnaire and Privacy & Security tab are filled out in the partner portal as part of the submission flow, not before.
- **KYC/KYB is one-time and takes 2-3 business days:** Start this early; it can block the timeline.

## MVP Definition

### Launch With (v1 - Marketplace Submission)

Minimum required to pass Marketplace review on first submission.

- [x] Privacy Policy at live URL -- already exists, needs URL in listing
- [x] Terms of Service at live URL -- already exists, needs URL in listing
- [x] Setup guide (Flux + Argo) -- already exists, needs accuracy review
- [x] App icon meeting branding guidelines -- already exists
- [x] Marketplace listing description -- already drafted
- [x] Scope justification -- already documented
- [x] Remote hostname disclosure -- already documented
- [ ] Fix TODO placeholders in marketplace-listing.md (Privacy Policy URL, Terms URL)
- [ ] Complete Privacy & Security tab in partner portal
- [ ] Complete security questionnaire in partner portal
- [ ] Complete KYC/KYB verification
- [ ] Cross-check all docs against source code for accuracy

### Add After Validation (v1.x - Polish)

Features to add once the listing is approved and live.

- [ ] README.md for GitHub repo -- first impression for developers discovering the repo
- [ ] Troubleshooting/FAQ page -- reduces support tickets
- [ ] Architecture/data flow diagram (Mermaid) -- builds trust
- [ ] Expanded annotation reference table -- complete config surface documented
- [ ] Changelog/release notes -- signals active maintenance
- [ ] Additional Marketplace keywords -- improve discoverability

### Future Consideration (v2+)

Features to defer until the app has traction.

- [ ] Demo video -- requires access to a Jira instance with real deployment data
- [ ] Cloud Fortified certification -- requires bug bounty, pen testing, incident management
- [ ] Screenshots of Jira deployment panel -- requires real Jira instance

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fix listing TODO placeholders | HIGH | LOW | P1 |
| Cross-check docs vs source code | HIGH | LOW | P1 |
| Privacy & Security tab completion | HIGH | MEDIUM | P1 |
| Security questionnaire | HIGH | MEDIUM | P1 |
| KYC/KYB verification | HIGH | LOW | P1 |
| GitHub Pages nav/layout improvements | MEDIUM | LOW | P1 |
| README.md | MEDIUM | LOW | P2 |
| Troubleshooting page | MEDIUM | MEDIUM | P2 |
| Architecture diagram | MEDIUM | LOW | P2 |
| Annotation reference completeness | MEDIUM | LOW | P2 |
| Changelog | LOW | LOW | P2 |
| Additional keywords | LOW | LOW | P2 |
| Demo video | HIGH | HIGH | P3 |
| Cloud Fortified | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for Marketplace submission (blocks approval)
- P2: Should have for listing quality (improves conversion and trust)
- P3: Nice to have, defer until post-launch

## Competitor Feature Analysis

No direct competitors exist on the Atlassian Marketplace for GitOps-to-Jira deployment tracking. The closest alternatives are:

| Feature | Built-in (Bitbucket/GitHub/GitLab) | Codefresh GitOps | This App |
|---------|-------------------------------------|-------------------|----------|
| Jira deployment records | Yes (native providers only) | Yes (Codefresh-specific) | Yes (FluxCD + ArgoCD) |
| FluxCD support | No | No | Yes |
| ArgoCD support | No | Partial (Codefresh Argo) | Yes |
| Infrastructure required | Vendor-specific CI/CD | Codefresh platform | None (Forge-native) |
| Setup complexity | Low (native integration) | Medium (platform account) | Low (webhook + annotations) |
| Cost | Free with platform | Codefresh subscription | Free |

**Competitive positioning:** This app fills a gap. Teams using FluxCD or ArgoCD (not Bitbucket/GitHub/GitLab CI) have no Marketplace app to pipe deployment data into Jira. The "Runs on Atlassian" badge and zero-infrastructure story are strong differentiators.

## Sources

- [App approval guidelines](https://developer.atlassian.com/platform/marketplace/app-approval-guidelines/) -- rejection triggers, documentation requirements
- [Creating a Marketplace listing](https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/) -- required fields, branding
- [Listing Forge apps](https://developer.atlassian.com/platform/marketplace/listing-forge-apps/) -- Forge-specific licensing and testing
- [Privacy and Security tab](https://developer.atlassian.com/platform/marketplace/security-privacy-tab/) -- 20+ disclosure fields
- [Security workflow for app approval](https://developer.atlassian.com/platform/marketplace/app-approval-security-workflow/) -- KYC/KYB, vulnerability scanning, questionnaire
- [Security guidelines](https://developer.atlassian.com/platform/marketplace/security-guidelines/) -- security best practices
- [Attracting new customers](https://developer.atlassian.com/platform/marketplace/attracting-new-customers/) -- SEO, marketing, content strategy
- [Runs on Atlassian](https://developer.atlassian.com/platform/marketplace/runs-on-atlassian/) -- Forge badge eligibility

---
*Feature research for: Atlassian Marketplace listing documentation*
*Researched: 2026-03-11*
