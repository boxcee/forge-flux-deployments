# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Atlassian Forge app that receives FluxCD webhook events (generic-hmac provider) and creates Jira deployment records via the Deployments API. It runs as a Forge webtrigger function on Node.js 22.

## Commands

```bash
npm install                                              # install deps
npm test                                                 # run all tests (Jest, native ESM)
node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>'  # run a single test file
npm run lint                                             # ESLint (src/ only)
forge deploy --environment development                   # deploy to Forge
forge tunnel                                             # live debug with tunnel
```

## Architecture

Four source modules in `src/`, no build step:

- **index.js** — Webtrigger handler. Orchestrates: HMAC verification → JSON parse → metadata extraction → reason filtering → payload build → Jira submit. Returns HTTP-like `{ statusCode, body }`.
- **hmac.js** — Verifies FluxCD `X-Signature` header (`sha256=<hex>`) using timing-safe comparison.
- **mapper.js** — Maps FluxCD event reasons to Jira deployment states (`successful`/`failed`/`rolled_back`/`unknown`). Extracts metadata from `event.metadata` using both full annotation keys (`event.toolkit.fluxcd.io/jira`) and short keys (`jira`) — Flux strips the prefix in webhook payloads. Builds the Jira Deployments API bulk payload with deterministic deployment IDs (SHA-256 hash of name:namespace:chartVersion:timestamp).
- **jira.js** — Thin wrapper around `@forge/api` calling `POST /rest/deployments/0.1/bulk`.

Tests live in `src/__tests__/` and mirror source files. They mock `@forge/api` and use `@jest/globals` imports.

## Key Conventions

- **ESM only** — `"type": "module"` in package.json. All imports use `.js` extensions.
- **Forge manifest** — `manifest.yml` defines the webtrigger key (`flux-webhook`), function mapping, and DevOps deployment provider registration.
- **FluxCD annotations** — The app reads HelmRelease annotations (`event.toolkit.fluxcd.io/jira`, `/env`, `/env-type`, `/url`). Flux strips the prefix in webhook payloads, so mapper supports both full and short keys. The `url` annotation is required by Jira's Deployments API. See README for full annotation table.
- **HMAC secret** — Stored as Forge environment variable `WEBHOOK_SECRET`, set via `forge variables set`.
- **Ignored reasons** — `UninstallSucceeded` and `DependencyNotReady` are silently skipped (204).

## Forge Tunnel & Deploy Gotchas

- **`forge tunnel` registers a persistent tunnel URL** with the Forge platform. Even after stopping the tunnel, the platform keeps routing the resource iframe to `localhost:800x`. This means **the admin page will not load without an active tunnel** in the development environment until a clean deploy clears the registration.
- **Always `forge deploy` before `forge tunnel`** when adding new manifest modules (functions, resources, admin pages). The tunnel can only override functions that are already registered in the platform. New functions added only in the tunnel won't be found (404).
- **`@forge/resolver` ESM interop** — The package exports CJS. `import Resolver from '@forge/resolver'` gives a namespace object in Node ESM, not the class. Use `const Resolver = ResolverModule.default || ResolverModule;` pattern if needed. Forge's bundler (webpack) may handle this differently from raw Node.
- **Admin page location** — `jira:adminPage` modules appear under Jira Settings → Apps (left sidebar), NOT in the app overview/manage apps page. URL pattern: `/jira/settings/apps/{appId}/{envId}`.
