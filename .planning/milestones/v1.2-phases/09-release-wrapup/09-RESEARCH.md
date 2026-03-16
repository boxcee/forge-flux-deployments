# Phase 9: Release Wrap-up - Research

**Researched:** 2026-03-16
**Domain:** Release automation, CI/CD, documentation
**Confidence:** HIGH

## Summary

Phase 9 is a housekeeping phase: CHANGELOG creation with retroactive entries, version bump, documentation update, and GitHub Actions CI/CD setup. No feature code changes.

The standard approach is `release-please` (v4) for automated versioning/changelog, with two GitHub Actions workflows for Forge deployment. The Forge CLI authenticates in CI via `FORGE_EMAIL` + `FORGE_API_TOKEN` environment variables. The project currently has a `v1.1` git tag but no `v1.0` tag and package.json shows `0.1.0`.

**Primary recommendation:** Use manifest mode for release-please (config + manifest JSON files) to bootstrap from v1.2.0. Write retroactive CHANGELOG entries by hand, then let release-please manage everything after.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **release-please GitHub Action** for automated CHANGELOG/versioning
2. **Retroactive CHANGELOG entries** for v1.0.0, v1.1.0, and v1.2.0
3. **Version bump** from 0.1.0 to 1.2.0 in package.json
4. **Two GitHub Actions workflows**: deploy dev on push to main, deploy prod on release
5. **FORGE_EMAIL + FORGE_API_TOKEN** as GitHub secrets for CI auth
6. **Conventional Commits** format going forward
7. **Event log documentation** placement deferred to planner

### Claude's Discretion
- Where to document the event log feature (new page vs section in setup.md)

### Deferred Ideas (OUT OF SCOPE)
None captured.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAINT-03 | CHANGELOG.md created tracking v1.0, v1.1, v1.2 | Hand-written retroactive entries + release-please config for future automation |
| HK-01 | package.json version bumped to 1.2.0 | Direct edit + .release-please-manifest.json bootstrap |
| HK-02 | Documentation updated for event log feature | Add section to existing docs/setup.md or docs/index.md |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| release-please-action | v4 | Automated CHANGELOG + version bumps | Google-maintained, de facto standard for conventional commit releases |
| @forge/cli | 12.x | Forge deployment in CI | Required for `forge deploy`, pin major version |
| actions/checkout | v4 | Git checkout in workflows | GitHub standard |
| actions/setup-node | v4 | Node.js setup in CI | Needed for npm install + forge CLI |

### Configuration Files
| File | Purpose |
|------|---------|
| `release-please-config.json` | Release-please settings (release-type, bootstrap-sha) |
| `.release-please-manifest.json` | Current version tracking for release-please |
| `.github/workflows/release.yml` | Release-please action (creates release PRs) |
| `.github/workflows/deploy.yml` | Forge deploy on push to main + on release created |
| `CHANGELOG.md` | Retroactive + future automated entries |

## Architecture Patterns

### Recommended File Structure
```
.github/
  workflows/
    release.yml          # release-please: creates/updates release PRs
    deploy.yml           # forge deploy: dev on push, prod on release
release-please-config.json
.release-please-manifest.json
CHANGELOG.md
```

### Pattern 1: Release-Please Manifest Mode Bootstrap
**What:** Use manifest mode (config + manifest JSON) instead of inline action inputs. Set the manifest to `"1.2.0"` so release-please knows the current version. Set `bootstrap-sha` to the commit where v1.2.0 is tagged so it does not try to include the entire git history.
**When to use:** Existing projects being onboarded to release-please.

**`release-please-config.json`:**
```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

**`.release-please-manifest.json`:**
```json
{
  ".": "1.2.0"
}
```

### Pattern 2: Separate Workflows for Release and Deploy
**What:** Keep release-please in its own workflow (triggered on push to main). Keep Forge deploy in a separate workflow with two triggers: push to main (dev deploy) and release created (prod deploy).
**When to use:** Always -- separation of concerns. Release-please manages versioning; deploy workflow manages Forge.

### Pattern 3: Forge CLI Auth in CI
**What:** Forge CLI reads `FORGE_EMAIL` and `FORGE_API_TOKEN` from environment. No `forge login` needed.
**When to use:** All CI/CD pipelines for Forge apps.

```yaml
env:
  FORGE_EMAIL: ${{ secrets.FORGE_EMAIL }}
  FORGE_API_TOKEN: ${{ secrets.FORGE_API_TOKEN }}
