# Phase 9: Release Wrap-up — Context

**Phase goal:** v1.2 is documented and versioned for release
**Requirements:** MAINT-03, HK-01, HK-02

## Decisions

### 1. Automated CHANGELOG via release-please

**Tool:** [release-please](https://github.com/googleapis/release-please) GitHub Action
**How it works:**
- Runs on every push to `main`
- Parses Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Auto-creates/updates a standing "Release PR" with CHANGELOG.md updates + version bump in package.json
- Merging the Release PR creates a GitHub Release + git tag
- Zero manual intervention after initial setup

**Commit convention:** Conventional Commits strictly enforced going forward. Format: `type(scope): description`. The repo already loosely follows this pattern.

### 2. Retroactive CHANGELOG entries

v1.0 and v1.1 never had CHANGELOG entries or version bumps. The initial CHANGELOG.md will include:
- **v1.0.0** — Brief AI-written summary from planning docs (site foundation, content, legal, marketplace)
- **v1.1.0** — Brief AI-written summary (admin page, KVS storage migration, docs update)
- **v1.2.0** — Current milestone (event log backend, admin UI event log tab, release automation)

These are hand-written once. Release-please manages everything after v1.2.0.

### 3. Version strategy

- Current version: `0.1.0` in package.json
- Set to `1.2.0` as part of this phase
- Create `v1.2.0` git tag as release-please's starting point
- Forge manifest has no version field — package.json is the single source of truth
- Release-please will manage all future version bumps

### 4. CI/CD pipeline — GitHub Actions

Two deployment triggers:

| Event | Action |
|-------|--------|
| Push to `main` (any merge) | `forge deploy --environment development --non-interactive` |
| Release created (Release PR merged) | `forge deploy --environment production --non-interactive` |

**Required GitHub secrets:**
- `FORGE_EMAIL` — Atlassian account email for Forge CLI auth
- `FORGE_API_TOKEN` — Atlassian API token for Forge CLI auth

### 5. Event log documentation placement

Deferred to planner — no user preference on where the event log feature gets documented (new page vs. section in setup.md).

## Deferred Ideas

None captured.

## Code Context

### Files to create
- `.github/workflows/release.yml` — release-please action
- `.github/workflows/deploy.yml` — Forge deploy on push to main + on release
- `CHANGELOG.md` — initial retroactive entries

### Files to modify
- `package.json` — version bump to `1.2.0`

### Existing patterns
- No existing GitHub Actions — starting from scratch
- Forge CLI deploy command: `forge deploy --environment <env> --non-interactive`
- Forge auth in CI uses `FORGE_EMAIL` + `FORGE_API_TOKEN` env vars

---
*Created: 2026-03-16*
*Phase boundary: CHANGELOG, version bump, documentation, CI/CD automation. No feature work.*
