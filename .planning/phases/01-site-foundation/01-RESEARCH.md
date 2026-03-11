# Phase 1: Site Foundation - Research

**Researched:** 2026-03-11
**Domain:** Jekyll / GitHub Pages / just-the-docs theme / Elastic License 2.0
**Confidence:** HIGH

## Summary

Phase 1 migrates the existing GitHub Pages site from `jekyll-theme-minimal` to `just-the-docs`, adds sidebar navigation with search, creates a proper root README.md, replaces the MIT LICENSE with Elastic License 2.0, and adds CONTRIBUTING.md. The scope is well-defined: theme swap in `_config.yml`, front matter additions to existing pages, new content for index/README/CONTRIBUTING/LICENSE, ToS license reference update, and file exclusions.

All decisions are locked via CONTEXT.md. The just-the-docs theme is mature, well-documented, and designed specifically for GitHub Pages via `remote_theme`. No build step, no Gemfile, no CI pipeline needed -- GitHub Pages handles everything natively.

**Primary recommendation:** Swap `remote_theme` to `just-the-docs/just-the-docs`, add `nav_order` front matter to all pages, configure `_config.yml` for search/aux_links/footer, and use Jekyll's `exclude` list for marketplace-listing.md and docs/plans/.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Docs-first sidebar order: Home > Setup > Troubleshooting > Privacy > Terms
- Short labels in sidebar: Home, Setup, Troubleshooting, Privacy, Terms
- Built-in lunr.js search enabled
- Aux link (top-right): "Install from Marketplace" with placeholder URL until listing is live
- Footer: copyright only -- "(c) 2026 GitOps Deployments for Jira"
- Elastic License 2.0 (ELv2) -- copyright holder: "Temptek"
- Terms-of-service must reference ELv2 instead of MIT
- `marketplace-listing.md` excluded via `_config.yml` exclude list
- `docs/plans/` excluded via `_config.yml` exclude list
- Centralized exclusion in _config.yml, not per-file front matter
- Feature showcase index page with value proposition, how-it-works steps, deployment states table
- README: overview + links style (~30 lines), separate CONTRIBUTING.md
- No dev setup in README

### Claude's Discretion
- Badge selection for README header (license, Marketplace, Node.js version)
- Color scheme for just-the-docs (default or custom)
- Exact page descriptions in front matter

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Site uses just-the-docs theme with sidebar navigation and search | _config.yml `remote_theme` + `nav_order` front matter + `search_enabled: true` |
| SITE-02 | All pages render correctly on GitHub Pages with working links | Front matter on all pages, relative links with `.md` extension removed, exclude list for non-doc files |
| REPO-01 | Root README.md exists as GitHub landing page with links to docs site | New file at repo root with badges, description, features, quick-start excerpt, links |
| REPO-02 | LICENSE file exists with appropriate license | Replace MIT with Elastic License 2.0, copyright holder "Temptek" |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| just-the-docs | latest (via remote_theme) | Documentation theme | De facto standard for GitHub Pages docs sites; built-in search, sidebar nav, responsive |
| Jekyll | GitHub Pages default | Static site generator | Native GitHub Pages support, no CI needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jekyll-remote-theme | (GitHub Pages built-in) | Load theme without Gemfile | Always -- avoids local Ruby setup |
| lunr.js | (bundled with just-the-docs) | Client-side search | Enabled by default in just-the-docs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| just-the-docs | Docusaurus/MkDocs | Would require CI pipeline and build step; user locked in just-the-docs |

**Installation:** No installation needed. GitHub Pages builds automatically from `docs/` on push.

## Architecture Patterns

