---
title: Demo Script — FluxCD
nav_order: 6
description: "Step-by-step screen recording script for the FluxCD demo."
---

# Demo Script: FluxCD → Jira Deployments

**Total time:** ~8 minutes  
**What you'll show:** Install app → configure secret → set up FluxCD → trigger deployment → see it in Jira

---

## Before you start

Have these open and ready **before** hitting record:

- Terminal (full screen or large window)
- Browser with your Jira instance logged in
- A Jira issue open (e.g. `KAN-1`) — the Deployments panel will appear here

Run these commands to make sure everything is clean:

```bash
kind delete cluster --name flux-demo 2>/dev/null; true
```

---

## Part 1 — Show the app in Jira (0:00)

1. In the browser, go to **Jira Settings** (gear icon, bottom left) → **Apps** (left sidebar)
2. In the left sidebar under Apps, click **GitOps Deployments**
3. Show the admin page — configuration status, webhook URLs, event log tab
4. Point out: _"This is where you configure secrets and monitor incoming webhooks"_

---

## Part 2 — Configure the FluxCD secret (1:00)

1. On the admin page, find the **FluxCD HMAC Secret** field
2. Enter a secret — type this exactly so it's easy to follow:
   ```
   my-demo-secret
   ```
3. Click **Save** — show the green success confirmation
4. Click **Copy** next to the FluxCD webhook URL — paste it somewhere visible (a text editor)
5. Point out: _"This URL is what FluxCD will send webhook events to"_

---

## Part 3 — Set up a local Kubernetes cluster (2:00)

Switch to the terminal.

```bash
# Create a local cluster
kind create cluster --name flux-demo
```

Wait ~30 seconds for the cluster to come up.

```bash
# Verify it's running
kubectl cluster-info --context kind-flux-demo
```

Expected output: cluster is running at `127.0.0.1`.

```bash
# Install FluxCD controllers
flux install
```

Wait ~30 seconds. Expected output: `✔ install finished`

```bash
# Verify all controllers are ready
flux check
```

Expected output: all green checkmarks.

---

## Part 4 — Connect FluxCD to Jira (3:30)

```bash
# Create the HMAC secret in the cluster (same value as the admin page)
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='my-demo-secret'
```

Now apply the notification provider — replace `<WEBHOOK-URL>` with the URL you copied:

```bash
kubectl apply -f - <<'EOF'
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: jira-deployments
  namespace: flux-system
spec:
  type: generic-hmac
  address: <WEBHOOK-URL>
  secretRef:
    name: jira-webhook-hmac
EOF
```

```bash
# Create the alert — watches all HelmReleases in the default namespace
kubectl apply -f - <<'EOF'
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
      namespace: default
EOF
```

---

## Part 5 — Deploy an app with Jira annotations (4:30)

```bash
kubectl apply -f - <<'EOF'
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
    event.toolkit.fluxcd.io/jira: "KAN-1"
    event.toolkit.fluxcd.io/env: "production"
    event.toolkit.fluxcd.io/env-type: "production"
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
EOF
```

Point out the annotations: _"These tell the app which Jira issue to link, which environment this is, and a URL for the deployment details link."_

Watch it reconcile:

```bash
flux get helmreleases -A --watch
```

Wait for: `READY: True` and `Helm install succeeded`

---

## Part 6 — Watch the webhook fire (5:30)

```bash
# Check the notification controller dispatched the event
kubectl logs -n flux-system deployment/notification-controller --since=2m | grep dispatch
```

Expected output: `"msg":"dispatching event"` with the HelmRelease name.

---

## Part 7 — Show the deployment in Jira (6:00)

Switch to the browser.

1. Open the Jira issue `KAN-1`
2. In the right sidebar, find the **Deployments** panel
3. Show the deployment record — environment name (`production`), status (`Successful`), version
4. Click the deployment to show the detail view

Switch back to the admin page:

1. Click the **Event Log** tab
2. Show the `200` status entry — source `flux`, deployment state `successful`
3. Show the **Stats** strip at the top — 1 accepted in the last 24 hours

---

## Part 8 — Trigger a second deployment (6:45)

Show that every upgrade creates a new record:

```bash
# Change a value to trigger an upgrade
kubectl patch helmrelease podinfo -n default \
  --type=merge -p '{"spec":{"values":{"replicaCount":2}}}'

# Watch it upgrade
flux get helmreleases -A --watch
```

Switch to Jira — show a second deployment record now appears. Point out: _"Each deployment is tracked individually — you get a full history."_

---

## Part 9 — Clean up (optional, off-camera)

```bash
kind delete cluster --name flux-demo
```

---

## Troubleshooting during recording

| Problem | Quick fix |
|---------|-----------|
| `kind create cluster` hangs | Run `podman machine start` first |
| Provider shows `NotReady` | Check `kubectl describe provider -n flux-system` — usually a network issue reaching the webhook URL |
| Webhook fires but Jira shows nothing | Verify issue key `KAN-1` exists; check event log for error details |
| No dispatch log | Confirm Alert has `namespace: default` (not `namespace: '*'`) |