```

### Anti-Patterns to Avoid
- **Inline release-please config only:** Use manifest files -- they persist state across runs and handle bootstrap correctly.
- **Single workflow for everything:** Separate release-please from deploy. They have different triggers and responsibilities.
- **Unpinned Forge CLI:** Always pin major version (`npm install -g @forge/cli@12`) to avoid CI breakage on major releases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CHANGELOG generation | Manual changelog maintenance | release-please | Parses conventional commits automatically, creates release PRs |
| Version bumping | Manual package.json edits | release-please | Handles semver from commit types (feat = minor, fix = patch) |
| Git tagging | Manual `git tag` | release-please | Creates tags + GitHub Releases on PR merge |
| CI auth for Forge | Custom auth scripts | FORGE_EMAIL + FORGE_API_TOKEN env vars | Official Forge CLI mechanism |

**Key insight:** After initial setup, the entire release process is: merge to main -> release-please opens/updates a Release PR -> merge Release PR -> GitHub Release created -> prod deploy triggers. Zero manual steps.

## Common Pitfalls

### Pitfall 1: release-please Includes Entire Git History
**What goes wrong:** First run of release-please tries to parse all commits since the beginning of time, creating a massive changelog.
**Why it happens:** No bootstrap-sha configured, so release-please has no starting point.
**How to avoid:** Set `bootstrap-sha` in config to the commit that represents v1.2.0, OR (simpler) pre-populate `.release-please-manifest.json` with `"1.2.0"` AND ensure a git tag `v1.2.0` exists. Release-please uses the tag to find the last release.
**Warning signs:** Release PR contains hundreds of changelog entries.

### Pitfall 2: Forge Deploy Fails Silently in CI
**What goes wrong:** `forge deploy` exits 0 but does not actually deploy.
**Why it happens:** Missing or invalid FORGE_EMAIL/FORGE_API_TOKEN. The CLI may not always fail loudly on auth issues.
**How to avoid:** Use `--non-interactive` flag (required in CI -- prevents interactive prompts that hang). Add `forge settings set usage-analytics true` before deploy. Verify secrets are set as GitHub repository secrets (not environment variables in the workflow file).
**Warning signs:** Deploy step completes instantly with no output.

### Pitfall 3: release-please Token Permissions
**What goes wrong:** release-please cannot create PRs or releases.
**Why it happens:** Default `GITHUB_TOKEN` lacks `contents: write` and `pull-requests: write` permissions.
**How to avoid:** Explicitly set permissions in the workflow file.
**Warning signs:** 403 errors in release-please action logs.

### Pitfall 4: Retroactive CHANGELOG Conflicts with release-please
**What goes wrong:** release-please overwrites or duplicates hand-written CHANGELOG entries.
**Why it happens:** release-please manages CHANGELOG.md and may not preserve manually added sections.
**How to avoid:** Write retroactive entries for v1.0.0 and v1.1.0 BELOW where release-please manages content. Release-please prepends new entries at the top. The v1.2.0 entry should match Keep a Changelog format that release-please generates.

### Pitfall 5: Node.js Version Mismatch in CI
**What goes wrong:** npm install or forge CLI fails due to Node version incompatibility.
**Why it happens:** Using wrong Node version in setup-node.
**How to avoid:** Use `node-version: '22'` to match the project's runtime (nodejs22.x in manifest.yml).

### Pitfall 6: Missing v1.2.0 Git Tag
**What goes wrong:** release-please does not know what version was last released.
**Why it happens:** The manifest says 1.2.0 but no git tag exists for v1.2.0.
**How to avoid:** Create the `v1.2.0` tag as part of this phase. Either manually or by letting release-please handle it through its first Release PR. The simpler approach: create the tag manually on the commit that bumps to 1.2.0, then release-please picks up from there.

## Code Examples

### GitHub Actions: release-please workflow
```yaml
# .github/workflows/release.yml
name: Release Please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
Source: [googleapis/release-please-action](https://github.com/googleapis/release-please-action)

### GitHub Actions: Forge deploy workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - run: npm install -g @forge/cli@12

      - name: Deploy to development
        if: github.event_name == 'push'
        run: forge deploy --environment development --non-interactive
        env:
          FORGE_EMAIL: ${{ secrets.FORGE_EMAIL }}
          FORGE_API_TOKEN: ${{ secrets.FORGE_API_TOKEN }}

      - name: Deploy to production
        if: github.event_name == 'release'
        run: forge deploy --environment production --non-interactive
        env:
          FORGE_EMAIL: ${{ secrets.FORGE_EMAIL }}
          FORGE_API_TOKEN: ${{ secrets.FORGE_API_TOKEN }}
```
Source: [Atlassian Forge CI/CD docs](https://developer.atlassian.com/platform/forge/set-up-cicd/)

### CHANGELOG.md Format (Keep a Changelog)
```markdown
# Changelog

## [1.2.0](https://github.com/boxcee/forge-flux-deployments/compare/v1.1.0...v1.2.0) (2026-03-16)

### Features

* Webhook event logging to Forge SQL with 30-day retention
* Admin page Event Log tab with stats, filtering, and pagination
* Daily scheduled cleanup of old events

## [1.1.0](https://github.com/boxcee/forge-flux-deployments/compare/v1.0.0...v1.1.0) (2026-XX-XX)

### Features

* Admin configuration page for webhook secrets
* KVS-based secret storage with admin UI management
* ArgoCD webhook support with bearer token auth

## [1.0.0](https://github.com/boxcee/forge-flux-deployments/releases/tag/v1.0.0) (2026-XX-XX)

### Features

* FluxCD webhook receiver with HMAC verification
* Jira Deployments API integration
* HelmRelease annotation-based metadata extraction
* Marketplace listing and documentation site
```

### release-please-config.json
```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

### .release-please-manifest.json
```json
{
  ".": "1.2.0"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `google-github-actions/release-please-action` | `googleapis/release-please-action@v4` | 2024 | Old repo archived, must use new one |
| `actions/setup-node@v3` | `actions/setup-node@v4` | 2024 | v3 still works but v4 is current |
| Manual CHANGELOG + `npm version` | release-please automation | Ongoing | Zero-touch releases after setup |

**Deprecated/outdated:**
- `google-github-actions/release-please-action` -- archived, use `googleapis/release-please-action@v4`
- Node 20 in CI -- still works but Node 22 matches project runtime

## Existing Project State

| Item | Current State | Target State |
|------|---------------|-------------|
| package.json version | `0.1.0` | `1.2.0` |
| Git tags | `v1.1` (exists) | `v1.0.0`, `v1.1.0`, `v1.2.0` |
| CHANGELOG.md | Does not exist | Retroactive v1.0 + v1.1 + v1.2 entries |
| GitHub Actions | None | release.yml + deploy.yml |
| .github/ directory | Does not exist | Created with workflows/ |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 (native ESM) |
| Config file | package.json `jest` key |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAINT-03 | CHANGELOG.md exists with v1.0, v1.1, v1.2 sections | manual-only | Visual inspection of file content | N/A |
| HK-01 | package.json version is 1.2.0 | smoke | `node -e "const p=JSON.parse(require('fs').readFileSync('package.json'));process.exit(p.version==='1.2.0'?0:1)"` | N/A |
| HK-02 | Documentation updated for event log | manual-only | Visual inspection of docs/ content | N/A |

### Sampling Rate
- **Per task commit:** `npm test` (ensure no regressions from any file changes)
- **Per wave merge:** `npm test && npm run lint`
- **Phase gate:** Full suite green + manual review of CHANGELOG, docs, and workflow YAML

### Wave 0 Gaps
None -- this phase creates new files (CHANGELOG, workflows, config) and modifies existing ones (package.json, docs). No new test files needed. Existing tests verify no regressions.

## Open Questions

1. **Git tag format: `v1.1` vs `v1.1.0`**
   - What we know: Existing tag is `v1.1` (not semver-compliant `v1.1.0`). Release-please expects `v{major}.{minor}.{patch}` format.
   - What's unclear: Whether release-please will recognize `v1.1` as `v1.1.0`.
   - Recommendation: Create proper `v1.0.0` and `v1.1.0` tags. The existing `v1.1` tag can remain as-is but release-please will use `v1.2.0` as its starting point via the manifest.

2. **Event log documentation placement**
   - What we know: User deferred this to planner's discretion.
   - Recommendation: Add a new "Event Log" section to `docs/setup.md` after the existing setup sections, since that is the primary user-facing documentation page. Keep it brief -- the feature is self-explanatory from the UI.

## Sources

### Primary (HIGH confidence)
- [Atlassian Forge CI/CD docs](https://developer.atlassian.com/platform/forge/set-up-cicd/) -- official Forge CLI auth and deploy commands
- [googleapis/release-please-action](https://github.com/googleapis/release-please-action) -- v4 action, configuration, outputs
- [release-please manifest docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) -- bootstrap, config format

### Secondary (MEDIUM confidence)
- [release-please npm](https://www.npmjs.com/package/release-please) -- version and feature verification
- [a9-forge-gh-action](https://github.com/wjkennedy/a9-forge-gh-action) -- community patterns for Forge CI

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- release-please v4 and Forge CLI auth are well-documented official tools
- Architecture: HIGH -- two-workflow pattern is standard, Forge CI/CD docs are authoritative
- Pitfalls: HIGH -- bootstrap-sha and token permissions are widely reported issues with clear solutions

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable tools, 30-day validity)
