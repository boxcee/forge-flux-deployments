# Stack Research

**Domain:** GitHub Pages documentation site for Atlassian Forge app Marketplace listing
**Researched:** 2026-03-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Jekyll | 3.10+ (GitHub Pages built-in) | Static site generator | GitHub Pages runs Jekyll natively. No build pipeline needed. Zero config deployment from `docs/` folder. |
| just-the-docs | v0.12.0 | Documentation theme | Purpose-built for documentation: built-in search, sidebar navigation, breadcrumbs, TOC, responsive design. The current `jekyll-theme-minimal` has no navigation, no search, no sidebar -- unacceptable for a multi-page docs site. |
| GitHub Pages | N/A | Hosting | Free, tied to the repo, custom domain support. Required by project constraints. |
| GitHub Actions | N/A | CI for markdown linting | Catch broken links and lint issues before merge. Lightweight, no external dependencies. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jekyll-remote-theme | (GitHub Pages built-in) | Load just-the-docs without Gemfile | Always -- this is how GitHub Pages loads non-default themes via `remote_theme` in `_config.yml` |
| markdownlint-cli2 | latest | Markdown linting | CI pipeline and local development. Catches inconsistent formatting before it ships. |
| markdownlint-cli2-action | v17+ | GitHub Actions wrapper | CI only. DavidAnson/markdownlint-cli2-action is the canonical GitHub Action for markdown linting. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| markdownlint VS Code extension | Local markdown linting | `davidanson.vscode-markdownlint`. Same rules as CI, instant feedback. |
| Jekyll local preview | Test rendering locally | `bundle exec jekyll serve` from `docs/`. Optional -- GitHub Pages preview via PR deploy is often sufficient. |

## Theme Migration: minimal to just-the-docs

The current setup uses `jekyll-theme-minimal` (`pages-themes/minimal@v0.2.0`). This theme is a single-column layout with no navigation, no search, and no sidebar. It works for a single-page README-style site but fails for multi-page documentation.

### Current `_config.yml`

```yaml
theme: jekyll-theme-minimal
remote_theme: pages-themes/minimal@v0.2.0
plugins:
- jekyll-remote-theme
```

### Recommended `_config.yml`

```yaml
title: GitOps Deployments for Jira
description: Track FluxCD and ArgoCD deployments directly in Jira issues.
remote_theme: just-the-docs/just-the-docs@v0.12.0
logo: /assets/icon.png
plugins:
  - jekyll-remote-theme

# Navigation
nav_enabled: true

# Search
search_enabled: true
search.button: true

# Auxiliary links (top right)
aux_links:
  "View on GitHub": https://github.com/boxcee/forge-flux-deployments

# Footer
footer_content: "&copy; 2026 GitOps Deployments for Jira"

# Exclude non-doc files from build
exclude:
  - plans/
  - marketplace-listing.md
```

### Page Front Matter

Each markdown page needs front matter for navigation ordering:

```yaml
---
title: Getting Started
nav_order: 2
---
```

Navigation order recommendation:
1. Home (`index.md`, nav_order: 1)
2. Setup Guide (`setup.md`, nav_order: 2)
3. Privacy Policy (`privacy-policy.md`, nav_order: 3)
4. Terms of Service (`terms-of-service.md`, nav_order: 4)

### What just-the-docs Gives You for Free

- **Sidebar navigation** -- auto-generated from page front matter, no manual menu config
- **Built-in search** -- client-side lunr.js search across all pages, zero config
- **Table of contents** -- per-page TOC from headings, auto-generated
- **Breadcrumbs** -- navigation context for nested pages
- **Responsive layout** -- works on mobile without custom CSS
- **Code syntax highlighting** -- Rouge-based, works out of the box

## Markdown Linting Setup

### `.markdownlint.json`

```json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false
}
```

Rationale:
- **MD013** (line length): Disabled because documentation prose wraps naturally. Enforcing 80-char lines in docs is counterproductive.
- **MD033** (inline HTML): Disabled because Jekyll/just-the-docs sometimes needs HTML for callouts or custom elements.
- **MD041** (first line heading): Disabled because Jekyll front matter (`---`) precedes the first heading.

### GitHub Actions Workflow

