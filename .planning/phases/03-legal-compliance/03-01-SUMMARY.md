---
phase: 03-legal-compliance
plan: 01
subsystem: docs
tags: [privacy-policy, terms-of-service, marketplace-compliance, legal, jekyll]

requires:
  - phase: 01-site-foundation
    provides: GitHub Pages site with Jekyll theme and docs/ directory
provides:
  - Marketplace-compliant privacy policy with 9 sections
  - Marketplace-compliant terms of service with 9 sections
affects: [04-marketplace-listing]

tech-stack:
  added: []
  patterns: [stateless-app-legal-pattern]

key-files:
  created: []
  modified:
    - docs/privacy-policy.md
    - docs/terms-of-service.md

key-decisions:
  - "Neutral governing law clause without specific jurisdiction"
  - "Brief GDPR/CCPA not-applicable statements rather than full compliance language"

patterns-established:
  - "Legal docs pattern: reinforce stateless/no-PII/Forge-hosted in every section"

requirements-completed: [LEGL-01, LEGL-02, LEGL-03, LEGL-04]

duration: 1min
completed: 2026-03-11
---

# Phase 3 Plan 1: Legal Documents Summary

**Privacy policy and ToS enhanced with data deletion, data subject rights, termination, acceptable use, governing law, and GDPR/CCPA sections for Marketplace compliance**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-11T15:20:49Z
- **Completed:** 2026-03-11T15:21:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Privacy policy expanded from 5 to 9 sections covering all Marketplace-required topics
- Terms of service expanded from 5 to 9 sections with termination, acceptable use, modifications, and governing law
- Both documents have explicit Effective Date lines
- Deployment metadata explicitly enumerated (app names, namespaces, chart versions, Git SHAs, issue keys, env names, URLs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance privacy policy** - `852e410` (feat)
2. **Task 2: Enhance terms of service** - `653fad9` (feat)

## Files Created/Modified
- `docs/privacy-policy.md` - Added sections 6-9: Data Deletion/Retention, Data Subject Rights, Changes to Policy, International Data; expanded section 1 with explicit data list; added HMAC to section 4
- `docs/terms-of-service.md` - Added sections 6-9: Termination, Acceptable Use, Modifications to Terms, Governing Law; added Effective Date

## Decisions Made
- Used neutral governing law clause ("applicable law, without regard to conflict of law provisions") per research recommendation to avoid specifying jurisdiction for individual developer projects
- Kept GDPR/CCPA statements brief ("not applicable") since no PII is collected; detailed compliance language deferred to LEGL-06

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Privacy policy and ToS are complete and ready for Marketplace review
- GitHub Pages URLs will serve the updated content once pushed to main
- Phase 4 (Marketplace Listing) can reference these live URLs
- Privacy & Security tab answers (plan 03-02) can cross-reference these policies for consistency

---
*Phase: 03-legal-compliance*
*Completed: 2026-03-11*
