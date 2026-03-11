# Phase 2: Content Accuracy - Research

**Researched:** 2026-03-11
**Domain:** Documentation accuracy against source code (FluxCD/ArgoCD webhook handlers)
**Confidence:** HIGH

## Summary

This phase is a documentation audit: comparing every code example, annotation key, and configuration instruction in `docs/setup.md`, `docs/index.md`, and `docs/troubleshooting.md` against the actual source code in `src/`. The source code is the single source of truth.

The existing `docs/setup.md` has significant gaps and inaccuracies for both FluxCD and ArgoCD configurations. The annotation reference table is incomplete (missing 2 of 5 FluxCD annotations, missing `envType` for ArgoCD, missing `finishedAt`/`message` fields). The troubleshooting page is a placeholder with no content. The ArgoCD notification template in the docs produces a payload that is missing fields the code expects.

**Primary recommendation:** Systematically diff every field the code reads against what the docs tell users to configure, fix every mismatch, then write a troubleshooting page covering the three failure modes (HMAC/bearer auth, missing required annotations, ignored reasons).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCY-01 | Setup guide FluxCD instructions match actual source code behavior | Gap analysis in "FluxCD Documentation Gaps" section; complete annotation key mapping in "Source of Truth: Code-Extracted Data" |
| ACCY-02 | Setup guide ArgoCD instructions match actual payload format in code | Gap analysis in "ArgoCD Documentation Gaps" section; correct payload template in "Code Examples" |
| ACCY-03 | Annotation reference table is complete for both FluxCD and ArgoCD | Complete annotation tables in "Source of Truth: Code-Extracted Data" |
| SITE-03 | Troubleshooting page covers HMAC auth failures, missing annotations, ignored reasons | Failure modes documented in "Troubleshooting Content Requirements" section |
</phase_requirements>

## Source of Truth: Code-Extracted Data

All data below extracted directly from source files. Confidence: HIGH.

### FluxCD Annotations (from `src/mapper.js` lines 27-44)

The `extractMetadata` function reads from `event.metadata` using a `get(full, short)` helper that tries the full annotation key first, then the short key.

| Full Annotation Key | Short Key (Flux-stripped) | Field | Required | Default | Notes |
|---------------------|--------------------------|-------|----------|---------|-------|
| `event.toolkit.fluxcd.io/jira` | `jira` | `issueKeys` | Yes (skip 204 if missing) | `null` | Comma-separated Jira issue keys |
| `event.toolkit.fluxcd.io/env` | `env` | `env` | Yes (400 if missing) | `null` | Environment name |
| `event.toolkit.fluxcd.io/env-type` | `env-type` | `envType` | No | `unmapped` | Jira environment type |
| `event.toolkit.fluxcd.io/url` | `url` | `url` | No (but Jira API needs it) | `''` | URL shown in Jira deployment panel |
| `helm.toolkit.fluxcd.io/chart-version` | `revision` | `chartVersion` | No | `null` | Chart version for display/label |

Full keys take precedence over short keys when both are present.

### FluxCD Reason-to-State Mapping (from `src/mapper.js` lines 3-16)

| Reason | Jira State |
|--------|------------|
| `InstallSucceeded` | `successful` |
| `UpgradeSucceeded` | `successful` |
| `TestSucceeded` | `successful` |
| `ReconciliationSucceeded` | `successful` |
| `InstallFailed` | `failed` |
| `UpgradeFailed` | `failed` |
| `TestFailed` | `failed` |
| `ReconciliationFailed` | `failed` |
| `RollbackFailed` | `failed` |
| `UninstallFailed` | `failed` |
| `ArtifactFailed` | `failed` |
| `RollbackSucceeded` | `rolled_back` |
| Any other | `unknown` |

### FluxCD Ignored Reasons (from `src/mapper.js` lines 18-21)

Events with these reasons return 204 silently:
- `UninstallSucceeded`
- `DependencyNotReady`

### FluxCD Handler Flow (from `src/index.js` lines 24-69)