### Recommended Project Structure
```
docs/
  _config.yml           # Theme, search, aux_links, footer, exclude list
  index.md              # Home page (nav_order: 1)
  setup.md              # Setup guide (nav_order: 2)
  troubleshooting.md    # Troubleshooting (nav_order: 3) -- NEW
  privacy-policy.md     # Privacy policy (nav_order: 4)
  terms-of-service.md   # Terms of service (nav_order: 5)
  marketplace-listing.md  # EXCLUDED from site via _config.yml
  plans/                  # EXCLUDED from site via _config.yml
  assets/
    icon.png
    icon.svg
README.md               # Repo root -- GitHub landing page
LICENSE                  # Elastic License 2.0
CONTRIBUTING.md          # Contribution guidelines -- NEW
```

### Pattern 1: _config.yml for just-the-docs via remote_theme
**What:** Complete theme configuration in a single file
**When to use:** Always -- this is the control center for the site
**Example:**
```yaml
# Source: https://just-the-docs.com/docs/configuration/
title: GitOps Deployments for Jira
description: Track FluxCD and ArgoCD deployments directly in Jira issues.

remote_theme: just-the-docs/just-the-docs
plugins:
  - jekyll-remote-theme

color_scheme: default

logo: /assets/icon.svg

search_enabled: true
search:
  heading_level: 2
  previews: 3
  preview_words_before: 5
  preview_words_after: 10

heading_anchors: true

aux_links:
  "Install from Marketplace":
    - "https://marketplace.atlassian.com/"
aux_links_new_tab: true

footer_content: "&copy; 2026 GitOps Deployments for Jira"

exclude:
  - marketplace-listing.md
  - plans/
```

### Pattern 2: Page Front Matter with nav_order
**What:** Each page declares its sidebar position and title
**When to use:** Every .md file that should appear in sidebar
**Example:**
```yaml
# Source: https://just-the-docs.com/docs/navigation/main/order/
---
title: Home
nav_order: 1
description: "Track FluxCD and ArgoCD deployments directly in Jira issues."
---
```

### Pattern 3: Jekyll exclude list
**What:** Prevents files/directories from being processed and published
**When to use:** For marketplace-listing.md and plans/ directory
**Example:**
```yaml
# In _config.yml -- standard Jekyll configuration
exclude:
  - marketplace-listing.md
  - plans/
```
Note: Jekyll's `exclude` is relative to the site source directory (docs/).

### Anti-Patterns to Avoid
- **Per-file `published: false` front matter:** User explicitly wants centralized exclusion in _config.yml, not scattered front matter
- **Using `theme:` instead of `remote_theme:`:** The `theme` key only works with gem-based themes bundled with GitHub Pages. Use `remote_theme` for just-the-docs
- **Keeping `show_downloads: true`:** Leftover from minimal theme, not relevant to just-the-docs
- **Absolute links between docs pages:** Use relative links (`./setup`) for portability

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar navigation | Custom HTML nav | just-the-docs `nav_order` front matter | Theme handles ordering, collapsing, highlighting active page |
| Search | Custom search | just-the-docs built-in lunr.js | Client-side, zero config, indexes all pages automatically |
| Footer | Custom includes | `footer_content` in _config.yml | One-liner config, though `_includes/footer_custom.html` available if HTML needed |
| Elastic License 2.0 text | Write from scratch | Copy from official Elastic source | Legal text must be exact |

## Common Pitfalls

### Pitfall 1: remote_theme not loading
**What goes wrong:** Site builds with default Jekyll theme instead of just-the-docs
**Why it happens:** Missing `jekyll-remote-theme` plugin declaration, or wrong `remote_theme` value
**How to avoid:** Must have both `remote_theme: just-the-docs/just-the-docs` AND `plugins: [jekyll-remote-theme]`
**Warning signs:** Site appears unstyled or with wrong layout

### Pitfall 2: Old theme config leaking
**What goes wrong:** `show_downloads`, `google_analytics`, `theme: jekyll-theme-minimal` cause conflicts
**Why it happens:** Existing _config.yml has minimal theme settings
**How to avoid:** Remove ALL minimal-theme-specific keys when migrating
**Warning signs:** Unexpected UI elements, build warnings

