# Marketplace Listing — GitOps Deployments for Jira

## App Name
GitOps Deployments for Jira

## Summary (170 chars max)
Track FluxCD and ArgoCD deployments directly in Jira issues. See deployment status, environment, and revision in the Deployments panel — no polling, no manual updates.

## Description

GitOps Deployments for Jira connects your Kubernetes GitOps pipeline to Jira's native Deployments feature. When FluxCD or ArgoCD deploys a change, the app automatically creates a deployment record on the associated Jira issues.

**Supported CD tools:**
- **FluxCD** — HelmRelease events via generic-hmac webhooks
- **ArgoCD** — Application sync events via ArgoCD Notifications webhooks

**What you get:**
- Deployment status (successful, failed, in progress, rolled back) shown on Jira issues
- Environment tracking (development, staging, production)
- Revision tracking (Helm chart versions for Flux, Git SHAs for Argo)
- Direct links from Jira to your deployment dashboard or repository

**How it works:**
1. Install the app on your Jira Cloud site
2. Configure FluxCD or ArgoCD to send webhooks to the app's endpoint
3. Annotate your HelmReleases (Flux) or Applications (Argo) with Jira issue keys
4. Deployments appear automatically in Jira's Deployments panel

No agents to install. No database. No external infrastructure. Runs entirely on Atlassian Forge.

## 3 Highlights

1. **Zero infrastructure** — Runs on Atlassian Forge. No servers, databases, or agents to manage. Just configure your CD tool's webhooks and go.

2. **FluxCD + ArgoCD support** — Works with both major GitOps tools. HMAC-signed webhooks for Flux, bearer token auth for Argo. Add more CD tools as your stack evolves.

3. **Native Jira integration** — Deployments appear in Jira's built-in Deployments panel on issues, boards, and timelines. No custom fields or workarounds.

## Categories
- DevOps
- Deployment

## Keywords
- gitops
- fluxcd
- argocd
- deployments

## Support URL
https://github.com/boxcee/forge-flux-deployments/issues

## Privacy Policy URL
(TODO: create and host)

## End User Terms URL
(TODO: create and host)

---

## API Scope Justification

| Scope | Justification |
|---|---|
| `write:deployment-info:jira` | Required to create deployment records via the Jira Deployments API (POST /rest/deployments/0.1/bulk) |
| `write:deployment:jira-software` | Required to write deployment data to Jira Software projects |
| `read:deployment:jira-software` | Required to read existing deployment data for status verification |

## Remote Hostnames
None. The app does not communicate with any external services. It receives inbound webhooks via Forge webtriggers and calls only the Jira API via `@forge/api`.

## Privacy & Security Disclosures

- **Personal data processed:** None. The app processes deployment metadata (app names, namespaces, revisions, Jira issue keys) only. No user PII is collected, stored, or transmitted.
- **Data storage:** None. The app is stateless — it receives a webhook, transforms the payload, and forwards it to the Jira Deployments API in a single request.
- **External connections:** None. All communication is inbound (webhooks) and to Jira (via Forge runtime).
- **Personal Access Tokens:** Not required.
