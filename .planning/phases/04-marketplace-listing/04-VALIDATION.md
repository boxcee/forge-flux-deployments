---
phase: 4
slug: marketplace-listing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (content/asset phase, no code changes) |
| **Config file** | N/A |
| **Quick run command** | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| **Full suite command** | Manual checklist verification (URL resolution + icon spec + content cross-check) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Verify changed content against cross-check table
- **After every plan wave:** Full URL resolution check + icon spec check
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | MRKT-01 | smoke | `curl -s -o /dev/null -w "%{http_code}" <each URL>` | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | MRKT-02 | manual-only | Cross-check listing claims against source files | N/A | ⬜ pending |
| 04-01-03 | 01 | 1 | MRKT-03 | smoke | `sips -g pixelWidth -g pixelHeight docs/assets/icon.png && file docs/assets/icon.png` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

No test framework needed — this is a content/asset validation phase with no code changes.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Listing copy matches source code behavior | MRKT-02 | Requires semantic understanding of code vs marketing claims | Compare each listing claim against source files using cross-check table from research |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
