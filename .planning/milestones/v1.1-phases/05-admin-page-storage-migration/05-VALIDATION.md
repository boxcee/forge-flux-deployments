---
phase: 5
slug: admin-page-storage-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with native ESM (`--experimental-vm-modules`) |
| **Config file** | `package.json` jest section |
| **Quick run command** | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>' -x` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<changed_module>' -x`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | STOR-01 | unit | `jest --testPathPattern='storage' -x` | No -- Wave 0 | pending |
| 05-01-02 | 01 | 0 | CONF-01, CONF-02, CONF-03, CONF-04 | unit | `jest --testPathPattern='resolver' -x` | No -- Wave 0 | pending |
| 05-01-03 | 01 | 0 | STOR-02, STOR-03 | unit | `jest --testPathPattern='index' -x` | Yes (needs modification) | pending |
| 05-02-01 | 02 | 1 | STOR-01, STOR-02 | unit | `jest --testPathPattern='storage' -x` | No -- Wave 0 | pending |
| 05-02-02 | 02 | 1 | CONF-01, CONF-02, CONF-03, CONF-04 | unit | `jest --testPathPattern='resolver' -x` | No -- Wave 0 | pending |
| 05-02-03 | 02 | 2 | STOR-02, STOR-03 | unit | `jest --testPathPattern='index' -x` | Yes (needs modification) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/storage.test.js` — stubs for STOR-01, STOR-02, STOR-03 (mock `@forge/kvs`)
- [ ] `src/__tests__/resolver.test.js` — stubs for CONF-01, CONF-02, CONF-03, CONF-04 (mock storage.js + `@forge/api`)
- [ ] Update `src/__tests__/index.test.js` — mock `storage.js` instead of `process.env`, add 503 "not configured" test case
- [ ] Framework install: `npm install @forge/kvs @forge/resolver @forge/react @forge/bridge`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin page renders in Jira sidebar | CONF-01, CONF-02 | Requires live Forge environment | `forge tunnel` → navigate to Jira admin → GitOps Deployments |
| Webtrigger URL displays correctly | CONF-04 | URL generated per-installation | Check admin page shows non-empty URL after deploy |
| Re-consent flow after scope addition | STOR-01 | Platform behavior, not testable in unit tests | Deploy to dev, check admin consent prompt appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