1. Verify HMAC (`X-Signature` header, `sha256=<hex>` format) -> 401 if failed
2. Parse JSON body -> 400 if malformed
3. Extract metadata; skip if no `jira` annotation -> 204
4. Check `env` annotation -> 400 if missing
5. Check if reason is ignored -> 204 if so
6. Build payload and submit to Jira -> 200 on success, 502 on upstream error

### ArgoCD Annotations (from `src/argocd-mapper.js` lines 14-25)

The `extractMetadata` function reads from `payload.annotations` (flat object).

| Annotation Key | Field | Required | Default | Notes |
|----------------|-------|----------|---------|-------|
| `jira` | `issueKeys` | Yes (skip 204 if missing) | `null` | Comma-separated Jira issue keys |
| `env` | `env` | Yes (400 if missing) | `null` | Environment name |
| `envType` | `envType` | No | `unmapped` | Jira environment type (camelCase, not hyphenated) |
| `url` | `url` | No (but Jira API needs it) | `''` | URL shown in Jira deployment panel |

### ArgoCD Top-Level Payload Fields (from `src/argocd-mapper.js`)

| Field | Used For | Required |
|-------|----------|----------|
| `app` | `appName` (pipeline ID, display name) | Falls back to `'unknown'` |
| `namespace` | Environment namespace | Falls back to `'default'` |
| `revision` | Commit SHA, truncated to 7 chars for label | Falls back to `'unknown'` |
| `phase` | Maps to Jira deployment state | Mapped or `'unknown'` |
| `healthStatus` | Passed to `mapPhaseToState` (currently unused) | -- |
| `finishedAt` | `lastUpdated`, `updateSequenceNumber`, deterministic ID | Needed for valid payload |
| `message` | `description` in Jira payload | Falls back to `''` |

### ArgoCD Phase-to-State Mapping (from `src/argocd-mapper.js` lines 3-8)

| Phase | Jira State |
|-------|------------|
| `Succeeded` | `successful` |
| `Failed` | `failed` |
| `Error` | `failed` |
| `Running` | `in_progress` |
| Any other | `unknown` |

### ArgoCD Handler Flow (from `src/index.js` lines 71-110)

1. Verify Bearer token (`Authorization: Bearer <token>`) -> 401 if failed
2. Parse JSON body -> 400 if malformed
3. Extract metadata; skip if no `jira` annotation -> 204
4. Check `env` annotation -> 400 if missing
5. Build payload and submit to Jira -> 200 on success, 502 on upstream error

### Authentication (from `src/hmac.js`, `src/bearer.js`)

- **FluxCD**: HMAC-SHA256. Header: `X-Signature: sha256=<hex>`. Secret stored as Forge env var `WEBHOOK_SECRET`.
- **ArgoCD**: Bearer token. Header: `Authorization: Bearer <token>`. Token stored as Forge env var `ARGOCD_WEBHOOK_TOKEN`.

Both use timing-safe comparison.

## FluxCD Documentation Gaps

Comparing `docs/setup.md` Section 2 + Section 4 against source code.

| Gap | Current State in Docs | Correct State per Code | Severity |
|-----|----------------------|------------------------|----------|
| Missing `env-type` annotation | Not mentioned | `event.toolkit.fluxcd.io/env-type` or `env-type`, defaults to `unmapped` | HIGH -- users get `unmapped` env type in Jira |
| Missing `chart-version` annotation | Not mentioned | `helm.toolkit.fluxcd.io/chart-version` or `revision`, used for display name and label | MEDIUM -- cosmetic but confusing |
| `env` annotation not marked required | Listed without required flag | Returns 400 if missing | HIGH -- users hit silent failures |
| `jira` annotation not marked required | Listed without required flag | Returns 204 (silently skipped) if missing | HIGH -- users wonder why no deployments appear |
| `url` annotation importance unclear | Listed but not flagged | Jira Deployments API requires it for the panel link | MEDIUM |
| No mention of full annotation keys | Only short keys shown | Code supports both `event.toolkit.fluxcd.io/*` and short keys | LOW -- short keys work, but docs should explain |
| No mention of ignored reasons | Not mentioned | `UninstallSucceeded` and `DependencyNotReady` silently return 204 | HIGH -- users confused by missing deployments |
| No mention of `WEBHOOK_SECRET` env var | Not mentioned in setup | Must be set via `forge variables set` | HIGH -- auth will fail without it |
| Alert eventSources hardcoded to HelmRelease | Shown correctly | Matches code (only HelmRelease supported) | OK |
| Provider type `generic-hmac` | Shown correctly | Matches code | OK |

