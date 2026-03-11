---
phase: 1
slug: site-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (static site, no unit tests applicable) |
| **Config file** | N/A |
| **Quick run command** | `open https://boxcee.github.io/forge-flux-deployments/` |
| **Full suite command** | Manual: check all pages load, sidebar nav works, search returns results, no 404s |
| **Estimated runtime** | ~120 seconds (GitHub Pages build + manual check) |

---

## Sampling Rate

- **After every task commit:** Push to main, wait for GitHub Pages build (~1-2 min), visually verify changed page
- **After every plan wave:** Full manual walkthrough of all pages and links
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | SITE-01 | manual | Visit site, verify sidebar has 5 items, search box works | N/A | ⬜ pending |
| TBD | TBD | TBD | SITE-02 | manual | Click every sidebar link, verify no 404s | N/A | ⬜ pending |
| TBD | TBD | TBD | REPO-01 | manual | Visit GitHub repo root, verify README renders with docs link | N/A | ⬜ pending |
| TBD | TBD | TBD | REPO-02 | manual | `head -5 LICENSE` should show Elastic License 2.0 header | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

This phase produces static content files only. No test framework installation needed. Validation is visual/manual after GitHub Pages deployment.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar shows 5 items in correct order | SITE-01 | Visual layout verification on rendered site | Visit site → sidebar shows: Home, Setup, Troubleshooting, Privacy, Terms |
| Search returns results | SITE-01 | Client-side lunr.js requires rendered site | Type "setup" in search → results appear |
| All sidebar links work | SITE-02 | Requires deployed GitHub Pages site | Click each sidebar item → page loads, no 404 |
| README links to docs site | REPO-01 | Visual check on GitHub repo page | Visit repo root → README has link to Pages URL |
| LICENSE is ELv2 | REPO-02 | Content verification | `head -5 LICENSE` shows "Elastic License 2.0" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
