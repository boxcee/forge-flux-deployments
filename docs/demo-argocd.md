---
title: Demo Script — ArgoCD
nav_order: 7
description: "Step-by-step screen recording script for the ArgoCD demo."
---

# Demo Script: ArgoCD → Jira Deployments

**Total time:** ~10 minutes  
**What you'll show:** Install app → configure token → set up ArgoCD with notifications → trigger sync → see it in Jira

---

## Before you start

Have these open and ready **before** hitting record:

- Terminal (full screen or large window)
- Browser with your Jira instance logged in
- A Jira issue open (e.g. `KAN-1`) — the Deployments panel will appear here

Run these commands to make sure everything is clean:

```bash
kind delete cluster --name argo-demo 2>/dev/null; true
```

---

## Part 1 — Show the app in Jira (0:00)

1. In the browser, go to **Jira Settings** (gear icon, bottom left) → **Apps** (left sidebar)
2. In the left sidebar under Apps, click **GitOps Deployments**
3. Show the admin page — configuration status, webhook URLs, event log tab
4. Point out: _"This supports both FluxCD and ArgoCD — today we'll configure the ArgoCD side"_

---

## Part 2 — Configure the ArgoCD bearer token (1:00)

1. On the admin page, find the **ArgoCD Bearer Token** field
2. Enter a token — type this exactly so it's easy to follow:
   ```
   my-argo-demo-token
   ```
3. Click **Save** — show the green success confirmation
4. Click **Copy** next to the ArgoCD webhook URL — paste it into a text editor
5. Point out: _"This is the URL ArgoCD will POST deployment events to, authenticated with the token we just set"_

---

## Part 3 — Set up a local Kubernetes cluster (2:00)

Switch to the terminal.

```bash
# Create a local cluster
kind create cluster --name argo-demo
```

Wait ~30 seconds.

```bash
kubectl cluster-info --context kind-argo-demo
```

---

## Part 4 — Install ArgoCD (2:30)

```bash
# Create namespace and install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for all pods to be ready (~60–90 seconds):

```bash
kubectl wait --for=condition=available deployment \
  -l "app.kubernetes.io/name=argocd-server" \
  -n argocd --timeout=120s
```

```bash
# Install ArgoCD notifications controller
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/notifications-install.yaml
```

Wait for notifications controller:

```bash
kubectl wait --for=condition=available deployment/argocd-notifications-controller \
  -n argocd --timeout=120s
```

---

## Part 5 — Configure ArgoCD notifications (4:00)

Apply the ConfigMap that defines the webhook service, notification template, and trigger.

Replace `<WEBHOOK-URL>` with the ArgoCD URL you copied from the admin page:

```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.webhook.jira-deployments: |
    url: <WEBHOOK-URL>
    headers:
      - name: Authorization
        value: Bearer my-argo-demo-token
      - name: Content-Type
        value: application/json

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

  trigger.on-sync-status: |
    - when: app.status.operationState.phase in ['Succeeded', 'Failed', 'Error', 'Running']
      send: [jira-deployment]
EOF
```

Point out the three sections: _"The service defines where and how to send the webhook. The template defines the payload shape. The trigger defines when to fire — on any sync phase change."_

---

## Part 6 — Create an ArgoCD Application with Jira annotations (5:30)

First, create a target namespace:

```bash
kubectl create namespace demo-app
```

Apply the Application:

```bash
kubectl apply -f - <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: podinfo
  namespace: argocd
  annotations:
    notifications.argoproj.io/subscribe.on-sync-status.jira-deployments: ""
    jira: "KAN-1"
    env: "production"
    envType: "production"
    url: "https://github.com/stefanprodan/podinfo"
spec:
  project: default
  source:
    repoURL: https://stefanprodan.github.io/podinfo
    chart: podinfo
    targetRevision: 6.11.2
    helm:
      releaseName: podinfo
  destination:
    server: https://kubernetes.default.svc
    namespace: demo-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF
```

Point out the annotations: _"The subscribe annotation opts this app into our trigger. The jira, env, and url annotations are what the webhook handler reads to build the Jira deployment record."_

---

## Part 7 — Watch the sync and webhook fire (6:30)

```bash
# Watch the application sync
kubectl get application podinfo -n argocd --watch
```

Wait for `STATUS: Synced` and `HEALTH: Healthy`.

```bash
# Verify the notification was dispatched
kubectl logs -n argocd deployment/argocd-notifications-controller --since=2m \
  | grep -E "Sending|delivered|error" | tail -5
```

Expected: a line showing the notification was sent to `jira-deployments`.

---

## Part 8 — Show the deployment in Jira (7:30)

Switch to the browser.

1. Open the Jira issue `KAN-1`
2. In the right sidebar, find the **Deployments** panel
3. Show the deployment record — environment (`production`), status (`Successful`), revision (short git SHA)
4. Click the deployment to show the detail view with the URL link

Switch to the admin page:

1. Click the **Event Log** tab
2. Show the `200` status entry — source `argocd`, deployment state `successful`
3. Show the **Stats** strip — 1 accepted in the last 24 hours

---

## Part 9 — Trigger a second sync (8:30)

Show that each sync creates a new record:

```bash
# Bump the chart version to trigger a new sync
kubectl patch application podinfo -n argocd \
  --type=merge -p '{"spec":{"source":{"targetRevision":"6.11.1"}}}'
```

Wait for the sync to complete, then switch to Jira — show a second deployment record. Point out: _"Full deployment history, automatically tracked."_

---

## Part 10 — Clean up (optional, off-camera)

```bash
kind delete cluster --name argo-demo
```

---

## Troubleshooting during recording

| Problem | Quick fix |
|---------|-----------|
| `kind create cluster` hangs | Run `podman machine start` first |
| ArgoCD pods not ready | Wait longer — image pulls can take 2–3 min on first run |
| Notification not dispatched | Check `kubectl logs -n argocd deployment/argocd-notifications-controller` for `failed to notify` errors |
| `401` in event log | Token in ConfigMap doesn't match what's set in admin page |
| `204` in event log | `jira` or `env` annotation missing from the Application |
| Webhook fires but Jira shows nothing | Verify `KAN-1` exists; check event log for `unknownIssueKeys` |