### FluxCD HelmRelease Annotation Example Missing

The docs show how to create the Provider and Alert but never show how to annotate the HelmRelease itself. Users need a concrete example:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: production
  annotations:
    event.toolkit.fluxcd.io/jira: "PROJ-123"
    event.toolkit.fluxcd.io/env: "production"
    event.toolkit.fluxcd.io/env-type: "production"
    event.toolkit.fluxcd.io/url: "https://github.com/org/repo"
```

## ArgoCD Documentation Gaps

Comparing `docs/setup.md` Section 3 against `src/argocd-mapper.js` and `src/index.js`.

| Gap | Current State in Docs | Correct State per Code | Severity |
|-----|----------------------|------------------------|----------|
| Missing `envType` in template body | Not included | Code reads `annotations.envType`, defaults to `unmapped` | HIGH -- env type always shows as `unmapped` |
| Missing `finishedAt` in template body | Not included | Code uses for `lastUpdated` and deterministic ID | CRITICAL -- payload will have `undefined` timestamps |
| Missing `message` in template body | Not included | Code uses for deployment `description` | MEDIUM -- description will be empty |
| Missing `healthStatus` in template body | Not included | Code reads it (passed to `mapPhaseToState`, currently unused) | LOW -- not actively used but part of API |
| No mention of `ARGOCD_WEBHOOK_TOKEN` env var | Not mentioned | Must be set via `forge variables set` | HIGH -- auth will fail |
| No trigger configuration shown | Not mentioned | Users need a trigger to fire the template | HIGH -- template alone does nothing |
| Annotation table missing ArgoCD-specific entries | Same table for both | ArgoCD uses `envType` (camelCase), FluxCD uses `env-type` (hyphenated) | HIGH -- key name difference |

### Corrected ArgoCD Template Body

Based on `src/argocd-mapper.js` `extractMetadata` and `buildDeploymentPayload`:

```yaml
template.jira-deployment: |
  webhook:
    jira-deployments:
      method: POST
      body: |
        {
          "app": "{{.app.metadata.name}}",
          "namespace": "{{.app.spec.destination.namespace}}",
          "revision": "{{.app.status.sync.revision}}",
          "phase": "{{.app.status.operationState.phase}}",
          "healthStatus": "{{.app.status.health.status}}",
          "finishedAt": "{{.app.status.operationState.finishedAt}}",
          "message": "{{.app.status.operationState.message}}",
          "annotations": {
            "jira": "{{index .app.metadata.annotations \"jira\"}}",
            "env": "{{index .app.metadata.annotations \"env\"}}",
            "envType": "{{index .app.metadata.annotations \"envType\"}}",
            "url": "{{index .app.metadata.annotations \"url\"}}"
          }
        }
```

### ArgoCD Trigger Configuration (missing from docs entirely)

Users need a trigger to wire the template to sync events:

```yaml
trigger.on-sync-status: |
  - when: app.status.operationState.phase in ['Succeeded', 'Failed', 'Error', 'Running']
    send: [jira-deployment]
```

And the Application annotation to subscribe:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  annotations:
    notifications.argoproj.io/subscribe.on-sync-status.jira-deployments: ""
    jira: "PROJ-123"
    env: "production"
    envType: "production"
    url: "https://argocd.example.com/applications/my-app"
```

## Troubleshooting Content Requirements

Based on the handler flows in `src/index.js`, these are the failure modes users will encounter:

### 1. HMAC/Bearer Authentication Failures (401)

