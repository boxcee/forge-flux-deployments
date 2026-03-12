---
phase: 05-admin-page-storage-migration
plan: 01
subsystem: api
tags: [forge-kvs, forge-resolver, esm, jest, tdd]

requires:
  - phase: 04-argocd-support
    provides: "bearer.js auth pattern, argocd-mapper.js"
provides:
  - "KVS secret abstraction with env var fallback (storage.js)"
  - "Forge resolver with 6 defined handlers (resolver.js)"
  - "Input validation pattern for secret mutations"
affects: [05-02, admin-ui, webhook-handlers]

tech-stack:
  added: ["@forge/kvs", "@forge/resolver", "@forge/react", "@forge/bridge"]
  patterns: ["KVS getSecret/setSecret/deleteSecret wrapping", "Resolver define() handler pattern", "Input validation with trim + length check"]

key-files:
  created: ["src/storage.js", "src/resolver.js", "src/__tests__/storage.test.js", "src/__tests__/resolver.test.js"]
  modified: ["package.json", "package-lock.json"]

key-decisions:
  - "Empty string caught by type/empty check before length validation in resolver"
  - "getConfigStatus reuses getFluxSecret/getArgoSecret to include env var fallback in status"

patterns-established:
  - "KVS key naming: 'flux:hmacSecret', 'argocd:bearerToken'"
  - "Resolver validation: type check -> trim -> length >= 8 -> store"
  - "Resolver return shape: { success: boolean, error?: string }"

requirements-completed: [STOR-01, CONF-01, CONF-02, CONF-03, CONF-04]

duration: 2min
completed: 2026-03-12
---

# Phase 5 Plan 01: Storage & Resolver Summary

**KVS secret abstraction with env var fallback and Forge resolver with 6 validated handlers**

## Performance

- **Duration:** 2 min 32 sec
- **Started:** 2026-03-12T10:15:51Z
- **Completed:** 2026-03-12T10:18:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- storage.js wraps @forge/kvs with KVS-first, env-var-fallback chain for backward compatibility
- resolver.js defines 6 handlers (getConfigStatus, getWebtriggerUrls, set/delete for both providers)
- Input validation rejects non-string, empty, and sub-8-char secrets before storage
- 37 new tests (16 storage + 21 resolver), full suite at 146 tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create storage.js with tests** - `7f3ed43` (feat)
2. **Task 2: Create resolver.js with tests** - `41f3816` (feat)

_TDD flow: RED (tests fail, module missing) -> GREEN (implement, tests pass) for both tasks_

## Files Created/Modified
- `src/storage.js` - KVS secret abstraction with 7 named exports
- `src/resolver.js` - Forge resolver with 6 define() handlers and input validation
- `src/__tests__/storage.test.js` - 16 tests covering KVS priority, env fallback, config status
- `src/__tests__/resolver.test.js` - 21 tests covering handlers, validation edge cases
- `package.json` - Added @forge/kvs, @forge/resolver, @forge/react, @forge/bridge
- `package-lock.json` - Lockfile updated

## Decisions Made
- Empty string caught by type/empty check before length validation (clearer error message)
- getConfigStatus reuses getFluxSecret/getArgoSecret internally so env var fallback is reflected in status
- Webtrigger module keys hardcoded as 'flux-webhook' and 'argocd-webhook' matching manifest.yml

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- storage.js and resolver.js ready for consumption by Plan 02 (admin UI + handler migration)
- All new dependencies installed, no manifest changes needed yet (Plan 02 adds admin page module)

## Self-Check: PASSED

- [x] src/storage.js exists with 7 exports
- [x] src/resolver.js exists with handler export
- [x] src/__tests__/storage.test.js exists (16 tests)
- [x] src/__tests__/resolver.test.js exists (21 tests)
- [x] Commit 7f3ed43 found (Task 1)
- [x] Commit 41f3816 found (Task 2)
- [x] Full test suite: 146 tests passing
- [x] Lint: clean

---
*Phase: 05-admin-page-storage-migration*
*Completed: 2026-03-12*
