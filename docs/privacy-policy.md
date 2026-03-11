---
title: Privacy
nav_order: 4
description: "How the app handles your data."
---

# Privacy Policy — GitOps Deployments for Jira

**Last Updated: March 10, 2026**

**Effective Date: March 10, 2026**

This Privacy Policy describes how your information is handled when you use the **GitOps Deployments for Jira** app (the "App") on the Atlassian Forge platform.

## 1. Information We Collect
The App is designed to be **stateless and privacy-preserving**.
- **No Personal Data:** We do not collect, store, or transmit any Personal Identifiable Information (PII) such as names, email addresses, or IP addresses.
- **Deployment Metadata:** The App processes the following deployment metadata solely to transmit it to your Jira instance:
  - Application names
  - Kubernetes namespaces
  - Helm chart versions
  - Git commit SHAs
  - Jira issue keys
  - Environment names
  - Deployment URLs

  None of these data fields constitute PII. They are technical identifiers related to your deployment pipeline.

## 2. How Data is Processed
- **In-Transit Only:** Data is processed in real-time within the Atlassian Forge secure runtime.
- **No Persistence:** We do not use any databases or persistent storage. Once a deployment event is sent to Jira, the App retains no record of the transaction.
- **Direct Integration:** Data flows directly from your GitOps provider (FluxCD/ArgoCD) to the Atlassian Forge endpoint, and then to the Jira Cloud API.

## 3. Third-Party Services
The App runs entirely on the **Atlassian Forge** platform. Data processing is subject to the [Atlassian Privacy Policy](https://www.atlassian.com/legal/privacy-policy).

## 4. Security
We leverage Atlassian's enterprise-grade security for the Forge platform to ensure your deployment metadata is handled securely. Incoming webhook requests are authenticated using HMAC signature verification (SHA-256) to prevent unauthorized submissions.

## 5. Contact
If you have questions about this policy, please open an issue on our [GitHub repository](https://github.com/boxcee/forge-flux-deployments/issues).

## 6. Data Deletion and Retention

The App does not store, persist, or retain any data. All deployment event data is processed in real-time within the Atlassian Forge runtime and forwarded directly to the Jira Deployments API. No data remains in the App after processing.

- **On uninstall:** No residual data exists. Uninstalling the App removes the webhook endpoint. Deployment records already written to Jira remain as part of your Jira data and are governed by Atlassian's data policies.
- **Deletion requests:** Since the App stores no data, there is no App-side data to delete. For deployment records in Jira, contact Atlassian support or manage them through Jira's built-in tools.

## 7. Data Subject Rights

The App does not collect or store any personal data. There is no personal data to access, modify, or delete within the App. For data held within your Jira instance (such as deployment records), refer to Atlassian's privacy documentation or contact Atlassian support.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted to this page with an updated "Last Updated" date. Your continued use of the App after changes are posted constitutes acceptance of the revised policy.

## 9. International Data

Since the App does not collect or store any PII, GDPR data subject rights and CCPA consumer rights do not apply to the App itself. All deployment metadata is processed transiently within the Atlassian Forge runtime and written to your Jira instance. For data held within Jira, refer to the [Atlassian Privacy Policy](https://www.atlassian.com/legal/privacy-policy).
