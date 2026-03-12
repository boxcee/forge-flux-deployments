---
title: Troubleshooting
nav_order: 3
description: "Common issues and solutions."
---

# Troubleshooting

The app returns standard HTTP status codes from its webtrigger endpoints. Use `forge logs` to see detailed error messages for any failed request.

## Webhook returns 503 (Secret Not Configured)

**Symptom:** Webhook returns 503 with body `Webhook secret not configured. Configure via app admin page.`

**Cause:** No secret has been saved in the admin settings page, and no environment variable fallback is set.

**Fix:** Navigate to **Jira Settings** (gear icon) > **Apps** > **GitOps Deployments** and enter your webhook secret (FluxCD) or bearer token (ArgoCD).

## Webhook returns 401 (Authentication Failed)

### FluxCD (HMAC)

**Symptom:** All FluxCD webhooks return 401.

**Checklist:**

1. Verify the secret is configured: open the admin settings page (**Jira Settings** > **Apps** > **GitOps Deployments**) and check the FluxCD HMAC Secret field.
2. Verify the secret value matches the Kubernetes secret token value exactly (no trailing newline, no extra whitespace).
3. Verify the Flux Provider resource uses `type: generic-hmac` (not `generic`).
4. Check that the `X-Signature` header is present in the request. Flux sends it in `sha256=<hex>` format.

**Debug:** Run `forge logs --environment production` and look for `HMAC verification failed`.

### ArgoCD (Bearer Token)

**Symptom:** All ArgoCD webhooks return 401.

**Checklist:**

1. Verify the token is configured: open the admin settings page (**Jira Settings** > **Apps** > **GitOps Deployments**) and check the ArgoCD Bearer Token field.
2. Verify the token matches the `Authorization: Bearer <token>` header value configured in `argocd-notifications-cm`.
3. Check the header format is `Bearer <token>` (with a space, no quotes around the token value).

**Debug:** Run `forge logs --environment production` and look for `Bearer token verification failed`.

## Re-consent prompt after upgrading to v1.1

**Symptom:** Admin page shows an error or KVS operations fail after app upgrade.

**Cause:** The v1.1 update adds the `storage:app` scope, triggering a Forge major version bump that requires admin re-consent.

**Fix:** A Jira site admin must approve the new permissions. Existing webhooks continue working via environment variable fallback during the re-consent gap.

## Admin page not found

**Symptom:** Cannot find the app's settings page.

**Cause:** Jira admin pages appear under **Settings > Apps** (left sidebar), not in Manage Apps or the app overview page.

**Fix:** Navigate to **Jira Settings** (gear icon) > **Apps** > look for **GitOps Deployments** in the left sidebar. URL pattern: `/jira/settings/apps/{appId}/{envId}`.

## Deployments not appearing in Jira (silent 204)

This is the most confusing failure mode -- the webhook returns 204 (no error), but nothing shows up in Jira. Three possible causes:

### Missing `jira` annotation

The app skips events that lack a `jira` annotation and returns 204. Verify your resource has the annotation set:

- **FluxCD:** Use either the full key `event.toolkit.fluxcd.io/jira` or the short key `jira` on your HelmRelease. Flux strips the prefix in webhook payloads, so both work.
- **ArgoCD:** Use the `jira` annotation on your Application.

The annotation value must contain one or more Jira issue keys (e.g., `PROJ-123` or `PROJ-123,PROJ-456`).

**Debug:** Run `forge logs` and look for `No jira annotation -- skipping`.

### Ignored event reasons (FluxCD only)

The following FluxCD event reasons are silently skipped (204):

- `UninstallSucceeded` -- uninstalls are not deployment state transitions.
- `DependencyNotReady` -- transient noise from Flux dependency resolution.

This is intentional. These events do not represent meaningful deployment state changes.

**Debug:** Run `forge logs` and look for `Ignored reason`.

### No matching Alert eventSource (FluxCD)

If the Flux Alert resource's `eventSources` filter does not match the resource kind/name, Flux never sends the webhook in the first place. The app receives nothing, so there are no logs to check.

Verify your Alert's `eventSources` includes the correct `kind` (e.g., `HelmRelease`) and `name` or `namespace` selector.

## Webhook returns 400 (Bad Request)

### Missing `env` annotation

The app requires an `env` annotation on every event. Without it, the webhook returns 400 with body `Missing env annotation`.

**Fix:** Add the `env` annotation to your HelmRelease (FluxCD) or Application (ArgoCD). The value should be the environment name (e.g., `staging`, `production`).

### Malformed JSON

The request body is not valid JSON. This is rare with standard CD tool configurations.

**Fix:** For ArgoCD, check that the notification template body in `argocd-notifications-cm` produces valid JSON. For FluxCD, this should not happen under normal operation -- check for proxy or middleware interference.

## Webhook returns 502 (Upstream Error)

**Symptom:** Webhook returns 502 with body `Upstream API error`.

**Cause:** The Jira Cloud Deployments API rejected the request or was unreachable.

**Checklist:**

1. Verify the app has the `write:deployment-info:jira` scope (granted automatically at install time).
2. Check if Jira Cloud is experiencing an outage at [status.atlassian.com](https://status.atlassian.com).
3. Verify the Jira site is accessible from the browser.

**Debug:** Run `forge logs` and look for `Jira API call failed` followed by the upstream error message.

## Common mistakes quick reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| 503 on every request | Secret/token not configured | Open the admin settings page and enter your secret or token |
| 401 on every request | Secret/token mismatch | Open the admin settings page and verify the value matches your CD tool configuration |
| No deployments, no errors | Missing `jira` annotation | Add `jira` annotation to HelmRelease/Application |
| 400 "Missing env annotation" | Missing `env` annotation | Add `env` annotation |
| Environment shows as "unmapped" | Missing `env-type`/`envType` | Add the annotation with a valid Jira environment type |
| Deployment panel link broken | Missing or empty `url` | Add `url` annotation |
| 502 errors | Jira API issue | Check `forge logs`, verify app scopes |
| Admin page not found | Wrong navigation path | Go to Jira Settings > Apps (left sidebar), not Manage Apps |
