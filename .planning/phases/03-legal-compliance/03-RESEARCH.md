# Phase 3: Legal & Compliance - Research

**Researched:** 2026-03-11
**Domain:** Atlassian Marketplace legal requirements, privacy policy, terms of service
**Confidence:** HIGH

## Summary

This phase creates publication-ready privacy policy and terms of service pages on GitHub Pages, and drafts the Privacy & Security tab answers for Marketplace submission. The existing drafts in `docs/privacy-policy.md` and `docs/terms-of-service.md` cover the basics but have gaps against Atlassian's requirements.

The app's architecture (stateless Forge app, no external storage, no PII) makes compliance straightforward. Most Privacy & Security tab answers will be "No" or "Not applicable." The main work is ensuring the privacy policy explicitly covers data deletion/retention (Atlassian checks for this), adding missing ToS sections (termination, acceptable use), and drafting the ~28 Privacy & Security tab responses.

**Primary recommendation:** Enhance existing drafts to fill Atlassian-required gaps, then draft Privacy & Security tab answers as a companion document aligned with what the policies state.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEGL-01 | Privacy policy is accessible at a live GitHub Pages URL | GitHub Pages already configured from Phase 1; privacy-policy.md exists in docs/ |
| LEGL-02 | Terms of service/EULA is accessible at a live GitHub Pages URL | terms-of-service.md exists in docs/; needs content gaps filled |
| LEGL-03 | Privacy policy content reviewed for Marketplace compliance | Gap analysis below identifies missing sections |
| LEGL-04 | Terms of service content reviewed for Marketplace compliance | Gap analysis below identifies missing sections |
| LEGL-05 | Privacy & Security tab answers drafted | Full question list documented below with recommended answers |
</phase_requirements>

## Standard Stack

No libraries needed. This phase is pure Markdown content authoring within the existing Jekyll/GitHub Pages setup from Phase 1.

### Existing Infrastructure
| Component | Status | Location |
|-----------|--------|----------|
| GitHub Pages | Configured | `docs/` directory on `main` branch |
| just-the-docs theme | Active | `_config.yml` with `remote_theme` |
| Privacy policy draft | Exists | `docs/privacy-policy.md` (nav_order: 4) |
| Terms of service draft | Exists | `docs/terms-of-service.md` (nav_order: 5) |
| Marketplace listing draft | Exists | `docs/marketplace-listing.md` (excluded from site) |

### Live URLs (once deployed)
| Page | URL |
|------|-----|
| Privacy Policy | `https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| Terms of Service | `https://boxcee.github.io/forge-flux-deployments/terms-of-service` |

## Architecture Patterns

### Content Structure Pattern

Legal pages should follow this structure for Marketplace review:

```
docs/
├── privacy-policy.md    # Public-facing, nav_order: 4
├── terms-of-service.md  # Public-facing, nav_order: 5
└── marketplace-listing.md  # Internal reference (excluded from site build)
    └── Privacy & Security tab answers section (already partially exists)
```

The Privacy & Security tab answers go in `marketplace-listing.md` since that file is excluded from the site build (`_config.yml` excludes it) and already contains API scope justifications and partial privacy disclosures.

### Writing Pattern for Stateless Forge Apps

Every legal section should reinforce: **stateless, no PII, Forge-hosted, no external connections.** This is the app's strongest compliance story. Repeat it consistently across privacy policy, ToS, and P&S tab answers.

## Gap Analysis: Privacy Policy

### Current State (docs/privacy-policy.md)

| Section | Present | Atlassian Requirement Met |
|---------|---------|--------------------------|
| Data collection | Yes | Partial -- needs explicit "what data" list |
| Data usage/processing | Yes | Yes |
| Third-party sharing | Yes (Forge platform) | Yes |
| Data storage | Yes (none) | Yes |
| Security | Yes (brief) | Needs HMAC mention |
| Contact | Yes | Yes |
| **Data deletion/retention** | **Missing** | **REQUIRED -- Atlassian checks this** |
| **Data subject rights** | **Missing** | **Recommended** |
| **Changes to policy** | **Missing** | **Standard practice** |
| **Effective date vs last updated** | Partial | Add effective date |

