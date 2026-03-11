---
title: Home
nav_order: 1
description: "Track FluxCD and ArgoCD deployments directly in Jira issues."
---

# GitOps Deployments for Jira

Track FluxCD and ArgoCD deployments directly in Jira issues. See deployment status, environment, and version in the native Deployments panel -- no polling, no extra dashboards.

## Supported CD Tools

- **FluxCD** -- HMAC-authenticated webhooks via the Flux notification controller.
- **ArgoCD** -- Bearer token webhooks via ArgoCD notifications.

## How it works

1. Install the app from the Atlassian Marketplace
2. Configure your CD tool to send webhook events
3. Annotate your resources with Jira issue keys
4. See deployments appear in Jira's native panel

## Deployment States

The app maps CD tool events to these Jira deployment states:

| State | Description |
|-------|-------------|
| `successful` | Deployment completed successfully |
| `failed` | Deployment failed |
| `in_progress` | Deployment is in progress |
| `rolled_back` | Deployment was rolled back |

## Get Started

- [Setup Guide](./setup) -- connect your CD tool to Jira
- [GitHub Issues](https://github.com/boxcee/forge-flux-deployments/issues) -- questions and support
