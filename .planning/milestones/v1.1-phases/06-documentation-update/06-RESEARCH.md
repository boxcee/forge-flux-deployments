# Phase 6: Documentation Update - Research

**Researched:** 2026-03-12
**Domain:** Documentation content updates (Markdown, Jekyll/just-the-docs)
**Confidence:** HIGH

## Summary

Phase 6 updates three existing documentation files to reflect the admin UI configuration flow introduced in Phase 5. The current docs reference `forge variables set` as the primary secret configuration method. This must be replaced with the admin page flow (Jira Settings > Apps > GitOps Deployments). The troubleshooting page needs new entries for 503 "secret not configured" errors and re-consent prompts after upgrade. The marketplace listing description must reflect that customers self-configure their secrets through the Atlassian UI.

This is a pure content-editing phase. No code changes. No new files. Three existing Markdown files need targeted updates. The docs site uses Jekyll with the just-the-docs remote theme, hosted on GitHub Pages.

**Primary recommendation:** Edit `docs/setup.md`, `docs/troubleshooting.md`, and `docs/marketplace-listing.md` in place. Each file has clearly identified sections that reference the old `forge variables set` flow. Replace with admin UI instructions and add new troubleshooting entries.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCS-01 | Setup guide documents admin UI configuration flow (replaces forge variables set) | setup.md sections 2A and 3A currently use `forge variables set`; must replace with admin page instructions. Webtrigger URLs are now displayed on admin page (CONF-04). |
| DOCS-02 | Troubleshooting page covers configuration-related failure modes | New 503 status code from index.js when secrets not configured; re-consent prompt after `storage:app` scope addition; admin page location under Jira Settings > Apps |
| DOCS-03 | Marketplace listing reflects self-service configuration capability | marketplace-listing.md "How it works" step 2 says "Configure FluxCD or ArgoCD to send webhooks" but omits the admin UI step; description and Privacy & Security section reference env vars |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Jekyll + just-the-docs | remote theme | Documentation site generator | Already in use, `_config.yml` configured |
| Markdown | n/a | Content format | All docs are `.md` files with YAML front matter |

No libraries to install. No build tools. Pure content editing.

## Architecture Patterns

### Documentation Site Structure
```
docs/
  _config.yml           # Jekyll config, just-the-docs theme
  index.md              # Landing page (nav_order: 1)
  setup.md              # Setup guide (nav_order: 2) -- EDIT
  troubleshooting.md    # Troubleshooting (nav_order: 3) -- EDIT
  marketplace-listing.md # Marketplace copy (excluded from site) -- EDIT
  privacy-policy.md     # Legal page
  terms-of-service.md   # Legal page
```

### Pattern: Setup Guide Update (DOCS-01)

**Current flow in setup.md:**
- Section 2A (FluxCD): `forge variables set WEBHOOK_SECRET '<your-secret-token>'`
- Section 3A (ArgoCD): `forge variables set ARGOCD_WEBHOOK_TOKEN '<your-token>'`
- Section 2C (Provider): Says "Replace `<webtrigger-url>` with the URL provided by your Jira app configuration" -- vague
- Verify sections reference `forge logs` and `WEBHOOK_SECRET` / `ARGOCD_WEBHOOK_TOKEN`

**New flow must describe:**
1. Navigate to Jira Settings > Apps > GitOps Deployments (admin page location from CLAUDE.md)
2. Copy the webhook URL displayed on the admin page (resolver `getWebtriggerUrls` provides this)
3. Enter the HMAC secret / bearer token in the form fields (min 8 characters)
4. Save -- success/error feedback is shown inline
5. Use the same secret value when creating the Kubernetes secret (FluxCD) or configuring the webhook header (ArgoCD)

**Key detail:** The admin page shows both FluxCD and ArgoCD webhook URLs in an info banner. The webtrigger URL section in Provider config (2C) and ArgoCD webhook service config (3B) should reference "copy from the admin page" instead of the vague placeholder text.

