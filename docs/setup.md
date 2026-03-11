---
title: Setup
nav_order: 2
description: "Connect FluxCD or ArgoCD to Jira's native Deployments panel."
---

# Getting Started & Setup Guide

This guide will help you connect your GitOps pipeline to Jira's native Deployments panel using **GitOps Deployments for Jira**.

## 1. Prerequisites

- A Jira Cloud instance with Jira Software.
- The **GitOps Deployments for Jira** app installed from the Atlassian Marketplace.
- A Kubernetes cluster running **FluxCD** or **ArgoCD**.

## 2. FluxCD Configuration

### A. Set the webhook secret

Set the HMAC secret in your Forge environment. This must match the token used in the Kubernetes secret below. Without it, all webhooks return 401.

```bash
forge variables set WEBHOOK_SECRET '<your-secret-token>'
```

### B. Create a Webhook Secret

Create the Kubernetes secret that FluxCD uses to sign webhook payloads:

```bash
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='<your-secret-token>'
```

### C. Configure the Provider

Replace `<webtrigger-url>` with the URL provided by your Jira app configuration.

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: jira-deployments
  namespace: flux-system
spec:
  type: generic-hmac
  address: <webtrigger-url>
  secretRef:
    name: jira-webhook-hmac
```

### D. Create the Alert

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: helmrelease-deployments
  namespace: flux-system
spec:
  providerRef:
    name: jira-deployments
  eventSeverity: info
  eventSources:
    - kind: HelmRelease
      name: '*'
```

### E. Annotate your HelmRelease

Add annotations to each HelmRelease you want tracked in Jira:

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
spec:
  chart:
    spec:
      version: "1.2.3"   # exposed as chart-version in events
```

> **Note:** Flux strips the `event.toolkit.fluxcd.io/` prefix when sending webhook payloads, so the app supports both full and short keys. The `helm.toolkit.fluxcd.io/chart-version` annotation is read from the `revision` field in webhook payloads.

### F. Verify it works

Trigger a HelmRelease reconciliation and check `forge logs` for a 200 response.

- **200** -- Deployment record created in Jira.
- **204** -- Event was skipped. Check that `jira` and `env` annotations are set, and that the event reason is not ignored.
- **401** -- HMAC verification failed. Verify that `WEBHOOK_SECRET` matches the Kubernetes secret token.

---

## 3. ArgoCD Configuration

### A. Configure Notifications
Add the webhook service to your `argocd-notifications-cm` ConfigMap.

```yaml
data:
  service.webhook.jira-deployments: |
    url: <argo-webhook-webtrigger-url>
    headers:
      - name: Authorization
        value: Bearer <your-token>
      - name: Content-Type
        value: application/json
```

### B. Define the Template
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
          "annotations": {
            "jira": "{{index .app.metadata.annotations \"jira\"}}",
            "env": "{{index .app.metadata.annotations \"env\"}}",
            "url": "{{index .app.metadata.annotations \"url\"}}"
          }
        }
```

---

## 4. Annotation Reference

### FluxCD Annotations

| Annotation | Short Key | Required | Default | Description |
|---|---|---|---|---|
| `event.toolkit.fluxcd.io/jira` | `jira` | Yes | -- | Comma-separated Jira issue keys. If missing, event is silently skipped (204). |
| `event.toolkit.fluxcd.io/env` | `env` | Yes | -- | Environment name. Returns 400 if missing. |
| `event.toolkit.fluxcd.io/env-type` | `env-type` | No | `unmapped` | Jira environment type. Valid values: `unmapped`, `development`, `testing`, `staging`, `production`. |
| `event.toolkit.fluxcd.io/url` | `url` | No | `''` | URL shown in Jira deployment panel. Recommended -- Jira panel link is broken without it. |
| `helm.toolkit.fluxcd.io/chart-version` | `revision` | No | -- | Chart version used in display name and deployment label. |

#### Ignored event reasons

`UninstallSucceeded` and `DependencyNotReady` events return 204 silently and do not create deployment records. This is intentional.

### ArgoCD Annotations

For deployments to appear in Jira, you must annotate your resources with the relevant Jira issue keys.

| Annotation | Description | Example |
|---|---|---|
| `jira` | Comma-separated Jira issue keys | `PROJ-123,PROJ-456` |
| `env` | Environment name | `production` |
| `url` | A link to show in Jira | `https://github.com/my-org/repo` |