### Required Additions

1. **Data Deletion & Retention section**: State explicitly that no data is retained, so no deletion is necessary. Atlassian's guidelines state "Failure to respect data deletion requests may result in de-listing." Even for stateless apps, this must be addressed explicitly.

2. **Data Subject Rights section**: Brief section stating that since no PII is collected or stored, there is no personal data to access, modify, or delete. Direct users to Atlassian for data within Jira.

3. **Changes to Policy section**: Standard clause about how users will be notified of changes.

4. **Explicit data enumeration**: Currently says "deployment metadata" -- expand to list: application names, namespaces, Helm chart versions, Git SHAs, Jira issue keys, environment names, deployment URLs. Make clear none of these constitute PII.

## Gap Analysis: Terms of Service

### Current State (docs/terms-of-service.md)

| Section | Present | Marketplace Requirement Met |
|---------|---------|----------------------------|
| License grant | Yes | Yes |
| Warranty disclaimer | Yes | Yes |
| Limitation of liability | Yes | Yes |
| Configuration responsibility | Yes | Yes |
| Atlassian terms reference | Yes | Yes |
| **Termination** | **Missing** | **Standard requirement** |
| **Acceptable use** | **Missing** | **Marketplace expects this** |
| **Modifications to terms** | **Missing** | **Standard practice** |
| **Governing law** | **Missing** | **Recommended** |

### Required Additions

1. **Termination section**: How the agreement ends (uninstall = termination), what survives termination (liability, warranty disclaimers).

2. **Acceptable Use section**: Prohibited uses (reverse engineering, circumventing security, using for illegal purposes). Can reference Atlassian's own Acceptable Use Policy.

3. **Modifications to Terms section**: Right to update terms, how users are notified.

4. **Governing Law section**: Jurisdiction clause. Since the license is ELv2, align with that.

## Gap Analysis: Privacy & Security Tab

### Current State (in marketplace-listing.md)

The existing `Privacy & Security Disclosures` section covers 4 items. The full tab requires ~28 answers. Below are all required answers for this app.

### Complete Privacy & Security Tab Answers

#### Data Storage & Processing
| Question | Answer | Rationale |
|----------|--------|-----------|
| Store user data outside Atlassian? | No | Stateless, no database |
| Process data outside Atlassian? | No | Runs entirely on Forge runtime |
| Log end-user data? | No | No logging infrastructure; Forge runtime logs are Atlassian-managed |
| Store logs outside Atlassian? | No | No external logging |

#### Third-Party Sharing
| Question | Answer | Rationale |
|----------|--------|-----------|
| Share data with sub-processors? | No | No external connections |
| Share logs with third parties? | No | No external logging |
| Log sharing essential to function? | N/A | No sharing occurs |

#### Data Residency
| Question | Answer | Rationale |
|----------|--------|-----------|
| Data residency support? | "App stores exclusively within Atlassian products supporting residency" | All data goes to Jira via Forge |
| Support data migration between regions? | N/A | No app-side storage |

#### Data Retention
| Question | Answer | Rationale |
|----------|--------|-----------|
| Retain data after uninstall? | No | No persistent storage |
| Custom retention periods? | N/A | No data retained |

#### Data Protection
| Question | Answer | Rationale |
|----------|--------|-----------|
| Privacy-enhancing technologies? | No | No data stored to protect |
| Full disk encryption? | N/A | No external storage |

#### GDPR
| Question | Answer | Rationale |
|----------|--------|-----------|
| GDPR data controller? | No | No PII collected |
| GDPR data processor? | No | No PII processed/stored; deployment metadata passes through to Jira |
| Transfer EEA data outside EEA? | No | No external transfers |
| GDPR transfer mechanisms? | N/A | No transfers |

#### CCPA
| Question | Answer | Rationale |
|----------|--------|-----------|
| CCPA business? | Not Applicable | No personal information collected |
| CCPA service provider? | Not Applicable | No personal information processed |

#### Security & Authentication
| Question | Answer | Rationale |
|----------|--------|-----------|
| Access PATs/passwords/shared secrets? | No | Uses Forge app auth only; HMAC secret is stored as Forge env var, not user credential |
| Data Processing Agreement? | No | No data processing outside Atlassian |