```yaml
name: Lint Docs
on:
  pull_request:
    paths:
      - 'docs/**/*.md'
      - '*.md'
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DavidAnson/markdownlint-cli2-action@v17
        with:
          globs: |
            docs/**/*.md
            *.md
```

## Atlassian Marketplace Documentation Requirements

The Marketplace review checks for:

| Requirement | Status | How We Meet It |
|-------------|--------|----------------|
| Setup/usage documentation | Required | `setup.md` on GitHub Pages |
| Privacy Policy | Required (cloud apps) | `privacy-policy.md` on GitHub Pages |
| End User Terms / EULA | Required (cloud apps) | `terms-of-service.md` on GitHub Pages |
| Support channel | Required | GitHub Issues link on index page |
| Security statement | Recommended | Privacy & Security tab in Marketplace listing |

The documentation URLs in the Marketplace listing must point to publicly accessible pages. GitHub Pages URLs (e.g., `https://boxcee.github.io/forge-flux-deployments/privacy-policy`) satisfy this requirement.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| just-the-docs | jekyll-theme-minimal (current) | Never for multi-page docs. Only suitable for single-page README-style sites. |
| just-the-docs | Docusaurus | When you need versioned docs, i18n, or React components. Overkill here -- requires Node build pipeline and GitHub Actions custom deploy. |
| just-the-docs | MkDocs (Material) | When your team prefers Python tooling. Requires GitHub Actions for build. Not native to GitHub Pages. |
| just-the-docs | minimal-mistakes | When building a blog or portfolio. Too much chrome for pure documentation. |
| GitHub Pages | Netlify/Vercel | When you need server-side features, redirects, or forms. Unnecessary complexity for static docs. |
| markdownlint-cli2 | vale | When you need prose style linting (e.g., "avoid passive voice"). Overkill for structural markdown linting. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `jekyll-theme-minimal` | No navigation, no search, no sidebar. Users cannot navigate between pages without manually editing URLs or relying on the index page links. Unprofessional for a Marketplace listing. | `just-the-docs` |
| Docusaurus / Hugo / MkDocs | Require custom build pipelines via GitHub Actions. Adds CI complexity for a 5-page docs site. | Jekyll with just-the-docs (native GitHub Pages support) |
| `show_downloads: true` (current config) | Shows a "Download" button linking to GitHub releases. This app is a Forge app installed via Marketplace, not downloaded from GitHub. Confusing UX. | Remove from `_config.yml` |
| `google_analytics:` (empty, current config) | Dead config line. Either add a tracking ID or remove it. Empty values are noise. | Remove unless you add a GA4 measurement ID |
| Custom Jekyll plugins | GitHub Pages only supports a whitelist of plugins. Custom plugins require Actions-based build. Not worth it for this scope. | Stick to built-in just-the-docs features |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| just-the-docs@v0.12.0 | GitHub Pages (Jekyll 3.10+) | Works via `remote_theme`. Released Jan 2025. Fixes footer placement issues from v0.11.0. |
| jekyll-remote-theme | GitHub Pages built-in | No Gemfile needed for branch-based GitHub Pages deployment. |
| markdownlint-cli2-action@v17 | Node 20+ runners | Uses `ubuntu-latest` which includes Node 20+. |

## Sources

- [Just the Docs official site](https://just-the-docs.com/) -- features, configuration (HIGH confidence)
- [Just the Docs GitHub releases](https://github.com/just-the-docs/just-the-docs/releases) -- v0.12.0 verified Jan 2025 (HIGH confidence)
- [Just the Docs template repo](https://github.com/just-the-docs/just-the-docs-template) -- _config.yml reference (HIGH confidence)
- [GitHub Pages supported themes](https://pages.github.com/themes/) -- theme compatibility (HIGH confidence)
- [GitHub Pages Jekyll docs](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) -- remote_theme support (HIGH confidence)
- [Atlassian Marketplace app approval guidelines](https://developer.atlassian.com/platform/marketplace/app-approval-guidelines/) -- documentation requirements (HIGH confidence)
- [Atlassian Marketplace listing guide](https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/) -- listing structure (HIGH confidence)
- [markdownlint-cli2-action](https://github.com/DavidAnson/markdownlint-cli2-action) -- GitHub Actions linting (HIGH confidence)

---
*Stack research for: GitHub Pages documentation for Atlassian Forge app Marketplace listing*
*Researched: 2026-03-11*
