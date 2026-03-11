# Pitfalls Research

**Domain:** Atlassian Marketplace submission for Forge app
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (official docs verified, community reports corroborated)

## Critical Pitfalls

### Pitfall 1: Missing or broken Privacy Policy / End User Terms URLs

**What goes wrong:**
The marketplace-listing.md currently has `(TODO: create and host)` for both Privacy Policy URL and End User Terms URL. Atlassian requires functional, publicly accessible URLs for both documents at submission time. A cloud app cannot be listed without End User Terms. If you process personal data under GDPR, a DPA is also required.

**Why it happens:**
Legal docs exist in the repo (`docs/privacy-policy.md`, `docs/terms-of-service.md`) but they are not yet deployed to publicly accessible URLs. GitHub Pages may not be configured to serve them, or the URLs have not been finalized.

**How to avoid:**
1. Deploy legal docs to GitHub Pages and verify they render correctly at their final URLs
2. Update `marketplace-listing.md` with the actual URLs before submission
3. Verify URLs resolve with a 200 status code -- Atlassian likely validates them

**Warning signs:**
- TODO placeholders still present in listing draft
- GitHub Pages site not building or returning 404 on legal doc paths
- Legal doc URLs pointing to raw GitHub files instead of rendered pages

**Phase to address:**
Phase 1 (Documentation Polish) -- this is a hard blocker for submission.

---

### Pitfall 2: No license status checking in app code

**What goes wrong:**
The manifest declares `licensing: enabled: true` but the source code (`src/index.js`, `src/mapper.js`, etc.) contains zero references to license status. Atlassian's Forge listing docs state: "When your functions are invoked in a Marketplace app, you should check the license status and implement reduced functionality if your Marketplace app is unlicensed." For paid apps, this is a requirement. Even for free apps with licensing enabled, the inconsistency may trigger review questions.

**Why it happens:**
The app was built as an internal tool first. Licensing was enabled in the manifest for Marketplace readiness but never wired into the runtime. For a webtrigger-based app (no UI), it is unclear how license context is passed -- webtrigger invocations may not include license context the same way UI or resolver contexts do.

**How to avoid:**
1. If the app will be listed as free: consider removing `licensing: enabled: true` from manifest.yml to avoid confusion, OR implement a basic license check
2. If paid: implement license checking in the webtrigger handler via the invocation context
3. Research whether Forge webtrigger invocations include `context.license` -- this is not well-documented and may require testing

**Warning signs:**
- `licensing: enabled: true` in manifest but no `license` references in source
- No test coverage for license active/inactive states
- Reviewer asks about license enforcement and you have no answer

**Phase to address:**
Phase 1 or pre-submission -- decide free vs. paid and align manifest + code accordingly.

---

### Pitfall 3: Missing screenshots and marketing assets

**What goes wrong:**
The app has only `icon.png` and `icon.svg` in `docs/assets/`. There are no screenshots, no banner image, and no demo video. Atlassian's approval guidelines recommend marketing assets (logo, banner, screenshots). Community reports indicate listings rejected for "lacking details" -- which partly refers to sparse visual content. Even if not a hard rejection, a listing without screenshots ranks poorly and may trigger manual review scrutiny.

**Why it happens:**
PROJECT.md explicitly marks screenshots as out of scope ("no running Jira instance available for capture"). This is understandable but creates a gap.

**How to avoid:**
1. Create annotated diagrams or architecture visuals showing the webhook flow (FluxCD/ArgoCD -> Forge -> Jira Deployments panel)
2. Use Jira's public documentation screenshots of the Deployments panel with annotation overlays
3. If possible, install the app on a free Jira Cloud instance and capture the Deployments panel with real data
4. At minimum, provide a clear workflow diagram as the primary "screenshot"

**Warning signs:**
- `docs/assets/` contains only icon files
- Marketplace listing form has empty screenshot slots
- Reviewers cannot visualize what the app does

**Phase to address:**
Phase 1 (Documentation Polish) -- create at minimum 1-2 workflow diagrams before submission.

---

### Pitfall 4: Privacy and Security tab incomplete or inaccurate

**What goes wrong:**
Atlassian's Marketplace now requires completing the Privacy and Security tab during cloud app onboarding. This includes specific questions about: data storage outside Atlassian, data processing outside Atlassian, data residency support, GDPR status, CCPA status, compliance certifications, PAT usage, and permission justification. If these are not filled out or answers contradict your privacy policy, it delays or blocks listing.

**Why it happens:**
Developers focus on the listing description and forget the P&S tab is a separate form in the Marketplace portal with its own mandatory fields. The questions require deliberate answers, not just a privacy policy link.

**How to avoid:**
1. Pre-draft answers to all P&S tab questions before submission:
   - Data stored outside Atlassian: **No**
   - Data processed outside Atlassian: **No** (Forge runtime is Atlassian-hosted)
   - Data residency: **N/A** (stateless, no storage)
   - GDPR status: Determine if publisher is controller or processor (likely neither -- no personal data processed)
   - CCPA status: Determine applicability
   - PATs required: **No**
   - Permission justification: Already drafted in marketplace-listing.md -- reuse
