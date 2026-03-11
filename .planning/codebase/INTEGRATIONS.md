# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Jira Cloud Deployments API:**
- Service - Atlassian Jira Cloud REST API for deployment tracking
  - SDK/Client: `@forge/api` (^4.0.0)
  - Endpoint: `POST /rest/deployments/0.1/bulk`
  - Implementation: `src/jira.js` - `submitDeployment()` function
  - Auth: Implicit Forge app identity via `api.asApp().requestJira()`

**FluxCD Webhook:**
- Service - Generic HMAC webhook provider integration
  - Trigger Key: `flux-webhook` defined in `manifest.yml`
  - Handler: `src/index.js` - `handleFluxEvent()` export
  - Auth: HMAC-SHA256 verification via `X-Signature` header
  - Environment Variable: `WEBHOOK_SECRET`

**ArgoCD Webhook:**
- Service - ArgoCD notifications webhook integration
  - Trigger Key: `argo-webhook` defined in `manifest.yml`
  - Handler: `src/index.js` - `handleArgoEvent()` export
  - Auth: Bearer token verification in `Authorization` header
  - Environment Variable: `ARGOCD_WEBHOOK_TOKEN`

## Webhooks & Callbacks

**Incoming Webhooks:**

**FluxCD Notification Webhook:**
- URL: Generated via `forge webtrigger create --functionKey flux-webhook`
- Payload Format: JSON event object from Flux notification system
- Source: FluxCD `notification.toolkit.fluxcd.io/v1beta3` Provider (type: `generic-hmac`)
- Signature Header: `X-Signature: sha256=<hex>` (verified by `src/hmac.js`)
- Relevant Fields:
  - `involvedObject.name`, `involvedObject.namespace` - HelmRelease identifier
  - `reason` - Event reason (e.g., `UpgradeSucceeded`, `InstallFailed`) mapped in `src/mapper.js`
  - `timestamp` - Event timestamp
  - `metadata` - Annotations with Jira details (stripped of `event.toolkit.fluxcd.io/` prefix by Flux)
  - `message` - Event message text

**ArgoCD Notification Webhook:**
- URL: Generated via `forge webtrigger create --functionKey argo-webhook`
- Payload Format: JSON webhook body from ArgoCD notification template
- Source: ArgoCD `argocd-notifications-cm` ConfigMap webhook service
- Auth Header: `Authorization: Bearer <token>` (verified by `src/bearer.js`)
- Relevant Fields from webhook template:
  - `app` - Application name
  - `namespace` - Application namespace
  - `revision` - Git commit hash
  - `phase` - Operation phase (e.g., `Succeeded`, `Failed`) mapped in `src/argocd-mapper.js`
  - `healthStatus` - ArgoCD health status
  - `finishedAt` - Operation timestamp
  - `annotations.jira`, `annotations.env`, `annotations.envType`, `annotations.url` - Jira metadata

## Jira Integration Details

**Deployment Metadata Extraction:**

FluxCD annotations (mapped by `src/mapper.js`):
- `event.toolkit.fluxcd.io/jira` (or short key `jira`) - Comma-separated issue keys (required)
- `event.toolkit.fluxcd.io/env` (or short key `env`) - Environment name (required)
- `event.toolkit.fluxcd.io/env-type` (or short key `env-type`) - Environment type: `unmapped`, `development`, `testing`, `staging`, `production` (default: `unmapped`)
- `event.toolkit.fluxcd.io/url` (or short key `url`) - URL for deployment record (required)
- `helm.toolkit.fluxcd.io/chart-version` (or short key `revision`) - Chart version for display

ArgoCD annotations (mapped by `src/argocd-mapper.js`):
- `jira` - Comma-separated issue keys (required)
- `env` - Environment name (required)
- `envType` - Environment type (default: `unmapped`)
- `url` - URL for deployment record (required)

**Deployment Payload Schema:**
- Schema: `deployments` array with `schemaVersion: 1.0`
- State Mapping (FluxCD):
  - `InstallSucceeded`, `UpgradeSucceeded`, `TestSucceeded`, `ReconciliationSucceeded` → `successful`
  - `InstallFailed`, `UpgradeFailed`, `TestFailed`, `ReconciliationFailed`, `RollbackFailed`, `UninstallFailed`, `ArtifactFailed` → `failed`
  - `RollbackSucceeded` → `rolled_back`
  - Other reasons → `unknown`
- State Mapping (ArgoCD):
  - `Succeeded` → `successful`
  - `Failed`, `Error` → `failed`
  - `Running` → `in_progress`
  - Other phases → `unknown`
- Deployment ID: SHA-256 deterministic hash of `<name>:<namespace>:<version>:<timestamp>` (prevents duplicates)
- Associated Issue Keys: Array of parsed Jira issue keys from annotations

**Permissions Required:**
- `write:deployment-info:jira` - Register deployment info providers (FluxCD, ArgoCD)
- `write:deployment:jira-software` - Submit deployment records
- `read:deployment:jira-software` - Query deployment status

## Authentication & Identity

**Forge App Authentication:**
- Type: Implicit Forge app identity
- Mechanism: `api.asApp()` context in `src/jira.js` automatically provides app-to-cloud authentication
- Scope: All Jira API calls authenticated as the Forge app, not as a user

**Webhook Signature Verification:**
- FluxCD: HMAC-SHA256 verification in `src/hmac.js`
  - Header: `X-Signature: sha256=<hex>`
  - Secret: `WEBHOOK_SECRET` environment variable
  - Comparison: Timing-safe `timingSafeEqual()` from Node.js `crypto` module
  - Message: Raw request body

**Bearer Token Verification:**
- ArgoCD: Bearer token string comparison in `src/bearer.js`
  - Header: `Authorization: Bearer <token>`
  - Secret: `ARGOCD_WEBHOOK_TOKEN` environment variable
  - Comparison: Timing-safe `timingSafeEqual()` to prevent timing attacks

## Environment Configuration

**Required Environment Variables:**
- `WEBHOOK_SECRET` - Shared HMAC secret for FluxCD generic-hmac provider
  - Set via: `forge variables set --environment development WEBHOOK_SECRET '<secret>'`
  - Used in: `src/hmac.js`, accessed in `src/index.js` via `process.env.WEBHOOK_SECRET`

- `ARGOCD_WEBHOOK_TOKEN` - Bearer token for ArgoCD webhook authentication
  - Set via: `forge variables set --environment development ARGOCD_WEBHOOK_TOKEN '<token>'`
  - Used in: `src/bearer.js`, accessed in `src/index.js` via `process.env.ARGOCD_WEBHOOK_TOKEN`

**Secrets Location:**
- Managed by Atlassian Forge platform
- Set via Forge CLI during deployment
- Not stored in version control (enforced by `.gitignore` which excludes `node_modules/`)

## DevOps Provider Registration

**FluxCD Deployment Provider:**
- Provider Key: `flux-deployment-provider` (defined in `manifest.yml`)
- Display Name: FluxCD Deployments
- Home URL: https://fluxcd.io
- Logo URL: https://raw.githubusercontent.com/fluxcd/website/main/static/img/flux-icon.svg
- Documentation URL: https://fluxcd.io/flux/components/notification/

**ArgoCD Deployment Provider:**
- Provider Key: `argo-deployment-provider` (defined in `manifest.yml`)
- Display Name: ArgoCD Deployments
- Home URL: https://argoproj.github.io/cd/
- Logo URL: https://raw.githubusercontent.com/argoproj/argo-cd/master/docs/assets/logo.png
- Documentation URL: https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/

---

*Integration audit: 2026-03-11*
