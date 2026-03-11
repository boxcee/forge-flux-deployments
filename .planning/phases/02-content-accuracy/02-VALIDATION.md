---
phase: 2
slug: content-accuracy
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (native ESM via `--experimental-vm-modules`) |
| **Config file** | `package.json` jest config |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + visual review of rendered docs
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-* | 01 | 1 | ACCY-01 | manual-only | `npm test` (no source changes) | N/A | ⬜ pending |
| 02-01-* | 01 | 1 | ACCY-02 | manual-only | `npm test` (no source changes) | N/A | ⬜ pending |
| 02-01-* | 01 | 1 | ACCY-03 | manual-only | `npm test` (no source changes) | N/A | ⬜ pending |
| 02-02-* | 02 | 1 | SITE-03 | manual-only | `npm test` (no source changes) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

This phase creates/edits documentation files only. The existing Jest test suite validates that no source code is accidentally modified. No new test infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FluxCD docs match code | ACCY-01 | Documentation content accuracy — comparing prose/YAML against source | Diff annotation keys in docs/setup.md against src/mapper.js lines 27-44; verify all 5 annotations documented with correct required/optional flags |
| ArgoCD docs match code | ACCY-02 | Documentation content accuracy — comparing template body against source | Diff template body fields in docs/setup.md against src/argocd-mapper.js; verify all 7 top-level fields and 4 annotations present |
| Annotation table complete | ACCY-03 | Documentation completeness — counting keys | Count annotation keys in docs vs code; verify separate tables for FluxCD (5 keys) and ArgoCD (4 keys) |
| Troubleshooting has content | SITE-03 | Documentation content existence | Check docs/troubleshooting.md covers: HMAC/bearer auth (401), missing annotations (400/204), ignored reasons (204), upstream errors (502) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