#### Certifications
| Question | Answer | Rationale |
|----------|--------|-----------|
| Compliance certifications? | No | Individual developer project |
| CAIQ Lite completed? | No | Not applicable for current scale |

#### Security Program
| Question | Answer | Value |
|----------|--------|-------|
| Security contact email | Provide | GitHub issues URL or email |
| Security policy link | Optional | Can link to GitHub security policy |
| Privacy policy link | Required | `https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| App permissions justification | Required | Already drafted in marketplace-listing.md |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Legal boilerplate | Writing from scratch | Enhance existing drafts | Drafts already have correct structure and tone |
| GDPR/CCPA language | Full compliance text | Simple "not applicable" statements | App collects no PII; v2 requirement LEGL-06 covers detailed GDPR/CCPA language |
| Cookie policy | Separate cookie page | N/A (no cookies) | Forge apps don't set cookies; don't create unnecessary pages |

## Common Pitfalls

### Pitfall 1: Missing Data Deletion Statement
**What goes wrong:** Marketplace review flags the privacy policy for not addressing data deletion.
**Why it happens:** Developers of stateless apps assume "no storage" implies "no deletion needed" and skip the section.
**How to avoid:** Explicitly state: "The App does not store any data. There is no data to delete. If you uninstall the App, no residual data remains."
**Warning signs:** Privacy policy has no section mentioning deletion, retention, or uninstall.

### Pitfall 2: Inconsistency Between Policy and Tab Answers
**What goes wrong:** Privacy policy says one thing, P&S tab says another. Review catches the mismatch.
**Why it happens:** Policy and tab answers written at different times without cross-reference.
**How to avoid:** Draft tab answers referencing the policy. Use the same language for data handling descriptions.
**Warning signs:** Different terminology for the same concept across documents.

### Pitfall 3: Overstating Compliance
**What goes wrong:** Claiming SOC2 or ISO27K compliance when none exists.
**Why it happens:** Desire to look more trustworthy on the P&S tab.
**How to avoid:** Answer "No" honestly. Individual developer projects without certifications should not claim them.
**Warning signs:** Any "Yes" to certification questions without actual certificates.

### Pitfall 4: Missing Termination Clause in ToS
**What goes wrong:** Marketplace review expects termination provisions.
**Why it happens:** ToS templates for open-source projects often skip this.
**How to avoid:** Add explicit termination section: uninstall terminates the agreement, surviving clauses listed.
**Warning signs:** No mention of how the agreement ends.

### Pitfall 5: TODO URLs Left in marketplace-listing.md
**What goes wrong:** Phase 4 inherits broken references if URLs aren't updated here.
**Why it happens:** Privacy policy and ToS URLs in marketplace-listing.md are still `(TODO: create and host)`.
**How to avoid:** Update the URLs in marketplace-listing.md as part of this phase once pages are confirmed live.
**Warning signs:** Grep for "TODO" in marketplace-listing.md.

## Code Examples

### Privacy Policy Data Deletion Section
```markdown
## Data Deletion & Retention

The App does not store, persist, or retain any data. All deployment event data is processed
in real-time within the Atlassian Forge runtime and forwarded directly to the Jira Deployments
API. No data remains in the App after processing.

- **On uninstall:** No residual data exists. Uninstalling the App removes the webhook endpoint.
  Deployment records already written to Jira remain as part of your Jira data and are governed
  by Atlassian's data policies.
- **Deletion requests:** Since the App stores no data, there is no App-side data to delete.
  For deployment records in Jira, contact Atlassian support or manage them through Jira's
  built-in tools.
```

### ToS Termination Section
```markdown
## Termination

This agreement is effective until terminated. You may terminate it at any time by uninstalling
the App from your Jira Cloud instance. We may terminate or suspend access to the App at any
time, without prior notice, for any reason.

Upon termination, all rights granted under this agreement cease immediately. Sections 2
(Disclaimer of Warranty), 3 (Limitation of Liability), and this section survive termination.
```

### ToS Acceptable Use Section
```markdown
## Acceptable Use