**FluxCD:**
- Symptom: Webhook returns 401
- Causes: `WEBHOOK_SECRET` not set via `forge variables set`, secret mismatch between Flux Provider secret and Forge env var, `X-Signature` header missing or not in `sha256=<hex>` format
- Debug: Check `forge logs` for "HMAC verification failed"

**ArgoCD:**
- Symptom: Webhook returns 401
- Causes: `ARGOCD_WEBHOOK_TOKEN` not set, token mismatch, `Authorization` header missing or not in `Bearer <token>` format
- Debug: Check `forge logs` for "Bearer token verification failed"

### 2. Missing Required Annotations (400 or 204)

- Missing `jira` annotation: Returns 204 silently. Log message: "No jira annotation -- skipping". This is the most confusing failure -- no error, just no deployments appear.
- Missing `env` annotation: Returns 400 with body "Missing env annotation".
- `url` empty: No error from the app, but Jira Deployments panel link will be broken.

### 3. Silently Ignored Event Reasons (204)

- `UninstallSucceeded` and `DependencyNotReady` return 204.
- Log message: "Ignored reason". Users expecting uninstall events to appear in Jira will not see them.
- This is intentional: uninstalls are not meaningful deployment state transitions, and `DependencyNotReady` is transient noise.

### 4. Upstream Jira API Errors (502)

- Symptom: Webhook returns 502
- Causes: Invalid Jira Cloud site, missing `write:deployment-info:jira` scope, Jira API outage
- Debug: Check `forge logs` for "Jira API call failed"

### 5. Malformed JSON (400)

- Symptom: Webhook returns 400 with "Malformed JSON"
- Cause: Body is not valid JSON (rare with standard CD tool configurations)

## Architecture Patterns

### Documentation Structure

The docs site uses Jekyll with just-the-docs theme. Pages use `nav_order` front matter for sidebar ordering.

Current page structure:
```
docs/
  _config.yml           # just-the-docs remote_theme config
  index.md              # nav_order: 1 - Home
  setup.md              # nav_order: 2 - Setup guide
  troubleshooting.md    # nav_order: 3 - Placeholder
  privacy-policy.md     # Legal (Phase 3)
  terms-of-service.md   # Legal (Phase 3)
  marketplace-listing.md # Excluded from site, listing reference
```

### Content Organization Pattern

Setup page should follow a clear structure per CD tool:
1. Prerequisites (what you need before starting)
2. Forge app setup (env vars)
3. CD tool configuration (Provider/Alert for Flux, ConfigMap for Argo)
4. Resource annotation (HelmRelease for Flux, Application for Argo)
5. Verification (how to confirm it works)

### Annotation Reference Pattern

Use separate tables for FluxCD and ArgoCD since:
- FluxCD uses hyphenated keys (`env-type`) and has full annotation key forms
- ArgoCD uses camelCase (`envType`) and flat annotation object
- Different required/optional semantics

## Common Pitfalls

### Pitfall 1: Documenting Short Keys Only
**What goes wrong:** Docs show only short keys (`jira`, `env`) but users set full annotation keys on HelmRelease. Both work, but docs should explain the duality.
**How to avoid:** Document the full annotation key as the primary form on HelmRelease/Application resources, explain that Flux strips prefixes in webhook payloads, note that both forms are supported.

### Pitfall 2: ArgoCD Template Missing Fields
**What goes wrong:** Incomplete template body means `finishedAt` is undefined, breaking deterministic ID generation and timestamps.
**How to avoid:** Every field read by `extractMetadata` and `buildDeploymentPayload` must be present in the template body.

### Pitfall 3: envType Key Name Difference
**What goes wrong:** FluxCD uses `env-type` (hyphenated), ArgoCD uses `envType` (camelCase). Docs currently use a single annotation table for both.
**How to avoid:** Separate annotation reference tables per CD tool.

