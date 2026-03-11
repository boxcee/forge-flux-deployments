# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
forge-flux-deployments/
├── src/                    # Source code (ESM, no build)
│   ├── index.js            # Webtrigger handlers (entry points)
│   ├── hmac.js             # FluxCD signature verification
│   ├── bearer.js           # ArgoCD token verification
│   ├── mapper.js           # FluxCD event transformation
│   ├── argocd-mapper.js    # ArgoCD event transformation
│   ├── jira.js             # Jira API client
│   ├── shared.js           # Common utilities (deterministic ID, issue key parsing)
│   └── __tests__/          # Unit tests (mirrors source files)
│       ├── index.test.js
│       ├── hmac.test.js
│       ├── bearer.test.js
│       ├── mapper.test.js
│       ├── argocd-mapper.test.js
│       └── jira.test.js
├── manifest.yml            # Forge app configuration (webtrigger keys, permissions)
├── package.json            # Dependencies (ESM, Jest, ESLint)
├── eslint.config.js        # Linting rules
├── docs/                   # Documentation (README, setup guides, assets)
├── test-fixtures/          # Example event payloads (FluxCD, ArgoCD)
├── test/                   # Kubernetes/ArgoCD test resources
│   ├── k8s/                # Flux HelmRelease + Alert definitions
│   └── argocd/             # ArgoCD Application + notification config
├── scripts/                # Utility scripts
└── .planning/              # GSD planning documents
    └── codebase/           # Architecture/structure documentation
```

## Directory Purposes

**src/:**
- Purpose: Core application logic; implements webhook handler orchestration and event processing
- Contains: Four handler/mapper modules, one API client, one shared utility module, collocated unit tests
- Key files: `src/index.js` (orchestrator), `src/mapper.js` + `src/argocd-mapper.js` (transformers)

**src/__tests__/:**
- Purpose: Unit test suite using Jest with native ESM
- Contains: Test files mirroring each source module by name
- Key files: All .test.js files; structured with describe/test/expect; mock @forge/api

**docs/:**
- Purpose: User-facing documentation and marketplace assets
- Contains: README.md, setup guides, Jira marketplace assets, GitHub Pages configuration
- Key files: README.md (annotation reference), setup-guide.md, assets/ (logos, screenshots)

**test-fixtures/:**
- Purpose: Example webhook payloads for manual testing and documentation
- Contains: JSON files showing real FluxCD and ArgoCD event structures
- Key files: `upgrade-succeeded.json`, `upgrade-failed.json`, `argo-sync-succeeded.json`, `argo-sync-failed.json`

**test/:**
- Purpose: Kubernetes resource manifests for test environments
- Contains: Flux HelmRelease manifests with sample annotations, ArgoCD Application definitions
- Key files: `k8s/helmrelease.yaml` (example with Jira annotations), `k8s/alert.yaml` (Flux notification)

**manifest.yml:**
- Purpose: Forge app manifest; defines webtrigger keys, permissions, runtime, and deployment provider registration
- Contains: Webtrigger module bindings (flux-webhook → handleFluxEvent, argo-webhook → handleArgoEvent)
- Key sections: `modules.webtrigger`, `modules.devops:deploymentInfoProvider`, `modules.function`, `permissions`, `app.runtime` (nodejs22.x)

## Key File Locations

**Entry Points:**
- `src/index.js`: Webtrigger handlers; orchestrates both FluxCD and ArgoCD pipelines

**Configuration:**
- `manifest.yml`: Forge app configuration; webtrigger endpoints, DevOps provider registration, permissions
- `package.json`: Dependencies, test runner config, lint setup
- `eslint.config.js`: ESLint configuration for src/ linting

**Core Logic:**
- `src/mapper.js`: FluxCD event parsing, reason-to-state mapping, Jira payload construction
- `src/argocd-mapper.js`: ArgoCD event parsing, phase-to-state mapping, Jira payload construction
- `src/hmac.js`: FluxCD HMAC-SHA256 signature verification (timing-safe)
- `src/bearer.js`: ArgoCD bearer token verification (timing-safe)
- `src/jira.js`: Jira Deployments API client wrapper
- `src/shared.js`: Deterministic deployment ID generation, issue key parsing

**Testing:**
- `src/__tests__/index.test.js`: Tests for both webtrigger handlers; covers HMAC/bearer verification, payload validation, error codes
- `src/__tests__/mapper.test.js`: Tests for FluxCD reason mapping and metadata extraction
- `src/__tests__/argocd-mapper.test.js`: Tests for ArgoCD phase mapping and metadata extraction
- `src/__tests__/hmac.test.js`: HMAC verification edge cases
- `src/__tests__/bearer.test.js`: Bearer token verification edge cases
- `src/__tests__/jira.test.js`: Jira API error handling

## Naming Conventions

**Files:**
- Handlers and utilities: `lowercase.js` (e.g., `hmac.js`, `mapper.js`)
- Entry point: `index.js`
- Tests: `{original}.test.js` colocated in `__tests__/` directory
- Configuration: `manifest.yml`, `package.json`, `eslint.config.js`

**Directories:**
- Feature/layer grouping: lowercase plural when needed (e.g., `src/` for source, `docs/` for documentation)
- Test directory: `__tests__/` (Node.js/Jest convention)
- Test resources: `test/`, `test-fixtures/`

**Exports:**
- Function exports use camelCase: `handleFluxEvent`, `verifyHmac`, `extractMetadata`, `buildDeploymentPayload`
- Set constants: `IGNORED_REASONS`, `REASON_TO_STATE`, `PHASE_TO_STATE` (uppercase)

## Where to Add New Code

**New Event Source (e.g., Jenkins webhooks):**
- Primary code: `src/jenkins-mapper.js` (extractMetadata, buildDeploymentPayload, reason-to-state mapping)
- Verification: `src/jenkins-verify.js` (webhook signature verification)
- Tests: `src/__tests__/jenkins-mapper.test.js`, `src/__tests__/jenkins-verify.test.js`
- Entry point: Add `handleJenkinsEvent` export to `src/index.js`
- Configuration: Add webtrigger module and function binding to `manifest.yml`

**New Shared Utility:**
- Location: `src/shared.js` (add function to existing file)
- Tests: Add test case to `src/__tests__/jira.test.js` or create new `src/__tests__/shared.test.js` if substantial

**New Transformation Logic:**
- Within existing mappers: Add helper function to `src/mapper.js` or `src/argocd-mapper.js`
- Tests: Add describe block in corresponding test file

## Special Directories

**node_modules/:**
- Purpose: Installed dependencies (@forge/api, Jest, ESLint)
- Generated: Yes (npm install)
- Committed: No (gitignored)

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by GSD orchestrator)
- Committed: Yes (reference documentation)

**docs/plans/:**
- Purpose: GSD phase implementation plans
- Generated: Yes (by /gsd:plan-phase)
- Committed: Yes (project history)

---

*Structure analysis: 2026-03-11*
