# E2E Test Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a local kind cluster with FluxCD that deploys podinfo, sends webhooks to the Forge app, and creates deployment records in Jira Cloud.

**Architecture:** kind cluster runs Flux controllers. Flux reconciles a HelmRelease for podinfo. Notification-controller sends HMAC-signed webhooks to the Forge webtrigger URL. Forge app processes the event and calls Jira Deployments API.

**Tech Stack:** kind, FluxCD v2, Helm, Forge CLI, Jira Cloud (free tier)

---

### Task 1: Install kind and create cluster

**Step 1: Install kind**

```bash
brew install kind
```

Expected: `kind` available on PATH.

**Step 2: Create the cluster**

```bash
kind create cluster --name flux-test
```

Expected: Cluster created, kubectl context set to `kind-flux-test`.

**Step 3: Verify**

```bash
kubectl cluster-info --context kind-flux-test
kubectl get nodes
```

Expected: One node in `Ready` state.

---

### Task 2: Install Flux into the cluster

**Step 1: Pre-flight check**

```bash
flux check --pre
```

Expected: All checks pass.

**Step 2: Install Flux controllers**

```bash
flux install
```

This installs source-controller, kustomize-controller, helm-controller, and notification-controller into namespace `flux-system`. No GitHub bootstrap needed.

Expected: All controllers running.

**Step 3: Verify**

```bash
flux check
kubectl get pods -n flux-system
```

Expected: All 4 controller pods `Running`, all checks pass.

---

### Task 3: Install and configure Forge CLI

**Step 1: Install Forge CLI**

```bash
npm install -g @forge/cli
```

Expected: `forge --version` works.

**Step 2: Log in**

```bash
forge login
```

This opens a browser for Atlassian OAuth. Follow the prompts.

Expected: `forge whoami` shows your account.

**Step 3: Register the app**

Run from the repo root (`/Users/moritzschmitz-oviva/workspaces/forge-flux-deployments`):

```bash
forge register
```

This replaces the placeholder `app.id` in `manifest.yml` with a real app ID.

Expected: `manifest.yml` updated with `ari:cloud:ecosystem::app/<real-id>`.

**Step 4: Set the HMAC secret**

Choose a secret string (e.g., `test-hmac-secret-2026`). Use the same value in Task 5 for the k8s Secret.

```bash
forge variables set --environment development WEBHOOK_SECRET '<your-secret>'
```

**Step 5: Deploy**

```bash
forge deploy --environment development
```

Expected: Deployment succeeds.

**Step 6: Install on your Jira site**

```bash
forge install --environment development --site <your-site>.atlassian.net --product jira
```

Replace `<your-site>` with your actual Jira site subdomain.

**Step 7: Get the webtrigger URL**

```bash
forge webtrigger flux-webhook
```

Save this URL — it's needed in Task 5 for the notification Provider.

**Step 8: (Optional) Start tunnel for live debugging**

In a separate terminal:

```bash
forge tunnel
```

This proxies the webtrigger to your local machine so you can see logs in real time.

---

### Task 4: Create the test manifests

**Files:**
- Create: `test/k8s/helmrepository.yaml`
- Create: `test/k8s/helmrelease.yaml`
- Create: `test/k8s/hmac-secret.yaml`
- Create: `test/k8s/provider.yaml`
- Create: `test/k8s/alert.yaml`
- Create: `test/k8s/kustomization.yaml`

**Step 1: Create directory**

```bash
mkdir -p test/k8s
```

**Step 2: Create `test/k8s/helmrepository.yaml`**

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: podinfo
  namespace: flux-system
spec:
  interval: 10m
  url: https://stefanprodan.github.io/podinfo
```

**Step 3: Create `test/k8s/helmrelease.yaml`**

Replace `<ISSUE-KEY>` with your Jira issue key (e.g., `TEST-1`).

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: podinfo
  namespace: flux-system
  annotations:
    event.toolkit.fluxcd.io/jira: "<ISSUE-KEY>"
    event.toolkit.fluxcd.io/env: "test"
    event.toolkit.fluxcd.io/env-type: "testing"
spec:
  interval: 10m
  chart:
    spec:
      chart: podinfo
      version: "6.7.1"
      sourceRef:
        kind: HelmRepository
        name: podinfo
  values:
    replicaCount: 1
```

