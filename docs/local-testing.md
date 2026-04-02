---
title: Local Testing
nav_order: 5
description: "Test the webhook handlers locally without a real cluster using forge tunnel and curl."
---

# Local Testing Guide

Two approaches, from quickest to most realistic:

- **[Option A: curl + forge tunnel](#option-a-curl--forge-tunnel)** — No cluster required. Send hand-crafted webhook payloads directly to your tunnel URL. Best for iterating on the app logic.
- **[Option B: kind local cluster](#option-b-kind-local-cluster)** — Full end-to-end with a real FluxCD or ArgoCD installation on your machine. Best for testing the full GitOps flow.

---

## Option A: curl + forge tunnel

### 1. Start the tunnel

```bash
forge deploy --environment development   # required before tunnelling
forge tunnel
```

The tunnel output shows your webtrigger URLs. Copy the FluxCD one — it looks like:

```
https://xxxx.tunnel.ngrok.io/webtrigger/...
```

Or get them from the admin page: Jira Settings → Apps → GitOps Deployments.

### 2. Configure a secret via the admin page

Open the admin page, set a FluxCD HMAC secret (e.g. `test-secret-123`). You'll use this same value to sign your curl payloads.

### 3. Send a FluxCD webhook

The `X-Signature` header must be `sha256=<HMAC-SHA256 of the raw request body>`.

**Sign and send with a single shell command:**

```bash
SECRET="test-secret-123"
WEBHOOK_URL="<your-flux-webtrigger-url>"

PAYLOAD='{
  "involvedObject": {
    "name": "my-app",
    "namespace": "production"
  },
  "metadata": {
    "event.toolkit.fluxcd.io/jira": "PROJ-123",
    "event.toolkit.fluxcd.io/env": "production",
    "event.toolkit.fluxcd.io/env-type": "production",
    "event.toolkit.fluxcd.io/url": "https://github.com/org/repo",
    "helm.toolkit.fluxcd.io/chart-version": "1.4.2"
  },
  "reason": "UpgradeSucceeded",
  "message": "Helm upgrade succeeded",
  "timestamp": "2026-01-01T12:00:00Z"
}'

SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$PAYLOAD"
```

Expected response: `200`

**Test a skipped event (no jira annotation → 204):**

```bash
PAYLOAD='{
  "involvedObject": { "name": "my-app", "namespace": "production" },
  "metadata": {
    "event.toolkit.fluxcd.io/env": "production"
  },
  "reason": "UpgradeSucceeded",
  "message": "Helm upgrade succeeded",
  "timestamp": "2026-01-01T12:00:00Z"
}'

SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$PAYLOAD"
```

Expected response: `204`

**Test auth failure (wrong secret → 401):**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=invalidsignature" \
  -d "$PAYLOAD"
```

Expected response: `401`

### 4. Send an ArgoCD webhook

ArgoCD uses a bearer token instead of HMAC. Set an ArgoCD token in the admin page first (e.g. `test-argo-token`).

```bash
TOKEN="test-argo-token"
ARGO_WEBHOOK_URL="<your-argo-webtrigger-url>"

curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$ARGO_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "app": "my-service",
    "namespace": "production",
    "revision": "a1b2c3d4e5f6",
    "phase": "Succeeded",
    "healthStatus": "Healthy",
    "message": "successfully synced",
    "finishedAt": "2026-01-01T12:00:00Z",
    "annotations": {
      "jira": "PROJ-123",
      "env": "production",
      "envType": "production",
      "url": "https://argocd.example.com/applications/my-service"
    }
  }'
```

Expected response: `200`

### 5. Verify in Jira

After a `200` response:
- Open the Jira issue (e.g. `PROJ-123`)
- Go to the **Deployments** panel in the right sidebar
- You should see a deployment record with the environment name and version

Check the event log in the admin page to confirm the event was recorded.

### FluxCD reason → Jira state mapping

| FluxCD reason | Jira state |
|---------------|-----------|
| `UpgradeSucceeded`, `InstallSucceeded`, `TestSucceeded` | `successful` |
| `UpgradeFailed`, `InstallFailed`, `TestFailed` | `failed` |
| `RollbackSucceeded` | `rolled_back` |
| `UninstallSucceeded` | skipped (204) |
| `DependencyNotReady` | skipped (204) |
| anything else | `unknown` |

---

## Option B: kind local cluster

This sets up a full local Kubernetes cluster with FluxCD and routes webhooks through your forge tunnel.

### Prerequisites

```bash
brew install kind kubectl flux
```

### 1. Create a local cluster

```bash
kind create cluster --name flux-test
```

Verify:

```bash
kubectl cluster-info --context kind-flux-test
```

### 2. Bootstrap FluxCD

```bash
flux install
```

Verify all Flux controllers are running:

```bash
flux check
```

### 3. Start the Forge tunnel

In a separate terminal, from the project directory:

```bash
forge deploy --environment development
forge tunnel
```

Copy the FluxCD webtrigger URL from the admin page or tunnel output.

### 4. Create the HMAC secret in Kubernetes

Pick a secret value and set it in both the admin page and the cluster:

```bash
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='my-local-secret'
```

### 5. Apply the notification provider

```yaml
# provider.yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: jira-deployments
  namespace: flux-system
spec:
  type: generic-hmac
  address: <your-flux-webtrigger-tunnel-url>
  secretRef:
    name: jira-webhook-hmac
```

```bash
kubectl apply -f provider.yaml
```

Verify the provider is ready:

```bash
kubectl get provider -n flux-system
```

### 6. Apply the alert

```yaml
# alert.yaml
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
      namespace: default   # must be explicit — wildcard '*' is not supported
```

```bash
kubectl apply -f alert.yaml
```

### 7. Deploy a test HelmRelease

Create a minimal HelmRelease with Jira annotations. Use a real Jira issue key from your instance.

```yaml
# test-release.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 1m
  url: https://stefanprodan.github.io/podinfo
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: podinfo
  namespace: default
  annotations:
    event.toolkit.fluxcd.io/jira: "PROJ-123"
    event.toolkit.fluxcd.io/env: "local"
    event.toolkit.fluxcd.io/env-type: "development"
    event.toolkit.fluxcd.io/url: "https://github.com/stefanprodan/podinfo"
spec:
  interval: 1m
  chart:
    spec:
      chart: podinfo
      version: "6.x.x"
      sourceRef:
        kind: HelmRepository
        name: podinfo
```

```bash
kubectl apply -f test-release.yaml
```

### 8. Watch for events

Watch Flux reconcile and fire the webhook:

```bash
flux get helmreleases -A --watch
```

Watch notification events in the tunnel terminal — you should see a `200` log line when the webhook fires.

Check the event log in the admin page or the Jira issue's Deployments panel.

### Trigger a reconciliation manually

To fire another event without changing the chart version:

```bash
flux reconcile helmrelease podinfo -n default
```

### Clean up

```bash
kind delete cluster --name flux-test
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `404` from tunnel URL | Forge tunnel not running or function not deployed | Run `forge deploy` then `forge tunnel` |
| `503` response | Secret not configured in admin page | Set secret in Jira Settings → Apps → GitOps Deployments |
| `401` from FluxCD curl | HMAC mismatch | Verify `$SECRET` matches what's set in the admin page; check `openssl` is signing the exact body string |
| Provider not ready in k3d | Network issue reaching tunnel URL | Check `kubectl describe provider -n flux-system`; verify tunnel URL is reachable from the cluster |
| No deployment in Jira | Issue key doesn't exist or wrong project | Verify the Jira issue key exists; check app has `WRITE` permission to the project |
| `204` instead of `200` | Missing or wrong annotation | Ensure `jira` and `env` annotations are set; check reason is not in the ignore list |
