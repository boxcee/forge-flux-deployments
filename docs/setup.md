# Getting Started & Setup Guide

This guide will help you connect your GitOps pipeline to Jira's native Deployments panel using **GitOps Deployments for Jira**.

---

## 1. Prerequisites

- A Jira Cloud instance with Jira Software.
- The **GitOps Deployments for Jira** app installed from the Atlassian Marketplace.
- A Kubernetes cluster running **FluxCD** or **ArgoCD**.

## 2. FluxCD Configuration

### A. Create a Webhook Secret
```bash
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='YOUR_SECRET_TOKEN'
```

### B. Configure the Provider
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

### C. Create the Alert
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

## 4. Annotate Your Resources

For deployments to appear in Jira, you must annotate your resources with the relevant Jira issue keys.

| Annotation | Description | Example |
|---|---|---|
| `jira` | Comma-separated Jira issue keys | `PROJ-123,PROJ-456` |
| `env` | Environment name | `production` |
| `url` | A link to show in Jira | `https://github.com/my-org/repo` |

---

[Back to Home](./)
