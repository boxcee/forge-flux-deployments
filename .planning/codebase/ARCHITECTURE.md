# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Webhook request-response pipeline with pluggable event sources

**Key Characteristics:**
- Event-driven webhook handler (Forge webtrigger functions)
- Two independent event source handlers (FluxCD and ArgoCD) sharing common infrastructure
- Layered validation: signature/token verification → metadata extraction → state mapping → Jira API submission
- No database layer — stateless event processing
- Deterministic deployment ID generation for idempotency

## Layers

**Presentation (Webtrigger Entry Points):**
- Purpose: Receive HTTP webhook requests and return HTTP-like responses
- Location: `src/index.js` exports `handleFluxEvent` and `handleArgoEvent`
- Contains: Two public async functions that orchestrate the full pipeline
- Depends on: All validation and mapper modules
- Used by: Forge webtrigger configuration in `manifest.yml`

**Authentication/Verification:**
- Purpose: Validate incoming webhook authenticity before processing
- Location: `src/hmac.js` (FluxCD), `src/bearer.js` (ArgoCD)
- Contains: Timing-safe signature and token verification using Node.js crypto
- Depends on: Node.js `crypto` module
- Used by: `src/index.js` handlers before parsing body

**Metadata Extraction & Normalization:**
- Purpose: Parse event payloads and extract deployment metadata
- Location: `src/mapper.js` (FluxCD), `src/argocd-mapper.js` (ArgoCD)
- Contains: Event-specific metadata extraction and reason/phase-to-state mapping functions
- Depends on: `src/shared.js` (common utilities)
- Used by: `src/index.js` to validate and transform events

**Shared Utilities:**
- Purpose: Common functionality used across mappers
- Location: `src/shared.js`
- Contains: Deterministic ID generation (SHA-256 hash), issue key parsing
- Depends on: Node.js `crypto` module
- Used by: Both `mapper.js` and `argocd-mapper.js`

**API Integration:**
- Purpose: Submit deployment data to Jira Deployments API
- Location: `src/jira.js`
- Contains: Thin wrapper around `@forge/api` POST to `/rest/deployments/0.1/bulk`
- Depends on: `@forge/api` package
- Used by: `src/index.js` as final step in pipeline

## Data Flow

**FluxCD Webhook Flow:**

1. Forge webtrigger receives POST to `flux-webhook` endpoint
2. `handleFluxEvent` extracts `x-signature` header and request body
3. `verifyHmac()` validates signature using timing-safe comparison
4. Body parsed as JSON
5. `extractMetadata()` normalizes FluxCD event structure (handles both full and short annotation keys due to Flux prefix stripping)
6. Validation: check for required Jira annotation and environment annotation
7. Check if event reason is in `IGNORED_REASONS` set
8. `buildDeploymentPayload()` transforms metadata and event into Jira Deployments API schema
9. `submitDeployment()` POSTs payload to Jira
10. Response logged (warnings for rejected deployments/unknown issue keys)
11. HTTP 200 returned with accepted count

**ArgoCD Webhook Flow:**

1. Forge webtrigger receives POST to `argo-webhook` endpoint
2. `handleArgoEvent` extracts `authorization` header and request body
3. `verifyBearerToken()` validates token using timing-safe comparison
4. Body parsed as JSON
5. `extractMetadata()` normalizes ArgoCD notification payload structure
6. Validation: check for required Jira annotation and environment annotation
7. `buildDeploymentPayload()` transforms metadata and payload into Jira Deployments API schema
8. `submitDeployment()` POSTs payload to Jira
9. Response logged (warnings for rejected deployments/unknown issue keys)
10. HTTP 200 returned with accepted count

**State Management:**

- No in-memory state: each request is independent
- Deployments are identified by deterministic sequence numbers (SHA-256 hash of name:namespace:version:timestamp)
- Jira API handles deduplication via `updateSequenceNumber` for updates to same deployment

## Key Abstractions

**Metadata Extraction:**
- Purpose: Parse heterogeneous event formats into a common metadata structure
- Examples: `src/mapper.js` extractMetadata(), `src/argocd-mapper.js` extractMetadata()
- Pattern: Event object → normalized metadata object with `issueKeys`, `env`, `envType`, `revision/chartVersion`, `url`, `appName/helmReleaseName`, `namespace`

**Reason/Phase Mapping:**
- Purpose: Normalize event-specific status indicators to Jira deployment states
- Examples: `mapReasonToState()` (FluxCD), `mapPhaseToState()` (ArgoCD)
- Pattern: Lookup table mapping event-specific codes to standard states: `successful`, `failed`, `rolled_back`, `in_progress`, `unknown`

**Payload Builder:**
- Purpose: Construct Jira Deployments API bulk request from normalized metadata
- Examples: `buildDeploymentPayload()` (both modules)
- Pattern: Takes normalized metadata + event, generates array with single deployment object conforming to Jira schema v1.0

**Deterministic ID Generator:**
- Purpose: Generate stable deployment sequence numbers for idempotency
- Examples: `deterministicId()` in `src/shared.js`
- Pattern: SHA-256 hash of `name:namespace:version:timestamp`, take first 8 hex chars, parse as uint32

## Entry Points

**handleFluxEvent:**
- Location: `src/index.js` line 24
- Triggers: Forge webtrigger `flux-webhook` when webhook posted to app URL
- Responsibilities: Orchestrates FluxCD webhook validation, transformation, and submission; error handling for each stage

**handleArgoEvent:**
- Location: `src/index.js` line 71
- Triggers: Forge webtrigger `argo-webhook` when webhook posted to app URL
- Responsibilities: Orchestrates ArgoCD webhook validation, transformation, and submission; error handling for each stage

## Error Handling

**Strategy:** Fail-fast with HTTP status codes; specific errors logged with context

**Patterns:**

- **401 Unauthorized:** Invalid HMAC/bearer token → log warning, return 401
- **400 Bad Request:** Malformed JSON or missing required annotations → return 400 with reason
- **204 No Content:** Silently skip ignored reasons or missing Jira annotation → return 204
- **502 Bad Gateway:** Jira API call fails → log error, return 502
- **200 OK:** Success case, log warnings if rejected deployments present

## Cross-Cutting Concerns

**Logging:** Uses `console.log`, `console.info`, `console.warn`, `console.error` from Node.js; Forge runtime captures to deployment logs

**Validation:** Multi-stage validation at each layer (signature, JSON parse, required annotations, known reasons) prevents invalid payloads reaching Jira

**Authentication:** Timing-safe comparison for both HMAC and bearer token verification prevents timing attacks

---

*Architecture analysis: 2026-03-11*
