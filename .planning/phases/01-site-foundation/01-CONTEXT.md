# Phase 1: Site Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate GitHub Pages docs site from jekyll-theme-minimal to just-the-docs theme with sidebar navigation, search, and working links. Create root README.md, LICENSE file, and CONTRIBUTING.md. Fix ToS license reference to align with chosen license. Exclude internal files from the published site.

</domain>

<decisions>
## Implementation Decisions

### Navigation
- Docs-first sidebar order: Home > Setup > Troubleshooting > Privacy > Terms
- Short labels in sidebar: Home, Setup, Troubleshooting, Privacy, Terms
- Built-in lunr.js search enabled
- Aux link (top-right): "Install from Marketplace" with placeholder URL until listing is live
- Footer: copyright only — "(c) 2026 GitOps Deployments for Jira"

### License
- Elastic License 2.0 (ELv2) — source-available, contributions welcome, no competing products
- Copyright holder: "Temptek"
- Terms-of-service must be updated in Phase 1 to reference ELv2 instead of MIT

### Page exclusions
- `marketplace-listing.md` excluded via `_config.yml` exclude list (not rendered on GitHub Pages)
- `docs/plans/` excluded via `_config.yml` exclude list
- Centralized exclusion in _config.yml, not per-file front matter

### Index home page
- Feature showcase style — lead with "deployments in Jira" value proposition, then mention supported CD tools
- Brief how-it-works section: 3-4 step numbered list (Install > Configure > Annotate > See deployments)
- Include supported deployment states table (successful, failed, in_progress, rolled_back)

### README
- Overview + links style (~30 lines): description, key features bullets, quick-start excerpt, links to docs/Marketplace
- Separate CONTRIBUTING.md for development setup and contribution guidelines
- No dev setup in README itself

### Claude's Discretion
- Badge selection for README header (license, Marketplace, Node.js version — pick what's appropriate)
- Color scheme for just-the-docs (default or custom — choose what looks professional)
- Exact page descriptions in front matter

</decisions>

<specifics>
## Specific Ideas

- User wants to commercialize via Atlassian Marketplace — ELv2 protects against competing forks
- Marketplace listing URL will be a placeholder for now; needs updating once listing is created
- Copyright holder is "Temptek" — use consistently across LICENSE, footer, and legal docs

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/_config.yml`: Existing Jekyll config to migrate (replace theme, remove show_downloads and empty google_analytics)
- `docs/index.md`: Existing index page to enhance into feature showcase
- `docs/setup.md`: Existing setup guide — needs nav_order front matter added
- `docs/privacy-policy.md`: Existing — needs nav_order front matter
- `docs/terms-of-service.md`: Existing — needs nav_order front matter AND license reference update (MIT → ELv2)
- `docs/assets/icon.png` and `icon.svg`: Existing app icons for logo config

### Established Patterns
- Jekyll + GitHub Pages: Already configured, just needs theme swap
- Markdown docs with `---` separator sections: Existing pattern in all docs
- GitHub repo: `boxcee/forge-flux-deployments`

### Integration Points
- `_config.yml` is the single control point for theme, navigation, exclusions, and footer
- Front matter (`nav_order`, `title`) on each page controls sidebar placement
- `remote_theme` directive loads just-the-docs without Gemfile

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-site-foundation*
*Context gathered: 2026-03-11*
