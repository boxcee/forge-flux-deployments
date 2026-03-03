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
forge webtrigger flux-webhook
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

```bash
kubectl annotate helmrelease <name> -n <namespace> \
  event.toolkit.fluxcd.io/jira='PROJ-123' \
  event.toolkit.fluxcd.io/env='staging' \
  event.toolkit.fluxcd.io/env-type='staging'
```

### 5. Trigger a reconciliation

```bash
flux reconcile helmrelease <name> -n <namespace>
```

Check the Jira issue — the Deployments panel should show the deployment with the correct state.