### Pitfall 3: Broken internal links
**What goes wrong:** Links between docs pages return 404
**Why it happens:** Jekyll link format differs from GitHub markdown preview
**How to avoid:** Use relative links without `.md` extension: `[Setup](./setup)` not `[Setup](./setup.md)`
**Warning signs:** Links work on GitHub but break on Pages (or vice versa)

### Pitfall 4: Exclude paths relative to source
**What goes wrong:** Excluded files still appear on the site
**Why it happens:** `exclude` paths are relative to Jekyll source root (docs/), not repo root
**How to avoid:** Use `marketplace-listing.md` not `docs/marketplace-listing.md`
**Warning signs:** Excluded pages still accessible via URL

### Pitfall 5: nav_order gaps cause unexpected ordering
**What goes wrong:** Pages appear in wrong sidebar order
**Why it happens:** Pages without `nav_order` fall back to alphabetical by title, mixing with ordered pages
**How to avoid:** Set `nav_order` on EVERY page that should appear in sidebar
**Warning signs:** Sidebar order doesn't match intended sequence

### Pitfall 6: footer_content deprecation
**What goes wrong:** `footer_content` may not render in future just-the-docs versions
**Why it happens:** Deprecated in favor of `_includes/footer_custom.html`
**How to avoid:** For simple copyright text, `footer_content` still works today. Use it for Phase 1 simplicity. If it breaks, migrate to `_includes/footer_custom.html`
**Warning signs:** Footer not appearing after theme update

## Code Examples

### Complete _config.yml (target state)
```yaml
title: GitOps Deployments for Jira
description: Track FluxCD and ArgoCD deployments directly in Jira issues.

remote_theme: just-the-docs/just-the-docs
plugins:
  - jekyll-remote-theme

color_scheme: default

logo: /assets/icon.svg

search_enabled: true
search:
  heading_level: 2
  previews: 3

heading_anchors: true

aux_links:
  "Install from Marketplace":
    - "https://marketplace.atlassian.com/"
aux_links_new_tab: true

footer_content: "&copy; 2026 GitOps Deployments for Jira"

exclude:
  - marketplace-listing.md
  - plans/
```

### Front matter template for each page
```yaml
---
title: Setup
nav_order: 2
description: "Connect FluxCD or ArgoCD to Jira's native Deployments panel."
---
```

### Nav order mapping (from locked decisions)
| Page | nav_order | Title |
|------|-----------|-------|
| index.md | 1 | Home |
| setup.md | 2 | Setup |
| troubleshooting.md | 3 | Troubleshooting |
| privacy-policy.md | 4 | Privacy |
| terms-of-service.md | 5 | Terms |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `theme: jekyll-theme-minimal` | `remote_theme: just-the-docs/just-the-docs` | Migration | Full sidebar nav, search, better layout |
| MIT License | Elastic License 2.0 | Phase 1 decision | Protects against competing forks while allowing contributions |
| No README (dev-focused) | Overview + links README | Phase 1 | GitHub landing page for users |

**Deprecated/outdated:**
- `show_downloads: true` -- minimal theme only, remove
- `google_analytics:` (empty) -- remove, not needed
- `theme: jekyll-theme-minimal` -- remove, replaced by remote_theme

## Existing Files: Current vs Target State

| File | Exists | Action Needed |
|------|--------|--------------|
| `docs/_config.yml` | Yes | Rewrite: swap theme, add nav/search/aux_links/footer/exclude |
| `docs/index.md` | Yes | Rewrite: feature showcase with value proposition, how-it-works, states table |
| `docs/setup.md` | Yes | Add front matter only (nav_order: 2, title: Setup) |
| `docs/privacy-policy.md` | Yes | Add front matter only (nav_order: 4, title: Privacy) |
| `docs/terms-of-service.md` | Yes | Add front matter + update Section 1 license reference (MIT -> ELv2) |
| `docs/troubleshooting.md` | No | Create new: placeholder or basic content for nav_order: 3 |
| `docs/marketplace-listing.md` | Yes | No changes (excluded from site via _config.yml) |
| `README.md` | Yes | Rewrite: overview + links style (~30 lines), badges, no dev setup |
| `CONTRIBUTING.md` | No | Create new: dev setup, contribution guidelines |
| `LICENSE` | Yes | Replace: MIT -> Elastic License 2.0, copyright holder "Temptek" |

