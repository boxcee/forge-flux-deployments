# forge-flux-deployments

Atlassian Forge app that receives FluxCD webhook events and creates Jira deployment records.

## Prerequisites

- Node.js 22+
- [Atlassian Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/) (`npm install -g @forge/cli`)
- A Jira Cloud site with Jira Software
- A Kubernetes cluster running FluxCD (for end-to-end testing)

## Unit Tests

```bash
npm install
npm test
```

All 55 tests run with Jest using native ESM. No external services required.

## Deploy to Jira

```bash
# 1. Log in to Forge
forge login

# 2. Register the app (replaces placeholder app ID in manifest.yml)
forge register

# 3. Set the HMAC shared secret
forge variables set --environment development WEBHOOK_SECRET '<your-secret>'

# 4. Deploy
forge deploy --environment development

# 5. Install on your Jira site
forge install --environment development --site <your-site>.atlassian.net --product jira

# 6. Get the webtrigger URL (save this for FluxCD and manual testing)
forge webtrigger create --functionKey flux-webhook

# To list existing webtrigger URLs:
forge webtrigger list
```

## Manual Testing with curl

Use `forge tunnel` for live debugging, then send test events:

```bash
# Terminal 1: start the tunnel
forge tunnel

# Terminal 2: send a test event
./scripts/send-test-event.sh <webtrigger-url> <hmac-secret> test-fixtures/upgrade-succeeded.json
```

Two fixtures are included:

| Fixture | Scenario |
|---|---|
| `test-fixtures/upgrade-succeeded.json` | Successful Helm upgrade (2 Jira tickets, production) |
| `test-fixtures/upgrade-failed.json` | Failed Helm upgrade (1 Jira ticket, staging) |

After sending, check the referenced Jira issue — the Deployments panel should show the deployment.

## End-to-End Testing with FluxCD

### 1. Create the HMAC secret in your cluster

```bash
kubectl create secret generic jira-webhook-hmac \
  --namespace flux-system \
  --from-literal=token='<same-secret-as-forge-env-var>'
```

### 2. Create the FluxCD notification Provider

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

### 3. Create the FluxCD Alert

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

### 4. Annotate a HelmRelease

The app reads annotations from the HelmRelease to determine Jira issue keys, environment, and a link URL. Flux strips the `event.toolkit.fluxcd.io/` prefix when forwarding annotations to the webhook payload, so the app supports both full and short keys.

| Annotation | Required | Description |
|---|---|---|
| `event.toolkit.fluxcd.io/jira` | Yes | Comma-separated Jira issue keys (e.g., `PROJ-123,PROJ-456`) |
| `event.toolkit.fluxcd.io/env` | Yes | Environment name (e.g., `staging`, `production`) |
| `event.toolkit.fluxcd.io/env-type` | No | Jira environment type: `unmapped`, `development`, `testing`, `staging`, `production` (default: `unmapped`) |
| `event.toolkit.fluxcd.io/url` | Yes | URL shown in the Jira deployment record (e.g., link to repo or dashboard) |

```bash
kubectl annotate helmrelease <name> -n <namespace> \
  event.toolkit.fluxcd.io/jira='PROJ-123' \
  event.toolkit.fluxcd.io/env='staging' \
  event.toolkit.fluxcd.io/env-type='staging' \
  event.toolkit.fluxcd.io/url='https://github.com/org/repo'
```

### 5. Trigger a reconciliation

```bash
flux reconcile helmrelease <name> -n <namespace>
```

Check the Jira issue — the Deployments panel should show the deployment with the correct state.

## Local E2E Testing with kind

Test manifests in `test/k8s/` set up a complete local environment using kind and podinfo. See `docs/plans/2026-03-05-e2e-test-plan.md` for the full step-by-step guide.

Quick start:

```bash
# 1. Create cluster and install Flux
brew install kind
kind create cluster --name flux-test
flux install

# 2. Edit test/k8s/helmrelease.yaml with your Jira issue key
# 3. Edit test/k8s/provider.yaml with your webtrigger URL
# 4. Edit test/k8s/hmac-secret.yaml with your base64-encoded secret

# 5. Apply
kubectl apply -k test/k8s/

# 6. Watch for deployment in Jira
flux get helmreleases -n flux-system --watch

# Cleanup
kind delete cluster --name flux-test
```