### Pitfall 4: Silent 204 Responses
**What goes wrong:** Missing `jira` annotation and ignored reasons both return 204. Users see no error but no deployments appear.
**How to avoid:** Troubleshooting page must prominently cover "deployments not appearing" with checklist of 204-causing conditions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArgoCD Go template syntax | Custom examples | ArgoCD official notification docs templates | Go template syntax is specific, easy to get wrong |
| FluxCD notification API versions | Guessed API versions | FluxCD official notification docs | API versions change between Flux releases |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FluxCD `v1beta1` notification API | `v1beta3` | Flux v2.1+ | Docs already use `v1beta3` -- correct |
| ArgoCD built-in notifications | ArgoCD Notifications (merged into core) | ArgoCD 2.6+ | ConfigMap-based config is current approach |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (native ESM via `--experimental-vm-modules`) |
| Config file | `package.json` jest config |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

This phase is documentation-only. Validation is manual review of docs against source code.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCY-01 | FluxCD docs match code | manual-only | Visual diff of docs/setup.md against src/mapper.js | N/A |
| ACCY-02 | ArgoCD docs match code | manual-only | Visual diff of docs/setup.md against src/argocd-mapper.js | N/A |
| ACCY-03 | Annotation table complete | manual-only | Count annotation keys in docs vs code | N/A |
| SITE-03 | Troubleshooting page has content | manual-only | Check docs/troubleshooting.md is not placeholder | N/A |

**Justification for manual-only:** These requirements verify documentation content accuracy, not code behavior. The source code already has full test coverage (mapper.test.js, argocd-mapper.test.js, index.test.js, hmac.test.js, bearer.test.js). The verification step is comparing prose and YAML examples against code -- not automatable in a meaningful way.

### Sampling Rate
- **Per task commit:** `npm test` (ensure no source code was accidentally modified)
- **Per wave merge:** `npm test` + visual review of rendered docs
- **Phase gate:** All annotation keys in docs match code, troubleshooting page has content

### Wave 0 Gaps
None -- this phase creates/edits documentation files only, no test infrastructure needed.

## Open Questions

1. **ArgoCD notification trigger condition**
   - What we know: The template body format is clear from code. The trigger condition depends on which ArgoCD events users want.
   - What's unclear: Exact Go template paths for ArgoCD fields (e.g., `{{.app.status.operationState.finishedAt}}`) need validation against ArgoCD's actual notification payload schema.
   - Recommendation: Use ArgoCD notification docs as reference for Go template paths. The field names in the template body (`app`, `namespace`, `revision`, `phase`, `healthStatus`, `finishedAt`, `message`) are what our code expects -- the Go template paths to populate them should be verified against ArgoCD docs.

2. **Jira environment type valid values**
   - What we know: Code passes `envType` directly to Jira API. Jira Deployments API accepts: `unmapped`, `development`, `testing`, `staging`, `production`.
   - What's unclear: Should docs list the valid values?
   - Recommendation: Yes, list valid Jira environment types in the annotation reference so users don't set arbitrary values.

## Sources

### Primary (HIGH confidence)
- `src/mapper.js` -- FluxCD annotation keys, reason mapping, ignored reasons
- `src/argocd-mapper.js` -- ArgoCD payload fields, phase mapping, annotation keys
- `src/index.js` -- Handler flow, error codes, validation order
- `src/hmac.js` -- HMAC verification format
- `src/bearer.js` -- Bearer token verification format
- `src/__tests__/mapper.test.js` -- FluxCD test fixtures confirming annotation behavior
- `src/__tests__/argocd-mapper.test.js` -- ArgoCD test fixtures confirming payload format
- `docs/setup.md` -- Current documentation state
- `docs/troubleshooting.md` -- Current placeholder state
- `manifest.yml` -- Webtrigger keys, function mappings, env var names

### Secondary (MEDIUM confidence)
- ArgoCD notification Go template paths (based on standard ArgoCD notification patterns, should be verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- this is documentation work, no new libraries needed
- Architecture: HIGH -- existing docs site structure is established
- Pitfalls: HIGH -- all gaps identified by direct source code comparison
- ArgoCD template paths: MEDIUM -- Go template field paths based on ArgoCD conventions, not verified against current ArgoCD docs

**Research date:** 2026-03-11
**Valid until:** Stable -- changes only if source code changes
