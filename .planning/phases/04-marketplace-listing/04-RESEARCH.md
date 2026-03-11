# Phase 4: Marketplace Listing - Research

**Researched:** 2026-03-11
**Domain:** Atlassian Marketplace listing preparation (content, URLs, app icon)
**Confidence:** HIGH

## Summary

Phase 4 is a content-finalization phase with no code changes. The `docs/marketplace-listing.md` file already contains complete listing copy (summary, description, highlights, categories, keywords, API scope justifications, privacy & security disclosures). The URLs for privacy policy and terms of service already point to live GitHub Pages URLs that resolve correctly. The primary work is: (1) verifying all content accuracy against source code, (2) cross-checking URLs resolve, and (3) ensuring the app icon meets Atlassian Marketplace specifications.

Three icon files exist in the repo: `docs/assets/icon.png` (144x144 RGBA PNG, blue rounded-rect with deployment arrow -- used by docs site), and two new files at repo root: `logo-144.png` and `logo-144-transparent.png` (both 144x144, dark background with orange/teal GitOps arrows). The Marketplace requires 144x144 PNG/JPG with transparent or chiclet-style background. The `docs/assets/icon.png` meets spec. The `logo-144-transparent.png` has a dark background despite its name (RGB not RGBA) which may not meet the "transparent background" preference. A decision is needed on which icon to submit.

**Primary recommendation:** Audit marketplace-listing.md against source code for accuracy, verify all URLs resolve, and select/validate the app icon for Marketplace submission.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MRKT-01 | TODO placeholder URLs in marketplace-listing.md replaced with live links | URLs already populated; research confirms privacy-policy and terms-of-service URLs resolve on GitHub Pages. Need to verify all links in the file. |
| MRKT-02 | Listing description, summary, and highlights cross-checked for accuracy | Research documents source code behavior (FluxCD + ArgoCD handlers, auth methods, deployment states, annotations) for cross-referencing against listing copy. |
| MRKT-03 | App icon meets Atlassian Marketplace size and format specifications | Research documents Marketplace icon specs (144x144 PNG/JPG, transparent/chiclet background) and audits existing icon files. |
</phase_requirements>

## Standard Stack

Not applicable -- this phase involves no library installation or code changes. It is purely content and asset validation.

## Architecture Patterns

### File Layout (existing)

```
docs/
  marketplace-listing.md     # Complete listing draft (excluded from Jekyll build)
  assets/
    icon.svg                 # SVG icon (docs site logo)
    icon.png                 # 144x144 PNG (docs site, potential Marketplace icon)
logo-144.png                 # 144x144 PNG at repo root (dark bg, orange/teal)
logo-144-transparent.png     # 144x144 PNG at repo root (dark bg despite name)
```

### Pattern: Cross-Check Listing Against Source Code

For MRKT-02, the listing claims must be verified against actual code behavior:

| Listing Claim | Source File | What to Check |
|---|---|---|
| "FluxCD -- HelmRelease events via generic-hmac webhooks" | `src/index.js`, `src/hmac.js` | FluxCD handler uses HMAC verification |
| "ArgoCD -- Application sync events via ArgoCD Notifications webhooks" | `src/index.js`, `src/bearer.js` | ArgoCD handler uses bearer token auth |
| "Deployment status (successful, failed, in progress, rolled back)" | `src/mapper.js`, `src/argocd-mapper.js` | Flux: successful/failed/rolled_back/unknown. Argo: successful/failed/in_progress/unknown |
| "Environment tracking" | Both mappers | `env` annotation mapped to environment.displayName |
| "Revision tracking (Helm chart versions for Flux, Git SHAs for Argo)" | `src/mapper.js` line 40, `src/argocd-mapper.js` line 17 | Flux: `chartVersion`, Argo: `revision` (Git SHA, truncated to 7 chars) |
| "No agents, no database, no external infrastructure" | `manifest.yml` | No remote hostnames, Forge runtime only |
| "HMAC-signed webhooks for Flux, bearer token auth for Argo" | `src/hmac.js`, `src/bearer.js` | Correct per source |