2. Ensure answers align exactly with privacy-policy.md claims

**Warning signs:**
- Privacy policy says "no data stored" but P&S tab answers contradict
- GDPR/CCPA status fields left blank
- Permission justifications are vague or copy-pasted

**Phase to address:**
Phase 2 (Submission Preparation) -- draft P&S tab answers alongside final listing review.

---

### Pitfall 5: App name trademark violation

**What goes wrong:**
Atlassian auto-rejects apps with names that start with an Atlassian product name. "Jira GitOps Deployments" would be rejected. The current name "GitOps Deployments for Jira" follows the correct pattern ("App Name for Product"), but any slip during submission (e.g., entering "Jira" first in a different field) triggers automatic rejection.

**Why it happens:**
Automated branding checks run at submission time. The rule is: your app name must not start with "Jira", "Confluence", "Bitbucket", etc. Must be "X for Jira", not "Jira X".

**How to avoid:**
1. Current name "GitOps Deployments for Jira" is correctly formatted -- do not change it
2. Verify the name in manifest.yml matches the listing name exactly
3. Ensure the app name is under 60 characters (current name is 28 chars -- safe)
4. Do not use Atlassian logos or design elements in app icon

**Warning signs:**
- Name starts with an Atlassian product name
- App icon resembles Atlassian's design language
- Branding check fails at submission with no clear error

**Phase to address:**
Phase 2 (Submission) -- verify during final pre-submission checklist.

---

### Pitfall 6: KYC/KYB verification not completed before submission

**What goes wrong:**
Atlassian requires all partners to complete Know Your Customer / Know Your Business verification through a third-party vendor before onboarding new apps. This is a separate process from the app submission itself and can take days or weeks. Submitting an app before KYC is complete blocks the listing.

**Why it happens:**
Developers focus on code and docs, not the vendor onboarding process. KYC requires business documentation (tax ID, bank details for paid apps, identity verification) that takes time to gather.

**How to avoid:**
1. Start the Marketplace Partner profile and KYC process immediately -- do not wait until docs are ready
2. For individual developers: prepare government ID and tax information
3. For companies: prepare business registration, tax ID, authorized representative details
4. Begin this in parallel with documentation work

**Warning signs:**
- No Marketplace Partner profile exists yet
- KYC verification email sitting in inbox unanswered
- Submission blocked with "partner verification incomplete" error

**Phase to address:**
Phase 0 (Pre-work) -- start KYC before any documentation phase begins.

---

### Pitfall 7: Undocumented versioning quirk causes false "lacks details" rejection

**What goes wrong:**
Community reports document a known issue where Atlassian automatically generates a version "Released by Marketplace Hub [Atlassian]" alongside the developer's submitted version. Developers must make the Atlassian-generated version public, not their own submitted version. Making the wrong version public causes a "your listing lacks details" rejection that is misleading and not documented in official guides.

**Why it happens:**
This is an undocumented Marketplace portal behavior. Developers naturally try to publish their own version and get a confusing rejection message.

**How to avoid:**
1. After submission, check the Marketplace portal for TWO versions
2. Make the "Released by Marketplace Hub [Atlassian]" version public
3. Do not try to make your initially submitted version public

**Warning signs:**
- Rejection message says "lacks details" despite complete listing
- Two versions visible in the Marketplace portal after submission
- Re-submissions keep failing with the same vague error

**Phase to address:**
Phase 2 (Submission) -- document this in a submission checklist so the submitter knows to look for it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip license checking (free app) | Faster submission | Must retrofit if switching to paid model | Acceptable for free-only listing, but remove `licensing: enabled` from manifest to be explicit |
| No screenshots, diagrams only | Avoids needing a running Jira instance | Lower Marketplace ranking, less trust from evaluators | For initial listing only -- add real screenshots after first install |
| Host legal docs on GitHub Pages only | No separate hosting cost | If GitHub Pages goes down, listing has broken legal URLs | Acceptable -- GitHub Pages is reliable enough |
| Skip P&S tab optional fields | Faster submission | Lower trust score, customers skip your app | Never -- fill out all fields even optional ones |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Marketplace Partner Portal | Submitting app before KYC verification completes | Complete KYC first, then submit app |
| Marketplace Listing Form | Filling Privacy Policy URL with a GitHub raw file link | Use rendered GitHub Pages URL (e.g., `https://boxcee.github.io/forge-flux-deployments/privacy-policy`) |
| Forge Deploy | Deploying to development environment for Marketplace listing | Must deploy to **production** environment (`forge deploy -e production`) before listing |
| Privacy & Security Tab | Leaving it for after submission | Complete it during submission -- it is mandatory for cloud app onboarding |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| HMAC secret or bearer token appearing in documentation examples | Credential exposure, webhook hijacking | Use obvious placeholder values (`your-secret-here`), review all docs for real values |
| Not justifying API scopes in submission | Reviewer cannot verify least-privilege, delays approval | Pre-draft scope justifications (already done in marketplace-listing.md -- keep them accurate) |
| Privacy policy claiming "no data processed" while app processes Jira issue keys | Contradiction flagged by reviewer | Be precise: "deployment metadata including Jira issue keys is processed in-transit but not stored" |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No setup documentation linked from listing | Users install but cannot configure, uninstall, leave bad review | Link setup guide prominently in listing description and "Documentation URL" field |
| Listing description too technical | Non-DevOps Jira admins cannot evaluate the app | Lead with business value ("see deployment status in Jira"), technical details second |
| No support channel visible | Users with issues cannot get help, leave bad reviews | GitHub Issues link is good but must be prominently placed in listing |

