# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- Kebab-case for module files: `hmac.js`, `bearer.js`, `mapper.js`, `jira.js`, `argocd-mapper.js`, `shared.js`
- Test files mirror source names with `.test.js` suffix: `hmac.test.js`, `index.test.js`, `mapper.test.js`
- Tests colocated in `src/__tests__/` directory

**Functions:**
- camelCase for all function names: `verifyHmac()`, `submitDeployment()`, `extractMetadata()`, `buildDeploymentPayload()`, `mapReasonToState()`, `deterministicId()`, `parseIssueKeys()`
- Utility functions are pure and descriptive: `mapPhaseToState()`, `mapReasonToState()`

**Variables:**
- camelCase for local variables and parameters: `body`, `signature`, `secret`, `meta`, `fluxEvent`, `argoEvent`, `issueKeys`
- CONSTANT_CASE for Set and Map constants: `IGNORED_REASONS`, `REASON_TO_STATE`, `PHASE_TO_STATE`
- Descriptive names for event payloads: `validFluxEvent`, `validArgoPayload`, `basePayload`
- Shortened forms when context is clear: `meta`, `seqNum`, `d` (for deployment in payload)

**Types:**
- No TypeScript—native JS with JSDoc for critical functions
- Object properties match external API specs: `deploymentSequenceNumber`, `updateSequenceNumber`, `associationType`, `providerMetadata`

## Code Style

**Formatting:**
- 2-space indentation (ESLint recommended config in `eslint.config.js`)
- No semicolons enforced (ESLint default `@eslint/js` config)
- Single quotes for strings (consistent across all code)
- Line length typically 80-100 characters

**Linting:**
- ESLint with `@eslint/js` recommended config
- Run via: `npm run lint` (lints `src/` only)
- Custom rule: `'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]` — underscore-prefixed parameters are allowed (used for unused callback parameters like `_healthStatus`)

## Import Organization

**Order:**
1. Node.js built-ins: `import { createHmac, timingSafeEqual } from 'node:crypto';`
2. External packages: `import api, { route } from '@forge/api';` or `import { describe, test, expect } from '@jest/globals';`
3. Local modules: `import { verifyHmac } from './hmac.js';`

**Path Aliases:**
- No aliases used; relative paths with explicit `.js` extensions
- All imports use `.js` extension (ESM requirement, enforced in `package.json` with `"type": "module"`)

**Special patterns:**
- Test setup uses dynamic imports after `jest.unstable_mockModule()`: `const { handleFluxEvent } = await import('../index.js');`
- Mocks must be set up before importing the module under test

## Error Handling

**Patterns:**
- Synchronous validation returns boolean: `verifyHmac()`, `verifyBearerToken()` return `true` or `false`
- HTTP-style handlers return `{ statusCode, body, headers? }`: consistent across `handleFluxEvent()` and `handleArgoEvent()`
- Validation errors return specific status codes:
  - `401` for auth failures (invalid HMAC, invalid bearer token)
  - `400` for malformed input (invalid JSON, missing required annotations)
  - `204` for skipped events (missing jira annotation, ignored reasons)
  - `502` for upstream failures (Jira API error)
- API errors wrapped in `Error()` with descriptive message: `throw new Error(\`Jira API error (${response.status}): ${errorText}\`)`
- Warnings logged via `console.warn()`: auth failures, rejected deployments
- Info logged via `console.info()`: skipped events, ignored reasons
- Errors logged via `console.error()`: API failures

## Logging

**Framework:** Native `console` (no external logger)

**Patterns:**
- Warnings for security or rejection events: `console.warn('HMAC verification failed')`
- Info for expected non-errors: `console.info('No jira annotation — skipping', { name: meta.helmReleaseName })`
- Errors for unexpected failures: `console.error('Jira API call failed', err.message)`
- Log objects with context: `{ name: meta.helmReleaseName }`, `{ reason: fluxEvent.reason }`

## Comments

**When to Comment:**
- Explain "why" not "what": `// Take first 8 hex chars → fits in a 32-bit int range`
- Document edge cases and compatibility: `// Flux strips annotation prefixes in webhook payloads`
- Provide format specifications: `// Expects signature in format: sha256=<hex>`
- Step-by-step control flow in handlers (numbered 1-6): `// 1. Verify HMAC`, `// 2. Parse body`

**JSDoc/TSDoc:**
- Used for exported functions with security or complexity implications
- Example from `hmac.js`:
```javascript
/**
 * Verify FluxCD generic-hmac X-Signature header.
 * Expects signature in format: sha256=<hex>
 */
export function verifyHmac(body, signature, secret) { ... }
```
- Not used for self-documenting pure functions like `mapReasonToState()`

## Function Design

**Size:** Small, focused functions (longest ~30 lines)
- `verifyHmac()`: 14 lines
- `buildDeploymentPayload()`: 33 lines
- `handleFluxEvent()`: 45 lines (includes orchestration comments)

**Parameters:**
- Named parameters, no object destructuring for simple functions
- Complex data passed as objects with clear structure: `event = { body, headers, method }`
- Optional parameters given default values inline: `meta = extractMetadata(event)` when `meta` is null

**Return Values:**
- Explicit returns; no implicit undefined
- Consistent return shapes for HTTP handlers: always `{ statusCode, body, headers? }`
- Pure functions return transformed data: `mapReasonToState()` returns a string, `extractMetadata()` returns an object with named properties

## Module Design

**Exports:**
- Named exports only (no default exports for modules, but test files import ESM-style)
- One primary export per file typically: `export function verifyHmac()`, `export async function submitDeployment()`
- Some files export multiple related functions: `mapper.js` exports `mapReasonToState()`, `extractMetadata()`, `buildDeploymentPayload()`, and a constant `IGNORED_REASONS`

**Barrel Files:**
- Not used; imports are explicit from source modules

## Null/Undefined Handling

**Patterns:**
- Falsy checks with `??` (nullish coalescing) for defaults: `const secret = process.env.WEBHOOK_SECRET;` then check `if (!secret)`
- Provide sensible defaults: `envType: ... ?? 'unmapped'`, `chartVersion: ... ?? 'unknown'`, `url: ... ?? ''`
- Return `null` for missing required fields: `issueKeys: parseIssueKeys(...) // returns null if not found`
- Return empty arrays for parsed collections that exist but are empty: `return raw.split(',').map(...).filter(Boolean)` — filters empty strings

---

*Convention analysis: 2026-03-11*
