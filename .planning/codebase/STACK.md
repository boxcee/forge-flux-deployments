# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- JavaScript (Node.js) - All source code in `src/`

## Runtime

**Environment:**
- Node.js 22.x - Specified in `manifest.yml` as `nodejs22.x`

**Package Manager:**
- npm - Present with `package-lock.json` lockfile

## Frameworks

**Core:**
- Atlassian Forge Platform - Serverless platform for Jira Cloud integrations (`@forge/api` ^4.0.0)

**Testing:**
- Jest ^29.7.0 - Test runner configured with native ESM support in `package.json`
- ESLint ^10.0.2 - Code linting for `src/` directory
- @eslint/js ^10.0.1 - Recommended ESLint rules configuration

**Build/Dev:**
- @jest/globals ^29.7.0 - Jest globals for ESM testing

## Key Dependencies

**Critical:**
- `@forge/api` ^4.0.0 - Atlassian Forge SDK providing `api` and `route` for Jira API calls
  - Used in `src/jira.js` for submitting deployments to Jira Deployments API
  - Enables `requestJira()` method for authenticated calls to `/rest/deployments/0.1/bulk`

## Configuration

**Environment:**
- Forge environment variables managed via CLI (`forge variables set`)
- Required variables:
  - `WEBHOOK_SECRET` - HMAC shared secret for FluxCD webhook verification
  - `ARGOCD_WEBHOOK_TOKEN` - Bearer token for ArgoCD webhook authentication
- Accessed via `process.env.WEBHOOK_SECRET` and `process.env.ARGOCD_WEBHOOK_TOKEN` in `src/index.js`

**Build:**
- `manifest.yml` - Defines Forge app metadata, webtrigger handlers, DevOps provider registration
- `eslint.config.js` - Linting rules using @eslint/js recommended config
  - ES2024 language support
  - ESM source type
  - Unused variable detection with underscore prefix exception

## Code Style

**Module System:**
- ESM only - `"type": "module"` in `package.json`
- All imports use `.js` extensions (e.g., `import { verifyHmac } from './hmac.js'`)
- No build step - direct execution by Node.js

**Test Configuration:**
- Jest configured with `"transform": {}` for native ESM support
- Tests run with flag: `node --experimental-vm-modules node_modules/.bin/jest`
- Test files co-located in `src/__tests__/` directory

## Platform Requirements

**Development:**
- Node.js 22+ required
- Atlassian Forge CLI required for deployment and local debugging

**Production:**
- Jira Cloud instance with Jira Software
- Forge app runtime managed by Atlassian (Node.js 22.x)
- FluxCD or ArgoCD cluster for webhook sources

---

*Stack analysis: 2026-03-11*
