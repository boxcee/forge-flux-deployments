# Marketplace Listing -- GitOps Deployments for Jira

## App Name
GitOps Deployments for Jira

## Summary (170 chars max)
Track FluxCD and ArgoCD deployments directly in Jira issues. Configure secrets in Jira, no CLI required. See deployment status and revisions in the Deployments panel.

## Description

GitOps Deployments for Jira connects your Kubernetes GitOps pipeline to Jira's native Deployments feature. When FluxCD or ArgoCD deploys a change, the app automatically creates a deployment record on the associated Jira issues.

**Supported CD tools:**
- **FluxCD** -- HelmRelease events via generic-hmac webhooks
- **ArgoCD** -- Application sync events via ArgoCD Notifications webhooks

**What you get:**
- Deployment status (successful, failed, rolled back) shown on Jira issues. ArgoCD additionally tracks in-progress deployments.
- Environment tracking (development, staging, production)
- Revision tracking (Helm chart versions for Flux, Git SHAs for Argo)
- Direct links from Jira to your deployment dashboard or repository

**How it works:**
1. Install the app on your Jira Cloud site
2. Open the app settings page (**Jira Settings** > **Apps** > **GitOps Deployments**) and configure your webhook secret or bearer token
3. Copy the webhook URL from the settings page into your CD tool configuration
4. Annotate your HelmReleases (Flux) or Applications (Argo) with Jira issue keys
5. Deployments appear automatically in Jira's Deployments panel

No agents to install. No external infrastructure. Configure directly in Jira and go. Runs entirely on Atlassian Forge.

## 3 Highlights

1. **Zero infrastructure** -- Runs on Atlassian Forge. No servers, databases, or agents to manage. Configure your secrets in Jira's settings page, set up your CD tool's webhooks, and go.

2. **FluxCD + ArgoCD support** -- Works with both major GitOps tools. HMAC-signed webhooks for Flux, bearer token auth for Argo. Add more CD tools as your stack evolves.

3. **Native Jira integration** -- Deployments appear in Jira's built-in Deployments panel on issues, boards, and timelines. No custom fields or workarounds.

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
https://boxcee.github.io/forge-flux-deployments/privacy-policy

## End User Terms URL
https://boxcee.github.io/forge-flux-deployments/terms-of-service

---

## API Scope Justification

| Scope | Justification |
|---|---|
| `write:deployment-info:jira` | Required to create deployment records via the Jira Deployments API (POST /rest/deployments/0.1/bulk) |
| `write:deployment:jira-software` | Required to write deployment data to Jira Software projects |
| `read:deployment:jira-software` | Required to read existing deployment data for status verification |
| `storage:app` | Required to store webhook secrets in the Forge Key-Value Store (KVS), scoped per installation |

## Remote Hostnames
None. The app does not communicate with any external services. It receives inbound webhooks via Forge webtriggers and calls only the Jira API via `@forge/api`.

## Privacy & Security Disclosures

The App is privacy-preserving. It processes deployment metadata (application names, Kubernetes namespaces, Helm chart versions, Git commit SHAs, Jira issue keys, environment names, deployment URLs) solely to transmit it to the Jira Deployments API. None of these data fields constitute PII. Webhook authentication secrets are stored in the Forge Key-Value Store (KVS), scoped per Jira installation.

### Data Storage & Processing

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app store user data outside Atlassian? | No | The app stores webhook authentication secrets in the Forge Key-Value Store (KVS), scoped per Jira installation. No user data or deployment payloads are persisted. All deployment metadata is processed in real-time within the Forge runtime and forwarded directly to the Jira Deployments API. |
| Does your app process data outside Atlassian? | No | Runs entirely on the Atlassian Forge runtime. No external servers or infrastructure. |
| Does your app log end-user data? | No | No logging infrastructure. Forge runtime logs are managed by Atlassian. |
| Does your app store logs outside Atlassian? | No | No external logging. |

### Third-Party Sharing

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app share data with sub-processors? | No | No external connections. All communication is inbound (webhooks) and to Jira (via Forge runtime). |
| Does your app share logs with third parties? | No | No external logging. |
| Is log sharing essential to app function? | N/A | No sharing occurs. |

### Data Residency

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app support data residency? | App stores exclusively within Atlassian products supporting residency | Webhook secrets are stored in the Forge KVS. Deployment metadata goes directly to the Jira Deployments API via Forge. All storage is within Atlassian infrastructure. |
| Does your app support data migration between regions? | N/A | Forge KVS is managed by Atlassian. No app-side migration needed. |

### Data Retention

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app retain data after uninstall? | No | Webhook secrets stored in KVS are removed when the app is uninstalled. Deployment records already written to Jira remain as Jira data governed by Atlassian's data policies. |
| Does your app support custom retention periods? | No | Webhook secrets can be cleared by the admin via the app's settings page at any time. Deployment records in Jira follow Jira's retention policies. |

### Data Protection

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app use privacy-enhancing technologies? | No | Webhook secrets are stored as encrypted secrets in the Forge KVS. Deployment metadata is processed transiently and forwarded to Jira. |
| Does your app use full disk encryption? | N/A | No external storage. Runs entirely on Atlassian Forge. |

### GDPR

| Question | Answer | Rationale |
|----------|--------|-----------|
| Is your organization a GDPR data controller? | No | No PII is collected. The App processes only deployment metadata (application names, namespaces, Helm chart versions, Git commit SHAs, Jira issue keys, environment names, deployment URLs). |
| Is your organization a GDPR data processor? | No | No PII is processed or stored. Deployment metadata passes through to Jira in real-time. |
| Does your app transfer EEA data outside the EEA? | No | No external data transfers. All processing occurs within the Atlassian Forge runtime. |
| What GDPR transfer mechanisms do you use? | N/A | No transfers outside the Forge runtime. |

### CCPA

| Question | Answer | Rationale |
|----------|--------|-----------|
| Is your organization a CCPA business? | Not Applicable | No personal information is collected. The App processes only technical deployment metadata. |
| Is your organization a CCPA service provider? | Not Applicable | No personal information is processed. |

### Security & Authentication

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your app access PATs, passwords, or shared secrets? | Yes | The HMAC webhook secret and ArgoCD bearer token are stored in the Forge Key-Value Store (KVS) secret store, scoped per installation. Secrets are entered by the Jira admin through the app's settings page. Incoming webhooks are verified using HMAC signature verification (SHA-256) or bearer token comparison. |
| Does your app require a Data Processing Agreement? | No | No data processing outside Atlassian. |

### Certifications

| Question | Answer | Rationale |
|----------|--------|-----------|
| Does your organization hold compliance certifications? | No | Individual developer project. |
| Have you completed CAIQ Lite? | No | Not applicable for current scale. |

### Security Program

| Item | Value |
|------|-------|
| Security contact | https://github.com/boxcee/forge-flux-deployments/issues |
| Privacy policy | https://boxcee.github.io/forge-flux-deployments/privacy-policy |
| App permissions justification | See [API Scope Justification](#api-scope-justification) section above |

## App Icon
File: `docs/assets/icon.png`
Dimensions: 144 x 144 px
Format: PNG (RGBA)
Background: Blue chiclet (rounded rectangle)