**Accuracy issue found:** The listing says "in progress" as a deployment status. FluxCD mapper does NOT map any reason to `in_progress`. Only the ArgoCD mapper maps `Running` to `in_progress`. The listing should clarify this or the parenthetical should reflect actual states per tool.

### Pattern: URL Verification Checklist

All URLs in marketplace-listing.md and their current status:

| URL | Purpose | Status |
|---|---|---|
| `https://github.com/boxcee/forge-flux-deployments/issues` | Support URL | Needs verification |
| `https://boxcee.github.io/forge-flux-deployments/privacy-policy` | Privacy Policy | LIVE (verified) |
| `https://boxcee.github.io/forge-flux-deployments/terms-of-service` | Terms of Service | LIVE (verified) |

Additionally, `docs/_config.yml` and `README.md` contain `https://marketplace.atlassian.com/` as a placeholder for the "Install from Marketplace" link. This cannot be updated until the app is actually listed on Marketplace -- it is acceptable as-is for submission.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon resizing | Manual pixel editing | `sips` (macOS) or ImageMagick | Preserves quality, scriptable verification |
| URL validation | Manual browser clicks | `curl -s -o /dev/null -w "%{http_code}"` | Automated, reproducible |
| Content diff | Eye-balling listing vs code | Structured table comparison | Systematic, nothing missed |

## Common Pitfalls

### Pitfall 1: Icon Has Dark Background Instead of Transparent
**What goes wrong:** Marketplace rejects icon or it looks bad on white listing page backgrounds.
**Why it happens:** The `logo-144-transparent.png` is misleadingly named -- it has a dark navy background (RGB, not RGBA). Submitting it as-is may look poor.
**How to avoid:** Use `docs/assets/icon.png` which has RGBA with rounded-rect blue background (chiclet-style, which Atlassian explicitly allows) or create a proper transparent version.
**Warning signs:** `file` command shows "RGB" instead of "RGBA" for the transparency file.

### Pitfall 2: Listing Claims Don't Match Code
**What goes wrong:** Marketplace review team tests app behavior against description. Mismatches cause rejection.
**Why it happens:** Listing was written before ArgoCD support was added or states were finalized.
**How to avoid:** Systematic cross-check of every claim against source code (see table above).
**Warning signs:** The "in progress" state claim is not fully accurate for FluxCD.

### Pitfall 3: Summary Exceeds Character Limit
**What goes wrong:** Marketplace truncates or rejects the summary field.
**Why it happens:** The 170-char limit is strict. Current summary is exactly at the boundary.
**How to avoid:** Count characters precisely. Current summary: 170 chars (verified). Any edits must maintain this constraint.

### Pitfall 4: Atlassian Trademarks in Icon
**What goes wrong:** Marketplace rejects icon containing Atlassian product logos/imagery.
**Why it happens:** Brand guidelines prohibit incorporating Atlassian brand elements.
**How to avoid:** The existing `docs/assets/icon.png` uses a custom deployment arrow design -- no Atlassian or FluxCD/ArgoCD logos. Safe to submit.

## Code Examples

Not applicable -- this phase has no code changes. All work is content editing and asset validation.

## State of the Art

### Atlassian Marketplace Icon Specifications (as of 2026)

