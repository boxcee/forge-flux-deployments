---
phase: 6
slug: documentation-update
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 (native ESM via `--experimental-vm-modules`) |
| **Config file** | `package.json` jest config |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` + grep for `forge variables set` in `docs/` (should return zero hits as primary method)
- **After every plan wave:** Visual review of all three target files
- **Before `/gsd:verify-work`:** Full suite must be green + all three files reviewed for consistency
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DOCS-01 | manual-only | Visual review of `docs/setup.md` | n/a | ⬜ pending |
| 06-01-02 | 01 | 1 | DOCS-02 | manual-only | Visual review of `docs/troubleshooting.md` | n/a | ⬜ pending |
| 06-01-03 | 01 | 1 | DOCS-03 | manual-only | Visual review of `docs/marketplace-listing.md` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test scaffolding needed — this is a documentation-only phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Setup guide describes admin UI flow | DOCS-01 | Documentation content — no programmatic behavior | Review `docs/setup.md` sections 2A, 2C, 3A, 3B; confirm admin UI is primary, no `forge variables set` as primary |
| Troubleshooting covers config failures | DOCS-02 | Documentation content — no programmatic behavior | Review `docs/troubleshooting.md` for 503, re-consent, admin page location entries |
| Marketplace listing reflects self-service | DOCS-03 | Documentation content — no programmatic behavior | Review `docs/marketplace-listing.md` How it works, Privacy & Security, Data Storage sections |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
