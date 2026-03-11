# Architecture Research

**Domain:** Documentation site for Atlassian Forge app (GitHub Pages + Jekyll)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Jekyll)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐     │
│  │  index.md   │  │  setup.md  │  │ privacy-policy.md  │     │
│  │  (landing)  │  │  (guide)   │  │ terms-of-service   │     │
│  └─────┬──────┘  └─────┬──────┘  └────────┬───────────┘     │
│        │               │                   │                 │
├────────┴───────────────┴───────────────────┴─────────────────┤
│                 Jekyll Theme + Layout Layer                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  _layouts/default.html  (nav sidebar + footer)        │    │
│  └──────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Static Assets                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ icon.png │  │ icon.svg │  │ style.css│                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│ Atlassian        │          │ GitHub repo          │
│ Marketplace      │          │ (README links here)  │
│ (links to legal) │          │                      │
└─────────────────┘          └─────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current State |
|-----------|----------------|---------------|
| `docs/index.md` | Landing page, navigation hub, value proposition | Exists but sparse -- links to setup and legal only |
| `docs/setup.md` | Full setup guide for FluxCD + ArgoCD | Exists, well-structured with ToC |
| `docs/privacy-policy.md` | Privacy policy for Marketplace compliance | Exists, needs URL in marketplace-listing.md |
| `docs/terms-of-service.md` | EULA for Marketplace compliance | Exists, needs URL in marketplace-listing.md |
| `docs/marketplace-listing.md` | Internal reference for Marketplace submission form fields | Exists, has TODO placeholders for URLs |
| `docs/_config.yml` | Jekyll site config (theme, title, logo) | Exists, uses `pages-themes/minimal@v0.2.0` |
| `docs/assets/` | Icons and images | Contains icon.png and icon.svg |
| `_layouts/default.html` | Custom layout override (does not exist yet) | Missing -- needed for navigation |

## Recommended Page Hierarchy

### Current Problem

The `pages-themes/minimal` theme has a left sidebar showing only the site title, description, and download links. There is no built-in navigation menu. Visitors landing on any page other than index.md have no way to navigate to other pages except the `[Back to Home]` link manually added to setup.md.

### Recommended Structure

```
docs/
├── _config.yml              # Jekyll config (theme, title, nav data)
├── _layouts/
│   └── default.html         # Override theme layout to add nav links
├── assets/
│   ├── css/
│   │   └── style.scss       # Custom styles (nav highlighting, footer)
│   ├── icon.png
│   └── icon.svg
├── index.md                 # Landing page (what + why + quick links)
├── setup.md                 # Setup guide (FluxCD + ArgoCD)
├── privacy-policy.md        # Legal: privacy policy
├── terms-of-service.md      # Legal: EULA
└── marketplace-listing.md   # Internal only (not linked from nav)
```

### Structure Rationale

- **Flat hierarchy:** Five public pages total. No subdirectories needed. Subdirectories add complexity with zero benefit at this scale.
- **`_layouts/default.html` override:** The only way to add navigation to the minimal theme. Copy the theme's default layout and inject a nav section in the sidebar.
- **`marketplace-listing.md` stays unlisted:** It is a reference document for filling the Marketplace submission form, not a user-facing page. Exclude from nav.

## Architectural Patterns

### Pattern 1: Theme Layout Override for Navigation

**What:** Copy `pages-themes/minimal`'s `_layouts/default.html` into `docs/_layouts/default.html` and add a `<nav>` block in the sidebar section below the existing header/description.

**When to use:** When you need navigation but want to keep the minimal theme's look.

**Trade-offs:** You own the layout file now. If the upstream theme updates, you will not get those changes automatically. Acceptable tradeoff -- the minimal theme is stable and rarely updated.

**Implementation:**

```html
<!-- Add this block inside the <header> section of default.html, after the description -->
<nav>
  <ul>
    <li><a href="{{ '/' | relative_url }}">Home</a></li>
    <li><a href="{{ '/setup' | relative_url }}">Setup Guide</a></li>
    <li><a href="{{ '/privacy-policy' | relative_url }}">Privacy Policy</a></li>
    <li><a href="{{ '/terms-of-service' | relative_url }}">Terms of Service</a></li>
  </ul>
</nav>
```

