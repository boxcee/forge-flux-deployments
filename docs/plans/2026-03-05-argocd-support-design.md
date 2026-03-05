# ArgoCD Support Design

## Goal

Support ArgoCD alongside FluxCD as a deployment source, enabling Atlassian Marketplace listing with broader appeal.

## Architecture

### Routing & Auth

Two separate webtrigger endpoints, one per CD tool:

- `flux-webhook` (existing) — HMAC auth via `X-Signature` header, validated against `WEBHOOK_SECRET`
- `argo-webhook` (new) — Bearer token auth via `Authorization` header, validated against `ARGOCD_WEBHOOK_TOKEN`

Source detection is implicit: each endpoint knows its source.

### Mappers

- `mapper.js` — FluxCD mapper (unchanged)
- `argocd-mapper.js` — ArgoCD mapper with `extractMetadata`, `mapPhaseToState`, `buildDeploymentPayload`
- Both produce identical Jira Deployments API payload structure for `jira.js`

### Shared Modules

- `jira.js` — unchanged
- `hmac.js` — unchanged, only used by Flux handler

### Manifest

Two `webtrigger` entries, two `devops:deploymentInfoProvider` entries (FluxCD + ArgoCD branding), two `function` entries.

## ArgoCD Payload Contract

ArgoCD webhook template must send:

```json
{
  "app": "my-service",
  "namespace": "production",
  "revision": "a1b2c3d4e5f6",
  "phase": "Succeeded",
  "healthStatus": "Healthy",
  "message": "successfully synced",
  "finishedAt": "2026-03-05T12:00:00Z",
  "annotations": {
    "jira": "PROJ-123,PROJ-456",
    "env": "production",
    "envType": "production",
    "url": "https://argocd.example.com/applications/my-service"
  }
}
```

Annotations are sourced from ArgoCD Application resource annotations, passed through via the webhook template.

## State Mapping (ArgoCD)

| ArgoCD phase | health.status | Jira state    |
|-------------|---------------|---------------|
| Succeeded   | Healthy       | successful    |
| Failed      | any           | failed        |
| Error       | any           | failed        |
| Running     | any           | in_progress   |
| other       | any           | unknown       |

No `rolled_back` equivalent in ArgoCD.

## File Changes

| File                                  | Action    |
|---------------------------------------|-----------|
| `src/index.js`                        | Add `handleArgoEvent` export |
| `src/argocd-mapper.js`                | New — ArgoCD metadata extraction and payload building |
| `src/bearer.js`                       | New — bearer token verification |
| `src/hmac.js`                         | Unchanged |
| `src/mapper.js`                       | Unchanged |
| `src/jira.js`                         | Unchanged |
| `manifest.yml`                        | Add second webtrigger, function, deploymentInfoProvider |
| `src/__tests__/argocd-mapper.test.js` | New |
| `src/__tests__/bearer.test.js`        | New |
| `src/__tests__/index.test.js`         | Add `handleArgoEvent` tests |
| `README.md`                           | Add ArgoCD setup instructions + notification template |
