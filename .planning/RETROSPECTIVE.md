# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Admin Config UX

**Shipped:** 2026-03-12
**Phases:** 2 | **Plans:** 3 | **Tasks:** 7

### What Was Built
- KVS secret storage abstraction with env var fallback for backward compatibility
- UI Kit admin page with FluxCD HMAC secret and ArgoCD bearer token forms
- Webhook handlers migrated from env vars to KVS storage with 503 not-configured guards
- Documentation rewritten to lead with admin UI configuration flow

### What Worked
- TDD approach caught bugs early (ArgoCD webtrigger key mismatch found during testing)
- Phase research identified scope re-consent pitfall before implementation began
- Combining admin page + handler migration into one phase avoided a broken intermediate state
- Milestone audit confirmed 100% requirement coverage before archiving

### What Was Inefficient
- Post-checkpoint fixes (3 commits) after Task 2 — error handling, StrictMode, and webtrigger key fix could have been caught in plan review
- Phase 6 plan marked `[ ]` in ROADMAP.md despite being complete (state sync gap)

### Patterns Established
- KVS key naming: `flux:hmacSecret`, `argocd:bearerToken`
- Resolver validation: type check → trim → length >= 8 → store
- Admin UI first: all user-facing docs lead with settings page, CLI as developer fallback
- 503 for unconfigured state (not 500)

### Key Lessons
1. Forge `storage:app` scope triggers re-consent — plan for migration gap in any scope-adding change
2. UI Kit has no password field — acceptable for infrequent admin config, but limits UX
3. Human-verify checkpoints caught real issues (webtrigger key mismatch) that tests didn't cover

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: ~3 (research, phase 5, phase 6)
- Notable: Phase 5 executed in ~8 min total across 2 plans; Phase 6 in 3 min

---

## Milestone: v1.2 — Webhook Event Log

**Shipped:** 2026-03-16
**Phases:** 4 | **Plans:** 5 | **Tasks:** 12

### What Was Built
- SQL-backed webhook event log with lazy schema init, keyset pagination, and 30-day auto-cleanup
- Admin page Event Log tab with 24h stats strip, source filtering, and status code badges
- Both Flux and ArgoCD handlers log at every exit point with swallowed-error pattern
- release-please automation with GitHub Actions CI/CD
- ArgoCD source value alignment fix

### What Worked
- Milestone audit caught ArgoCD source value mismatch before shipping — gap closure phase 10 fixed it cleanly
- @forge/sql API deviations were caught and auto-fixed during execution (version, DDL method, param binding)
- Single-file frontend approach kept Forge UI simple without premature abstraction
- Phase 9 (release wrapup) executed in 2 min — having all feature work done first made docs/CI trivial

### What Was Inefficient
- Phase 7 plans assumed @forge/sql v4 API that doesn't exist — 3 auto-fix deviations during execution
- ROADMAP.md progress table had formatting inconsistencies (Phase 10 missing milestone column value)
- Nyquist validation missing for all v1.2 phases — not blocking but reduces audit coverage

### Patterns Established
- Forge SQL mock pattern: mock executeDDL + prepare/bindParams/execute chain
- Log-and-swallow: `try { await logEvent(); } catch { /* swallow */ }` at every handler exit
- Keyset pagination: beforeTimestamp + beforeId cursor, N+1 fetch for hasMore detection
- release-please manifest mode for versioning

### Key Lessons
1. Always verify package version exists before specifying in plans — `npm view @forge/sql versions` prevents deviation churn
2. Milestone audit before completion catches cross-layer bugs (source value mismatch) that per-phase verification misses
3. Gap closure phases (decimal or appended) are lightweight and effective for audit-found issues

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: ~4 (phases 7, 8, 9+10, completion)
- Notable: All 5 plans executed in 17 min total — fastest milestone yet

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 4 | 7 | Established GSD workflow, TDD, verification gates |
| v1.1 | 2 | 3 | Added milestone audit before completion, research-driven phase design |
| v1.2 | 4 | 5 | Gap closure phases, CI/CD automation, Forge SQL patterns |

### Cumulative Quality

| Milestone | Tests | New Tests | Zero-Dep Additions |
|-----------|-------|-----------|-------------------|
| v1.0 | 111 | 111 | 4 (docs theme, legal, listing, troubleshooting) |
| v1.1 | 148 | 37 | 4 (@forge/kvs, @forge/resolver, @forge/react, @forge/bridge) |
| v1.2 | 170 | 22 | 1 (@forge/sql) |

### Top Lessons (Verified Across Milestones)

1. TDD catches integration issues early — verified in v1.0 (ArgoCD payload format), v1.1 (webtrigger key mismatch), and v1.2 (source value alignment)
2. Phase research before planning prevents scope surprises — verified in v1.0 (Marketplace requirements) and v1.1 (scope re-consent)
3. Milestone audit before completion catches cross-layer bugs — verified in v1.2 (ArgoCD source mismatch)