## "Looks Done But Isn't" Checklist

- [ ] **Legal URLs:** Privacy Policy and Terms URLs resolve to rendered pages (not 404, not raw markdown)
- [ ] **GitHub Pages:** Site is deployed and all doc pages render correctly with working navigation
- [ ] **Scope justifications:** Each scope in manifest.yml has a matching justification in the listing
- [ ] **Remote hostnames:** "None" is explicitly stated (Forge apps calling only Jira API need no external hosts)
- [ ] **Production deploy:** App is deployed to production environment, not just development
- [ ] **App icon:** Meets Marketplace specifications (correct dimensions, no Atlassian branding)
- [ ] **Description accuracy:** Every feature claimed in listing is actually implemented in code
- [ ] **Licensing alignment:** manifest.yml `licensing` setting matches intended pricing model
- [ ] **P&S tab:** All mandatory fields completed in Marketplace portal
- [ ] **Partner KYC:** Verification completed and approved
- [ ] **Version publishing:** Correct version (Marketplace Hub generated) is made public

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rejected for missing legal URLs | LOW | Deploy docs to GitHub Pages, update URLs, resubmit |
| Rejected for trademark violation in name | LOW | Rename app following "X for Product" pattern, resubmit |
| Rejected for "lacks details" (versioning quirk) | LOW | Find Marketplace Hub version, make it public |
| KYC not complete, submission blocked | MEDIUM | Start KYC immediately, wait 1-2 weeks for verification |
| Security scan finds vulnerabilities | MEDIUM | Fix flagged dependencies, redeploy, resubmit |
| License enforcement missing (paid app) | HIGH | Implement license checking in all handlers, add tests, redeploy |
| Privacy claims contradict P&S tab answers | MEDIUM | Align privacy policy text with P&S tab answers, redeploy docs |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing legal URLs | Phase 1: Documentation Polish | `curl -s -o /dev/null -w "%{http_code}" <url>` returns 200 |
| No license checking | Phase 1: Documentation Polish | Decide free/paid, align manifest + code |
| Missing screenshots | Phase 1: Documentation Polish | At least 2 visual assets in `docs/assets/` |
| P&S tab incomplete | Phase 2: Submission Prep | All mandatory fields have drafted answers |
| Trademark violation | Phase 2: Submission Prep | Name follows "X for Product" pattern |
| KYC not started | Phase 0: Pre-work | Partner profile created, KYC submitted |
| Versioning quirk | Phase 2: Submission Prep | Submission checklist includes version check step |

## Sources

- [App approval guidelines](https://developer.atlassian.com/platform/marketplace/app-approval-guidelines/) -- official rejection criteria, HIGH confidence
- [List a Forge app on the Atlassian Marketplace](https://developer.atlassian.com/platform/marketplace/listing-forge-apps/) -- Forge-specific listing steps, HIGH confidence
- [Privacy and security tab in the Marketplace listing](https://developer.atlassian.com/platform/marketplace/security-privacy-tab/) -- mandatory P&S disclosure fields, HIGH confidence
- [Create your app listing on the Atlassian Marketplace](https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/) -- listing field requirements, HIGH confidence
- [Atlassian brand guidelines for Marketplace Partners](https://developer.atlassian.com/platform/marketplace/atlassian-brand-guidelines-for-marketplace-partners/) -- naming and branding rules, HIGH confidence
- [New Security Workflow for App Approval Process](https://developer.atlassian.com/platform/marketplace/app-approval-security-workflow/) -- 2025 security scanning changes, HIGH confidence
- [Marketplace submission "lacks details" (community)](https://community.developer.atlassian.com/t/marketplace-submission-lacks-details/67911) -- undocumented versioning quirk, MEDIUM confidence
- [Marketplace app listing instantly rejected (community)](https://community.developer.atlassian.com/t/marketplace-app-listing-instantly-rejected-by-plugin-checker-with-no-reason-forge-jira-cloud/99247) -- Plugin Checker auto-rejection reports, MEDIUM confidence

---
*Pitfalls research for: Atlassian Marketplace Forge app submission*
*Researched: 2026-03-11*