Using `relative_url` filter ensures links work regardless of the repository's base path on GitHub Pages.

### Pattern 2: Data-Driven Navigation (Alternative)

**What:** Define navigation structure in `_config.yml` under a custom `navigation` key and loop over it in the layout.

**When to use:** When you expect navigation to change frequently or have many pages.

**Trade-offs:** More flexible but adds indirection. Not worth it for 4 links.

**Recommendation:** Skip this. Hardcode the nav links in the layout override. Four links do not warrant data-driven navigation.

### Pattern 3: Footer with Legal Links

**What:** Add privacy policy and terms of service links in the page footer. This is the standard pattern for SaaS/app documentation sites and directly satisfies Marketplace requirements.

**When to use:** Always, for legal pages.

**Implementation:**

```html
<!-- In _layouts/default.html, replace or extend the footer -->
<footer>
  <p>&copy; 2026 GitOps Deployments for Jira</p>
  <p>
    <a href="{{ '/privacy-policy' | relative_url }}">Privacy Policy</a> |
    <a href="{{ '/terms-of-service' | relative_url }}">Terms of Service</a>
  </p>
</footer>
```

## Navigation Structure

### Sidebar (Left)

The minimal theme places all sidebar content in a `<header>` element on the left. Add navigation links here:

1. **Home** -- links to `index.md`
2. **Setup Guide** -- links to `setup.md`
3. **Privacy Policy** -- links to `privacy-policy.md`
4. **Terms of Service** -- links to `terms-of-service.md`

### Footer

Repeat legal links in the footer. This is standard practice and ensures legal pages are accessible from every page regardless of sidebar visibility on mobile.

### Header

No separate header needed. The minimal theme's sidebar serves as the header on mobile (collapses above content). No changes required.

### Cross-Linking Pattern

| From | To | How |
|------|----|-----|
| `index.md` | `setup.md` | Prominent "Get Started" call-to-action link |
| `index.md` | Legal pages | Listed in a "Legal" section |
| `setup.md` | `index.md` | Via sidebar nav (no manual "Back to Home" needed once nav exists) |
| Legal pages | GitHub issues | "Contact" link in each legal page |
| Marketplace listing | `privacy-policy.md` | Direct GitHub Pages URL |
| Marketplace listing | `terms-of-service.md` | Direct GitHub Pages URL |
| Root `README.md` | GitHub Pages site | Link to the published site |

## Marketplace URL Requirements

Atlassian Marketplace requires direct URLs for:

1. **Privacy Policy URL** -- must point to a publicly accessible page
2. **End User Terms URL** -- must point to a publicly accessible page
3. **Support URL** -- already set to GitHub Issues

The GitHub Pages URLs will follow this pattern:
- `https://boxcee.github.io/forge-flux-deployments/privacy-policy`
- `https://boxcee.github.io/forge-flux-deployments/terms-of-service`

These URLs must be entered in the Marketplace listing form and in `marketplace-listing.md` to replace the TODO placeholders.

## Data Flow

### Build Flow

```
docs/*.md (Markdown)
    |
    v
GitHub Pages CI (Jekyll build)
    |
    v
_layouts/default.html + _config.yml + theme assets
    |
    v
Static HTML site at boxcee.github.io/forge-flux-deployments/
```

### User Navigation Flow

```
Marketplace Listing
    |
    ├──> Privacy Policy (GitHub Pages)
    ├──> Terms of Service (GitHub Pages)
    └──> Support (GitHub Issues)

GitHub README
    |
    └──> Documentation Site (GitHub Pages index)
              |
              ├──> Setup Guide
              ├──> Privacy Policy
              └──> Terms of Service
```

## Build Order (Dependencies)

This is the critical sequencing for the roadmap:

