---
phase: 3
slug: legal-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (content review + HTTP checks) |
| **Config file** | None — content authoring phase |
| **Quick run command** | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| **Full suite command** | Manual review of all 5 requirements |
| **Estimated runtime** | ~10 seconds (curl checks) |

---

## Sampling Rate

- **After every task commit:** Verify Markdown structure and frontmatter are valid
- **After every plan wave:** Push to main, verify GitHub Pages URLs return 200
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | LEGL-01 | smoke | `curl -s -o /dev/null -w "%{http_code}" .../privacy-policy` | N/A | ⬜ pending |
| 3-01-02 | 01 | 1 | LEGL-03 | manual-only | Review sections against gap analysis checklist | N/A | ⬜ pending |
| 3-01-03 | 01 | 1 | LEGL-02 | smoke | `curl -s -o /dev/null -w "%{http_code}" .../terms-of-service` | N/A | ⬜ pending |
| 3-01-04 | 01 | 1 | LEGL-04 | manual-only | Review sections against gap analysis checklist | N/A | ⬜ pending |
| 3-02-01 | 02 | 1 | LEGL-05 | manual-only | Verify marketplace-listing.md has all ~28 answers | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed; this is content authoring.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Privacy policy covers data collection, storage, sharing, deletion | LEGL-03 | Content review — no automated semantic check | Compare sections against gap analysis in 03-RESEARCH.md |
| ToS covers liability, termination, acceptable use | LEGL-04 | Content review — no automated semantic check | Compare sections against gap analysis in 03-RESEARCH.md |
| P&S tab answers complete and consistent with policy | LEGL-05 | Content review — cross-reference with privacy policy | Verify all ~28 answers present, terminology matches policy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
