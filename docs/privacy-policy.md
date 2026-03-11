---
title: Privacy
nav_order: 4
description: "How the app handles your data."
---

# Privacy Policy — GitOps Deployments for Jira

**Last Updated: March 10, 2026**

This Privacy Policy describes how your information is handled when you use the **GitOps Deployments for Jira** app (the "App") on the Atlassian Forge platform.

## 1. Information We Collect
The App is designed to be **stateless and privacy-preserving**.
- **No Personal Data:** We do not collect, store, or transmit any Personal Identifiable Information (PII) such as names, email addresses, or IP addresses.
- **Operational Data:** The App processes deployment metadata (application names, namespaces, commit SHAs, and Jira issue keys) solely to transmit it to your Jira instance.

## 2. How Data is Processed
- **In-Transit Only:** Data is processed in real-time within the Atlassian Forge secure runtime.
- **No Persistence:** We do not use any databases or persistent storage. Once a deployment event is sent to Jira, the App retains no record of the transaction.
- **Direct Integration:** Data flows directly from your GitOps provider (FluxCD/ArgoCD) to the Atlassian Forge endpoint, and then to the Jira Cloud API.

## 3. Third-Party Services
The App runs entirely on the **Atlassian Forge** platform. Data processing is subject to the [Atlassian Privacy Policy](https://www.atlassian.com/legal/privacy-policy).

## 4. Security
We leverage Atlassian's enterprise-grade security for the Forge platform to ensure your deployment metadata is handled securely.

## 5. Contact
If you have questions about this policy, please open an issue on our [GitHub repository](https://github.com/boxcee/forge-flux-deployments/issues).
