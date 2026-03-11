# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Jest 29.7.0 (native ESM support with experimental flag)
- Config: `package.json` (no separate jest.config.js)

**Assertion Library:**
- `@jest/globals` (built-in with Jest)

**Run Commands:**
```bash
npm test                                                                            # Run all tests
node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>' # Run single test file
npm run lint                                                                        # ESLint (separate from tests)
```

## Test File Organization

**Location:**
- Co-located in `src/__tests__/` directory
- Tests run against live source modules (no build step)

**Naming:**
- Mirror source file names: `mapper.js` → `mapper.test.js`, `index.js` → `index.test.js`

**Structure:**
```
src/
├── index.js
├── hmac.js
├── bearer.js
├── mapper.js
├── jira.js
├── shared.js
└── __tests__/
    ├── index.test.js       # Tests both handleFluxEvent and handleArgoEvent
    ├── hmac.test.js
    ├── bearer.test.js
    ├── mapper.test.js
    ├── jira.test.js
    └── argocd-mapper.test.js
```

## Test Structure

**Suite Organization:**
```javascript
import { describe, test, expect, jest, beforeEach } from '@jest/globals'

describe('functionName', () => {
  beforeEach(() => {
    // Setup: reset mocks, initialize state
    mockRequestJira.mockReset()
  })

  test('should do X when Y', () => {
    // Arrange
    const input = { ... }

    // Act
    const result = function(input)

    // Expect
    expect(result).toBe(expected)
  })

  test('should handle error case', () => {
    // Similar structure
  })
})
```

**Patterns:**
- `beforeEach()` resets mocks before each test
- Test names follow "should/returns X when Y" or "should handle Z"
- No `afterEach()` cleanup needed (Jest resets between tests by default)
- Assertion library is Jest built-ins: `expect()`, `toBe()`, `toEqual()`, `toHaveBeenCalled()`, etc.

## Mocking

**Framework:** Jest's `jest.unstable_mockModule()` (experimental ESM support)

**Patterns:**
```javascript
// Must happen BEFORE any import of the module under test
const mockRequestJira = jest.fn()
jest.unstable_mockModule('@forge/api', () => ({
  default: {
    asApp: () => ({ requestJira: mockRequestJira }),
  },
  route: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}))

// Then import the module
const { submitDeployment } = await import('../jira.js')
```

**Setup pattern for environment variables:**
```javascript
process.env.WEBHOOK_SECRET = SECRET
process.env.ARGOCD_WEBHOOK_TOKEN = 'test-argo-token'
```

**What to Mock:**
- External APIs: `@forge/api` (Jira request)
- I/O operations: API calls via `requestJira()`
- Date/time (not done in this codebase, but would use `jest.useFakeTimers()`)

**What NOT to Mock:**
- Pure utility functions: `mapReasonToState()`, `parseIssueKeys()`, `deterministicId()`
- Crypto operations: `createHmac()`, `timingSafeEqual()` (test with real values)
- JSON parsing: test with real valid and invalid JSON strings

**Mock reset pattern:**
```javascript
beforeEach(() => {
  mockRequestJira.mockReset()
  mockRequestJira.mockResolvedValue({
    ok: true,
    json: async () => ({ acceptedDeployments: [{}], ... })
  })
})
```

## Fixtures and Test Data

**Test Data:**
```javascript
// Reusable event fixtures
const validFluxEvent = {
  involvedObject: { name: 'my-app', namespace: 'production' },
  metadata: {
    'event.toolkit.fluxcd.io/jira': 'DPS-123',
    'event.toolkit.fluxcd.io/env': 'production',
    'event.toolkit.fluxcd.io/env-type': 'production',
    'helm.toolkit.fluxcd.io/chart-version': '1.4.2',
  },
  reason: 'UpgradeSucceeded',
  message: 'Helm upgrade succeeded',
  timestamp: '2026-03-03T14:00:00Z',
}

// Reusable payload builders
function makeEvent(body) {
  return {
    method: 'POST',
    body,
    headers: { 'x-signature': [sign(body)] },
  }
}
```

**Location:**
- Test data defined at module scope (top-level in test file)
- Reused across multiple `describe()` blocks
- Variations created via spread operator: `{ ...validFluxEvent, reason: 'UninstallSucceeded' }`

## Coverage

**Requirements:** Not enforced (no coverage thresholds in jest config)

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and their return values
- Approach: Test both happy path and error conditions
- Examples from `mapper.test.js`:
  - Test `mapReasonToState()` with multiple input/output pairs using `test.each()`
  - Test `extractMetadata()` with full and short keys (Flux annotation stripping behavior)
  - Test `buildDeploymentPayload()` structure and field mapping

**Integration Tests:**
- Scope: HTTP handler orchestration (HMAC verification → parsing → extraction → submission)
- Approach: Mock external API (`@forge/api`), test the full flow
- Examples from `index.test.js`:
  - Valid event flows through to Jira API call
  - HMAC verification failure returns 401
  - Missing annotations return 204
  - API errors return 502

**E2E Tests:**
- Not used—integration tests via mocked `@forge/api` cover the main flows

## Common Patterns

**Async Testing:**
```javascript
test('returns 200 and calls Jira API on valid event', async () => {
  mockRequestJira.mockResolvedValue({
    ok: true,
    json: async () => ({ acceptedDeployments: [{}], ... }),
  })

  const result = await handleFluxEvent(event)
  expect(result.statusCode).toBe(200)
  expect(mockRequestJira).toHaveBeenCalledTimes(1)
})
```

**Error Testing:**
```javascript
test('throws on non-ok response', async () => {
  mockRequestJira.mockResolvedValue({
    ok: false,
    status: 400,
    text: async () => 'Bad Request',
  })

  await expect(submitDeployment(payload)).rejects.toThrow(
    'Jira API error (400): Bad Request'
  )
})
```

**Mocking async responses:**
```javascript
mockRequestJira.mockResolvedValue({
  ok: true,
  json: async () => ({ ... }),  // async method on response
  text: async () => 'error text',
})
```

**Testing parameterized scenarios:**
```javascript
test.each([
  ['InstallSucceeded', 'successful'],
  ['UpgradeSucceeded', 'successful'],
  ['InstallFailed', 'failed'],
])('maps %s to %s', (reason, expected) => {
  expect(mapReasonToState(reason)).toBe(expected)
})
```

## Test Execution Flow

1. Jest discovers test files in `src/__tests__/*.test.js`
2. Test setup runs: `jest.unstable_mockModule()` configures mocks
3. Environment variables are set: `process.env.WEBHOOK_SECRET = SECRET`
4. Module is imported: `const { handleFluxEvent } = await import('../index.js')`
5. Each `describe()` block runs with its `beforeEach()` setup
6. Tests run sequentially
7. Mocks are reset between tests

## Running Tests

**All tests:**
```bash
npm test
```

**Watch mode:**
```bash
npm test -- --watch
```

**Single file:**
```bash
node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='hmac'
```

**With coverage:**
```bash
npm test -- --coverage
```

---

*Testing analysis: 2026-03-11*
