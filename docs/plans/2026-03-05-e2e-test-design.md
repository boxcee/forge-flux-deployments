# E2E Test Design: Forge Flux Deployments

## Goal

Prove the full integration path: FluxCD reconciles a HelmRelease, notification-controller sends a webhook to the Forge webtrigger, and a deployment record appears in Jira Cloud.

## Architecture

```
kind cluster
  Flux source-controller ──► HelmRepository (podinfo)
  Flux helm-controller   ──► HelmRelease (annotated with Jira issue key)
  Flux notification-ctrl ──► Provider (generic-hmac) ──► Forge webtrigger URL
                                                              │
                                                    Forge app (tunnel or deployed)
                                                              │
                                                    Jira Cloud Deployments API
```

All test manifests are applied via `kubectl apply` — no GitRepository/Kustomization needed.

## Components

### Local cluster (kind)

- Tool: `kind` via `brew install kind`
- Cluster name: `flux-test`
- Flux installed via `flux install` (controllers only, no bootstrap)

### Forge app

- Install `@forge/cli` globally
- `forge register` to get a real app ID
- Set `WEBHOOK_SECRET` env var
- Deploy to development environment
- Install on the test Jira site
- Get webtrigger URL via `forge webtrigger flux-webhook`

### Test manifests (`test/k8s/`)

| File | Purpose |
|------|---------|
| `helmrepository.yaml` | podinfo chart source |
| `helmrelease.yaml` | podinfo release with Jira annotations |
| `hmac-secret.yaml` | HMAC shared secret for webhook signing |
| `provider.yaml` | Notification provider (generic-hmac → webtrigger URL) |
| `alert.yaml` | Alert watching all HelmRelease events |

### HelmRelease annotations

```yaml
annotations:
  event.toolkit.fluxcd.io/jira: "<ISSUE-KEY>"
  event.toolkit.fluxcd.io/env: "test"
  event.toolkit.fluxcd.io/env-type: "testing"
```

## Prerequisites (user-provided)

1. Jira Cloud site URL
2. A Jira issue key (e.g., `TEST-1`)
3. An HMAC secret string

## Success criteria

A deployment record in the Jira issue's Deployments panel showing:
- Display name: `podinfo <version> to test`
- State: `successful`
- Environment: `test`