You agree not to:
- Reverse engineer, decompile, or disassemble the App
- Use the App for any unlawful purpose
- Attempt to circumvent the App's security mechanisms (including HMAC verification)
- Use the App in a manner that could damage, disable, or impair the Atlassian platform

Your use must also comply with the
[Atlassian Acceptable Use Policy](https://www.atlassian.com/legal/acceptable-use-policy).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Optional P&S tab | Mandatory P&S tab for cloud apps | 2025 | Must complete all questions for new listings |
| Simple privacy URL | Privacy policy + P&S tab disclosures | 2024-2025 | Need both a policy page AND structured answers |
| Generic EULA link | Customer terms URL in listing | Ongoing | ToS/EULA URL required in Marketplace listing |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (content review + HTTP checks) |
| Config file | None |
| Quick run command | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| Full suite command | Manual review of all 5 requirements |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEGL-01 | Privacy policy accessible at GitHub Pages URL | smoke | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/privacy-policy` | N/A |
| LEGL-02 | ToS accessible at GitHub Pages URL | smoke | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/terms-of-service` | N/A |
| LEGL-03 | Privacy policy covers required topics | manual-only | Review sections against gap analysis checklist | N/A |
| LEGL-04 | ToS covers required topics | manual-only | Review sections against gap analysis checklist | N/A |
| LEGL-05 | P&S tab answers drafted | manual-only | Verify marketplace-listing.md has all ~28 answers | N/A |

### Sampling Rate
- **Per task commit:** Verify file renders locally with `bundle exec jekyll serve` or check Markdown structure
- **Per wave merge:** Push to main, verify GitHub Pages URLs return 200
- **Phase gate:** All 5 URLs/docs verified before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing docs infrastructure covers all phase requirements. No test framework needed; this is content authoring.

## Open Questions

1. **GitHub Pages deployment status**
   - What we know: Phase 1 configured GitHub Pages with docs/ directory
   - What's unclear: Whether Pages is actively serving (STATE.md flagged this as a concern)
   - Recommendation: Verify with a curl to the base URL before declaring LEGL-01/02 complete

2. **GDPR/CCPA detailed language**
   - What we know: Marked as v2 requirement (LEGL-06), out of scope for this phase
   - What's unclear: Whether basic GDPR/CCPA "not applicable" statements are sufficient for initial review
   - Recommendation: Include brief "not applicable" statements in privacy policy; defer detailed language to LEGL-06

3. **Governing law jurisdiction**
   - What we know: ELv2 license is used, author appears to be in EU
   - What's unclear: Preferred jurisdiction for ToS
   - Recommendation: Use a neutral clause or omit (many Marketplace apps omit this)

## Sources

### Primary (HIGH confidence)
- [Atlassian Privacy & Security Tab Documentation](https://developer.atlassian.com/platform/marketplace/security-privacy-tab/) -- full question list and requirements
- [Atlassian Data Privacy Guidelines](https://developer.atlassian.com/platform/marketplace/data-privacy-guidelines/) -- privacy policy content requirements
- [Atlassian Marketplace Terms of Use](https://www.atlassian.com/licensing/marketplace/termsofuse) -- vendor EULA requirements

### Secondary (MEDIUM confidence)
- [Atlassian Security Guidelines](https://developer.atlassian.com/platform/marketplace/security-guidelines/) -- general security review requirements
- [Atlassian App Approval Security Workflow](https://developer.atlassian.com/platform/marketplace/app-approval-security-workflow/) -- review process

### Existing Project Files (HIGH confidence)
- `docs/privacy-policy.md` -- current draft, gap analysis performed
- `docs/terms-of-service.md` -- current draft, gap analysis performed
- `docs/marketplace-listing.md` -- partial P&S disclosures, API scope justifications
- `manifest.yml` -- actual permissions and app configuration

## Metadata

**Confidence breakdown:**
- Privacy policy gaps: HIGH -- verified against Atlassian's published requirements
- ToS gaps: HIGH -- standard Marketplace patterns cross-referenced
- P&S tab answers: HIGH -- complete question list from official Atlassian documentation
- URL accessibility: MEDIUM -- depends on GitHub Pages deployment status

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain; Atlassian updated requirements Feb 2026)