## Elastic License 2.0 Notes

The ELv2 text must be copied exactly from the official Elastic source. Key details:
- **Header line:** Replace licensor placeholder with "Temptek"
- **Source:** https://www.elastic.co/licensing/elastic-license
- **Core restrictions:** No hosting as managed service, no circumventing license keys, no removing notices
- **Compatible with contributions:** Others can fork and contribute, but cannot create competing products

The ToS Section 1 currently reads: "The App is provided as-is under the MIT License (or the license specified in the source repository)." This must be updated to reference ELv2 specifically.

## Open Questions

1. **Troubleshooting page content depth**
   - What we know: Sidebar order includes Troubleshooting at position 3 (SITE-03 is Phase 2 scope)
   - What's unclear: How much content to include in Phase 1 vs Phase 2
   - Recommendation: Create a minimal placeholder page in Phase 1 (title + "Coming soon" or basic skeleton). Phase 2 (SITE-03) handles full troubleshooting content.

2. **GitHub Pages source configuration**
   - What we know: STATE.md flags "verify Pages is configured to serve from docs/ on main"
   - What's unclear: Current GitHub Pages settings
   - Recommendation: First task should verify/configure GitHub Pages to serve from docs/ on main branch

3. **footer_content deprecation timeline**
   - What we know: just-the-docs docs note it's deprecated in favor of `_includes/footer_custom.html`
   - What's unclear: When it will be removed
   - Recommendation: Use `footer_content` for simplicity now; it still works. Migrate later if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (static site, no unit tests applicable) |
| Config file | N/A |
| Quick run command | `open https://boxcee.github.io/forge-flux-deployments/` |
| Full suite command | Manual: check all pages load, sidebar nav works, search returns results, no 404s |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | just-the-docs theme with sidebar nav and search | manual | Visit site, verify sidebar has 5 items, search box works | N/A |
| SITE-02 | All pages render with working links | manual | Click every sidebar link, verify no 404s | N/A |
| REPO-01 | Root README.md exists linking to docs site | manual | Visit GitHub repo root, verify README renders with docs link | N/A |
| REPO-02 | LICENSE file with ELv2 | manual | `head -5 LICENSE` should show Elastic License 2.0 header | N/A |

### Sampling Rate
- **Per task commit:** Push to main, wait for GitHub Pages build (~1-2 min), visually verify
- **Per wave merge:** Full manual walkthrough of all pages and links
- **Phase gate:** All 5 sidebar pages load, search works, README links to live site, LICENSE is ELv2

### Wave 0 Gaps
None -- this phase produces static content files. No test infrastructure needed. Validation is visual/manual after GitHub Pages deployment.

## Sources

### Primary (HIGH confidence)
- just-the-docs official docs (https://just-the-docs.com/docs/configuration/) -- _config.yml options, footer, search, logo
- just-the-docs navigation docs (https://just-the-docs.com/docs/navigation/main/order/) -- nav_order front matter
- just-the-docs search docs (https://just-the-docs.com/docs/search/) -- search_enabled, search options, search_exclude
- Elastic License 2.0 (https://www.elastic.co/licensing/elastic-license) -- license text and terms

### Secondary (MEDIUM confidence)
- Jekyll exclude documentation -- standard Jekyll feature, well-documented

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- just-the-docs is well-established, official docs verified
- Architecture: HIGH -- simple theme swap on existing Jekyll site, all config options verified
- Pitfalls: HIGH -- common migration issues well-documented in theme docs
- License: MEDIUM -- ELv2 text needs exact copy from official source during implementation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain, 30 days)
