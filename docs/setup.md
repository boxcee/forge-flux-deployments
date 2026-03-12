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

### A. Configure the webhook secret

Navigate to the app's settings page to set the HMAC shared secret. Without a configured secret, all webhooks return 503.

1. Go to **Jira Settings** (gear icon) > **Apps** > **GitOps Deployments** in the left sidebar.
2. Enter your HMAC shared secret in the **FluxCD HMAC Secret** field (minimum 8 characters).
3. Click **Save** -- a success confirmation appears inline.
4. Use the same secret value when creating the Kubernetes secret for your FluxCD notification provider (see step B).

> **Developer note:** You can alternatively use `forge variables set WEBHOOK_SECRET '<secret>'` for CLI-based configuration. The admin UI value takes priority when both are set.

### B. Create a Webhook Secret

Create the Kubernetes secret that FluxCD uses to sign webhook payloads:

```bash
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='<your-secret-token>'
```

### C. Configure the Provider

Copy the FluxCD webhook URL displayed on the admin settings page.

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
- **401** -- HMAC verification failed. Open the admin settings page and verify the secret matches the Kubernetes secret token.
- **503** -- Webhook secret not configured. Navigate to the admin settings page to set your secret.

---

## 3. ArgoCD Configuration

### A. Configure the webhook token

Navigate to the app's settings page to set the bearer token. Without a configured token, all webhooks return 503.

1. Go to **Jira Settings** (gear icon) > **Apps** > **GitOps Deployments** in the left sidebar.
2. Enter your bearer token in the **ArgoCD Bearer Token** field (minimum 8 characters).
3. Click **Save** -- a success confirmation appears inline.
4. Use the same token value in the `Authorization: Bearer <token>` header of your ArgoCD webhook configuration (see step B).

> **Developer note:** You can alternatively use `forge variables set ARGOCD_WEBHOOK_TOKEN '<token>'` for CLI-based configuration. The admin UI value takes priority when both are set.

### B. Configure the webhook service

Copy the ArgoCD webhook URL from the admin settings page. Add the webhook service to your `argocd-notifications-cm` ConfigMap:

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

### C. Define the notification template

The template body must include all fields the app reads. Missing fields result in incomplete deployment records.

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

### D. Configure the trigger

Add a trigger that fires on sync state changes:

```yaml
trigger.on-sync-status: |
  - when: app.status.operationState.phase in ['Succeeded', 'Failed', 'Error', 'Running']
    send: [jira-deployment]
```

### E. Annotate your Application

Subscribe the Application to the notification trigger and add the deployment metadata annotations:

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

> **Note:** ArgoCD uses flat annotation keys (no prefix stripping). `envType` is camelCase, not hyphenated like FluxCD's `env-type`.

### F. Verify it works

Trigger a sync and check `forge logs` for a 200 response.

- **200** -- Deployment record created in Jira.
- **204** -- Event was skipped. Check that `jira` and `env` annotations are set.
- **401** -- Bearer token verification failed. Open the admin settings page and verify the token matches the `Authorization` header value.
- **503** -- Webhook secret not configured. Navigate to the admin settings page to set your token.

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

| Annotation | Required | Default | Description |
|---|---|---|---|
| `jira` | Yes | -- | Comma-separated Jira issue keys. If missing, event is silently skipped (204). |
| `env` | Yes | -- | Environment name. Returns 400 if missing. |
| `envType` | No | `unmapped` | Jira environment type. Valid values: `unmapped`, `development`, `testing`, `staging`, `production`. Note: camelCase, not hyphenated. |
| `url` | No | `''` | URL shown in Jira deployment panel. Recommended. |

#### ArgoCD payload fields

The notification template sends these top-level fields:

| Field | Source | Description |
|---|---|---|
| `app` | `.app.metadata.name` | Application name, used as pipeline ID. |
| `namespace` | `.app.spec.destination.namespace` | Target namespace. |
| `revision` | `.app.status.sync.revision` | Git revision (first 7 chars used as label). |
| `phase` | `.app.status.operationState.phase` | Sync operation phase. Determines Jira deployment state. |
| `healthStatus` | `.app.status.health.status` | Application health status. |
| `finishedAt` | `.app.status.operationState.finishedAt` | Timestamp used for deployment ordering. |
| `message` | `.app.status.operationState.message` | Operation message, used as deployment description. |

**Phase to Jira state mapping:**

| ArgoCD Phase | Jira Deployment State |
|---|---|
| `Succeeded` | `successful` |
| `Failed` | `failed` |
| `Error` | `failed` |
| `Running` | `in_progress` |
| Other | `unknown` |