**Env var fallback note:** The code still supports `process.env.WEBHOOK_SECRET` / `process.env.ARGOCD_WEBHOOK_TOKEN` as fallback (storage.js lines 11-12, 17-18). The setup guide should NOT mention this as a primary method but MAY include a brief note for developers/operators who prefer CLI-based configuration.

### Pattern: Troubleshooting Update (DOCS-02)

**New entries needed:**

1. **503 "Webhook secret not configured"** -- New error code. Both handlers return 503 with body `Webhook secret not configured. Configure via app admin page.` when no secret is found in KVS or env vars (index.js lines 31-33, 84-86).

2. **Re-consent prompt after upgrade** -- When upgrading from v1.0 to v1.1, the `storage:app` scope addition triggers a Forge major version bump. Admins see a re-consent prompt. Until approved, KVS calls may fail and the admin page will not function. The env var fallback keeps existing webhooks working during this gap.

3. **Admin page not found / not loading** -- Common issues:
   - Admin page is under Jira Settings > Apps (left sidebar), NOT in the app overview/manage apps page
   - URL pattern: `/jira/settings/apps/{appId}/{envId}`
   - If using `forge tunnel`, must deploy first before tunneling (tunnel can only override registered functions)
   - After stopping tunnel, admin page iframe may still route to localhost until a clean deploy

4. **Update existing 401 entries** -- Current troubleshooting references `forge variables list --environment production` and `forge variables set`. These should be updated to reference the admin page as primary, with `forge variables` as fallback/developer method.

### Pattern: Marketplace Listing Update (DOCS-03)

**Current "How it works" section:**
```
1. Install the app on your Jira Cloud site
2. Configure FluxCD or ArgoCD to send webhooks to the app's endpoint
3. Annotate your HelmReleases (Flux) or Applications (Argo) with Jira issue keys
4. Deployments appear automatically in Jira's Deployments panel
```

**Should become:**
```
1. Install the app on your Jira Cloud site
2. Open the app settings page and configure your webhook secret/token
3. Copy the webhook URL from the settings page into your CD tool config
4. Annotate your HelmReleases (Flux) or Applications (Argo) with Jira issue keys
5. Deployments appear automatically in Jira's Deployments panel
```

**Privacy & Security section update:** The answer to "Does your app access PATs, passwords, or shared secrets?" currently says "The HMAC webhook secret is stored as a Forge environment variable, not a user credential." This must be updated to reference Forge KVS secret store.

**Data Storage section update:** The answer "The App is stateless with no database or persistent storage" is now inaccurate -- the app stores secrets in Forge KVS (per-installation). The "Does your app store user data outside Atlassian?" answer remains "No" (KVS is within Atlassian), but the rationale needs updating.

### Anti-Patterns to Avoid
- **Removing all `forge variables` references entirely** -- The env var fallback still exists in code. Keep a brief mention for developers, but don't present it as the primary method.
- **Documenting the admin page UI in excessive detail** -- The UI is two text fields and two buttons. Don't write a multi-page walkthrough.
- **Forgetting to update the quick reference table** -- The troubleshooting page has a "Common mistakes quick reference" table at the bottom that references `forge variables set`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| n/a | n/a | n/a | This is a content-only phase; no code to build |

## Common Pitfalls

### Pitfall 1: Inconsistent references to old flow
**What goes wrong:** Some sections get updated but others still say `forge variables set`, creating contradictory instructions.
**Why it happens:** The old flow is referenced in multiple places across three files.
**How to avoid:** Systematic search for `forge variables`, `WEBHOOK_SECRET`, `ARGOCD_WEBHOOK_TOKEN`, and `environment variable` across all three files before marking complete.
**Warning signs:** Grep for `forge variables` in `docs/` returns hits after the edit.

### Pitfall 2: Marketplace listing Privacy & Security inconsistency
**What goes wrong:** The marketplace listing says "stateless with no database or persistent storage" but the app now uses KVS.
**Why it happens:** Privacy & Security section is long and easy to overlook.
**How to avoid:** Update all references in the Data Storage, Security & Authentication, and Data Retention sections.
**Warning signs:** Any mention of "stateless" or "no persistent storage" in marketplace-listing.md.

