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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 4 | 7 | Established GSD workflow, TDD, verification gates |
| v1.1 | 2 | 3 | Added milestone audit before completion, research-driven phase design |

### Cumulative Quality

| Milestone | Tests | New Tests | Zero-Dep Additions |
|-----------|-------|-----------|-------------------|
| v1.0 | 111 | 111 | 4 (docs theme, legal, listing, troubleshooting) |
| v1.1 | 148 | 37 | 4 (@forge/kvs, @forge/resolver, @forge/react, @forge/bridge) |

### Top Lessons (Verified Across Milestones)

1. TDD catches integration issues early — verified in both v1.0 (ArgoCD payload format) and v1.1 (webtrigger key mismatch)
2. Phase research before planning prevents scope surprises — verified in v1.0 (Marketplace requirements) and v1.1 (scope re-consent)