| Property | Requirement | Source |
|---|---|---|
| Dimensions | 144 x 144 px | [Atlassian: Building your presence](https://developer.atlassian.com/platform/marketplace/building-your-presence-on-marketplace/) |
| Format | PNG or JPG | Same source |
| Background | Transparent or chiclet-style (rounded corners) | Same source |
| Content restrictions | No Atlassian logos, no other company logos without consent | [Brand guidelines](https://developer.atlassian.com/platform/marketplace/atlassian-brand-guidelines-for-marketplace-partners/) |

### Existing Icon Assessment

| File | Dimensions | Format | Background | Marketplace-Ready? |
|---|---|---|---|---|
| `docs/assets/icon.png` | 144x144 | PNG RGBA | Blue chiclet (rounded rect) | YES -- meets all specs |
| `logo-144.png` | 144x144 | PNG RGB | Dark navy (not transparent) | MAYBE -- chiclet-style but dark bg may look odd on white |
| `logo-144-transparent.png` | 144x144 | PNG RGB | Dark navy (NOT actually transparent) | NO -- misleading name, not transparent |

**Recommendation:** Use `docs/assets/icon.png` for Marketplace submission. It is 144x144 RGBA PNG with a blue chiclet background matching Atlassian's preferred style.

## Open Questions

1. **Which icon to submit to Marketplace?**
   - What we know: Three 144x144 PNGs exist. `docs/assets/icon.png` meets spec. The `logo-144*.png` files have dark backgrounds.
   - What's unclear: Whether the user prefers the docs icon (blue, simple arrow) or the logo files (more detailed, orange/teal GitOps theme).
   - Recommendation: Use `docs/assets/icon.png` unless user explicitly prefers the logo files. If logo files preferred, create a proper transparent-background version.

2. **"Install from Marketplace" link in _config.yml and README**
   - What we know: Currently points to `https://marketplace.atlassian.com/` (generic).
   - What's unclear: Whether this should be updated as part of this phase or deferred until actual listing approval.
   - Recommendation: Leave as-is. The app-specific URL won't exist until after Marketplace approval. Can be updated post-listing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (content/asset phase, no code) |
| Config file | N/A |
| Quick run command | `curl -s -o /dev/null -w "%{http_code}" https://boxcee.github.io/forge-flux-deployments/privacy-policy` |
| Full suite command | Manual checklist verification |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MRKT-01 | All URLs in marketplace-listing.md resolve | smoke | `curl -s -o /dev/null -w "%{http_code}" <URL>` for each URL | N/A (manual) |
| MRKT-02 | Listing copy matches source code behavior | manual-only | Cross-check table above against source files | N/A |
| MRKT-03 | Icon is 144x144 PNG with appropriate background | smoke | `sips -g pixelWidth -g pixelHeight <file>` and `file <file>` | N/A (manual) |

### Sampling Rate
- **Per task commit:** Verify changed content against cross-check table
- **Per wave merge:** Full URL resolution check + icon spec check
- **Phase gate:** All URLs resolve (HTTP 200), listing matches source, icon meets 144x144 PNG spec

### Wave 0 Gaps
None -- no test infrastructure needed for a content/asset validation phase.

## Sources

### Primary (HIGH confidence)
- [Atlassian: Building your presence on Marketplace](https://developer.atlassian.com/platform/marketplace/building-your-presence-on-marketplace/) - Icon specs (144x144, PNG/JPG, transparent/chiclet bg)
- [Atlassian: Brand guidelines for Marketplace Partners](https://developer.atlassian.com/platform/marketplace/atlassian-brand-guidelines-for-marketplace-partners/) - Logo content restrictions
- [Atlassian: Creating a Marketplace listing](https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/) - Required listing fields
- Source code direct inspection: `src/index.js`, `src/mapper.js`, `src/argocd-mapper.js`, `manifest.yml`
- Live GitHub Pages verification: privacy-policy and terms-of-service pages confirmed serving

### Secondary (MEDIUM confidence)
- [Atlassian Community: Forge App Icon for Marketplace](https://community.developer.atlassian.com/t/forge-app-icon-for-marketplace-release/62922) - Community discussion on icon requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no libraries needed, content-only phase
- Architecture: HIGH - all files inspected, source code read, URLs verified live
- Pitfalls: HIGH - icon specs verified against official Atlassian docs, content accuracy cross-checked against source

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (Marketplace specs are stable)