### Pitfall 3: Missing 503 in status code documentation
**What goes wrong:** Setup guide verification sections list 200, 204, 400, 401, 502 but not the new 503.
**Why it happens:** 503 was added in Phase 5, not present in the original setup guide.
**How to avoid:** Add 503 to the verification response code lists in both FluxCD (section 2F) and ArgoCD (section 3F).

### Pitfall 4: Admin page location confusion
**What goes wrong:** User can't find the admin page because they look in the wrong place.
**Why it happens:** Jira admin pages are under Settings > Apps (left sidebar), not in the app overview or manage apps page.
**How to avoid:** Be explicit about the navigation path: Jira Settings (gear icon) > Apps > GitOps Deployments.

## Code Examples

Not applicable -- this phase edits Markdown content only.

### Key reference: Current error messages in code

```javascript
// src/index.js line 32 (FluxCD)
return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };

// src/index.js line 85 (ArgoCD)
return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
```

### Key reference: Admin page navigation path

From CLAUDE.md and manifest.yml:
- Module: `jira:adminPage` with key `admin-config-page`
- Title displayed: "GitOps Deployments"
- Location: Jira Settings > Apps (left sidebar)
- URL pattern: `/jira/settings/apps/{appId}/{envId}`

### Key reference: Storage fallback chain

```javascript
// src/storage.js -- KVS first, env var fallback
export async function getFluxSecret() {
  const value = await kvs.getSecret(KEYS.fluxHmacSecret);
  if (value !== undefined) return value;
  return process.env.WEBHOOK_SECRET;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `forge variables set WEBHOOK_SECRET` | Admin page UI + KVS storage | Phase 5 (v1.1) | Setup guide must lead with admin UI flow |
| Secrets in env vars only | KVS secret store (env var fallback) | Phase 5 (v1.1) | Privacy & Security disclosures need updating |
| No 503 response | 503 when secret not configured | Phase 5 (v1.1) | Troubleshooting page needs new entry |
| No admin page | `jira:adminPage` module | Phase 5 (v1.1) | Marketplace listing gains self-service angle |

## Open Questions

None. All three target files are well-understood, the Phase 5 implementation is complete, and the required changes are clearly scoped.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 (native ESM via `--experimental-vm-modules`) |
| Config file | `package.json` jest config |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | Setup guide describes admin UI flow | manual-only | Visual review of `docs/setup.md` | n/a |
| DOCS-02 | Troubleshooting covers config failures | manual-only | Visual review of `docs/troubleshooting.md` | n/a |
| DOCS-03 | Marketplace listing reflects self-service | manual-only | Visual review of `docs/marketplace-listing.md` | n/a |

**Manual-only justification:** All requirements are documentation content changes. No programmatic behavior to test. Validation is done by reviewing the rendered Markdown for accuracy against the implemented code.

### Sampling Rate
- **Per task commit:** Grep for `forge variables set` in `docs/` -- should return zero hits as primary method
- **Per wave merge:** Visual review of all three files
- **Phase gate:** All three files reviewed for consistency

### Wave 0 Gaps
None -- no test infrastructure needed for documentation-only changes.

## Sources

### Primary (HIGH confidence)
- Project source code: `src/index.js`, `src/storage.js`, `src/resolver.js`, `src/frontend/index.jsx` -- actual implementation that docs must match
- Project manifest: `manifest.yml` -- admin page module definition, scope list
- Existing docs: `docs/setup.md`, `docs/troubleshooting.md`, `docs/marketplace-listing.md` -- current content to update
- CLAUDE.md -- admin page location, tunnel/deploy gotchas

### Secondary (MEDIUM confidence)
- Phase 5 research and STATE.md -- design decisions about KVS, env var fallback, re-consent behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no libraries involved, pure content editing
- Architecture: HIGH -- all target files and their structure are fully visible
- Pitfalls: HIGH -- derived from direct comparison of current docs vs implemented code

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- docs site structure unlikely to change)