| Step | What | Depends On | Why First |
|------|------|-----------|-----------|
| 1 | Create `_layouts/default.html` with nav | Nothing | All pages need consistent navigation before other changes |
| 2 | Add footer with legal links | Step 1 | Footer is part of the layout |
| 3 | Enhance `index.md` content | Step 1 | Landing page should use the new layout |
| 4 | Update legal page content if needed | Step 1 | Legal pages should render with nav |
| 5 | Fix `marketplace-listing.md` URLs | GitHub Pages deployed | Need actual URLs to fill TODOs |
| 6 | Create root `README.md` | Steps 1-4 | README links to the site, so site should be ready first |
| 7 | Add custom CSS if needed | Step 1 | Styling refinements come last |

**Key dependency:** Steps 1-2 (layout override) unblock everything else. The layout is the foundation.

## Anti-Patterns

### Anti-Pattern 1: Switching Themes

**What people do:** Replace `pages-themes/minimal` with a heavier documentation theme (just-the-docs, minimal-mistakes) to get built-in navigation.

**Why it is wrong:** Overkill for 4-5 pages. Introduces a new theme's conventions, configuration surface, and potential breaking changes. The existing theme works and looks professional.

**Do this instead:** Override the layout file with a nav block. Five minutes of HTML gives you everything a theme switch would, without the migration cost.

### Anti-Pattern 2: Duplicating Navigation in Every Page

**What people do:** Add manual navigation links at the top/bottom of each Markdown file.

**Why it is wrong:** Maintenance burden. Every new page means updating every existing page. Easy to get out of sync.

**Do this instead:** Put navigation in the layout. It appears on every page automatically.

### Anti-Pattern 3: Using `marketplace-listing.md` as a Public Page

**What people do:** Link `marketplace-listing.md` in the site navigation.

**Why it is wrong:** This file is a reference for filling the Marketplace submission form. It contains internal notes (scope justifications, security disclosures) meant for Atlassian reviewers, not end users. Publishing it creates confusion.

**Do this instead:** Keep it in `docs/` for Jekyll to render (useful as a personal reference URL), but exclude it from navigation. Optionally add `published: false` in front matter to prevent Jekyll from building it.

### Anti-Pattern 4: Hardcoding the Base URL

**What people do:** Write absolute URLs like `https://boxcee.github.io/forge-flux-deployments/setup` in Markdown links.

**Why it is wrong:** Breaks if the repo is forked, renamed, or if someone tests locally. Also breaks in PR preview deployments.

**Do this instead:** Use relative links in Markdown (`./setup`) and `relative_url` filter in layouts. Jekyll handles the base path.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Atlassian Marketplace | Privacy Policy URL, EULA URL, Support URL | URLs must be publicly accessible, stable, and HTTPS |
| GitHub Pages | Automatic build from `docs/` folder on main branch | Ensure GitHub Pages source is set to `main` branch, `/docs` folder |
| GitHub Repository | README links to Pages site | Root README.md should link to the documentation site |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Layout <-> Pages | Jekyll front matter + Liquid templates | Pages declare `layout: default` in front matter (or rely on theme default) |
| Config <-> Theme | `_config.yml` variables consumed by theme layout | `title`, `description`, `logo`, `show_downloads` |
| Markdown <-> HTML | Jekyll Markdown renderer (kramdown) | Use relative links, let Jekyll handle URL resolution |

## Sources

- [pages-themes/minimal GitHub repository](https://github.com/pages-themes/minimal) -- theme documentation and layout structure
- [vaibhavvikas/jekyll-theme-minimalistic](https://github.com/vaibhavvikas/jekyll-theme-minimalistic) -- alternative theme with built-in sidebar nav (evaluated, not recommended)
- [GitHub Pages documentation](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) -- GitHub Pages + Jekyll setup
- [Jekyll directory structure](https://jekyllrb.com/docs/structure/) -- standard Jekyll project layout
- [Atlassian data privacy guidelines for developers](https://developer.atlassian.com/platform/marketplace/data-privacy-guidelines/) -- Marketplace privacy/EULA requirements
- [Atlassian Marketplace Partner Agreement](https://www.atlassian.com/licensing/marketplace/partneragreement) -- legal URL requirements

---
*Architecture research for: GitOps Deployments for Jira documentation site*
*Researched: 2026-03-11*