**Step 4: Create `test/k8s/hmac-secret.yaml`**

Replace `<base64-encoded-secret>` with the base64 encoding of your HMAC secret:

```bash
echo -n '<your-secret>' | base64
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jira-webhook-hmac
  namespace: flux-system
type: Opaque
data:
  token: <base64-encoded-secret>
```

**Step 5: Create `test/k8s/provider.yaml`**

Replace `<WEBTRIGGER-URL>` with the URL from Task 3, Step 7.

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: jira-deployments
  namespace: flux-system
spec:
  type: generic-hmac
  address: "<WEBTRIGGER-URL>"
  secretRef:
    name: jira-webhook-hmac
```

**Step 6: Create `test/k8s/alert.yaml`**

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
      name: "*"
```

**Step 7: Create `test/k8s/kustomization.yaml`**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - helmrepository.yaml
  - helmrelease.yaml
  - hmac-secret.yaml
  - provider.yaml
  - alert.yaml
```

**Step 8: Commit**

```bash
git add test/k8s/
git commit -m "feat: add e2e test manifests for kind + Flux"
```

---

### Task 5: Apply manifests and trigger reconciliation

**Step 1: Apply all manifests**

```bash
kubectl apply -k test/k8s/
```

Expected: All 5 resources created in `flux-system` namespace.

**Step 2: Verify Flux resources**

```bash
flux get sources helm -n flux-system
flux get helmreleases -n flux-system
```

Expected: HelmRepository `podinfo` shows `Ready`, HelmRelease `podinfo` shows `Ready` or reconciling.

**Step 3: Check notification resources**

```bash
kubectl get providers.notification.toolkit.fluxcd.io -n flux-system
kubectl get alerts.notification.toolkit.fluxcd.io -n flux-system
```

Expected: Both `jira-deployments` provider and `helmrelease-deployments` alert exist.

**Step 4: Watch for the HelmRelease to reconcile**

```bash
flux get helmreleases -n flux-system --watch
```

Wait until status shows `Release reconciliation succeeded` or similar.

**Step 5: Check notification-controller logs**

```bash
kubectl logs -n flux-system deploy/notification-controller --since=5m | grep -i "jira\|dispatch\|alert"
```

Expected: Log lines showing the alert was dispatched to the provider URL.

---

### Task 6: Verify in Jira

**Step 1: Open the Jira issue**

Navigate to your Jira issue (the key you used in the HelmRelease annotation).

**Step 2: Check the Deployments panel**

In the issue detail view, look for the **Deployments** section (right sidebar or below the description, depending on your layout).

Expected:
- A deployment record from "FluxCD Deployments" provider
- Display name: `podinfo 6.7.1 to test`
- State: `successful`
- Environment: `test` (type: `testing`)

**Step 3: If no deployment appears**

Troubleshooting checklist:
1. Check Forge logs: `forge logs --environment development`
2. Check notification-controller logs (Task 5, Step 5)
3. Verify the webtrigger URL is correct in the Provider
4. Verify the HMAC secret matches between Forge env var and k8s Secret
5. Manually test with curl: `./scripts/send-test-event.sh <url> <secret> test-fixtures/upgrade-succeeded.json`

---

### Task 7: Trigger an upgrade event (optional further validation)

**Step 1: Bump the chart version**

Edit `test/k8s/helmrelease.yaml` and change `version: "6.7.1"` to `version: "6.7.0"` (or any other valid podinfo version).

**Step 2: Apply and reconcile**

```bash
kubectl apply -f test/k8s/helmrelease.yaml
flux reconcile helmrelease podinfo -n flux-system
```

Expected: A second deployment record appears in Jira with the new version.

---

### Cleanup

When done testing:

```bash
kind delete cluster --name flux-test
```

This removes the entire cluster and all resources.
