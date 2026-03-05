# ArgoCD Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ArgoCD as a second deployment source alongside FluxCD, with its own webtrigger endpoint, bearer token auth, mapper, and Jira deployment provider.

**Architecture:** Two separate webtrigger endpoints route to source-specific handlers. Each handler authenticates differently (HMAC vs bearer token) and uses its own mapper, but both produce the same Jira Deployments API payload structure consumed by the shared `jira.js`.

**Tech Stack:** Node.js 22, ESM, Forge webtriggers, Jest (native ESM), `@forge/api`

---

### Task 1: Bearer Token Auth Module

**Files:**
- Create: `src/bearer.js`
- Test: `src/__tests__/bearer.test.js`

**Step 1: Write the failing test**

```js
// src/__tests__/bearer.test.js
import { describe, test, expect } from '@jest/globals';
import { verifyBearerToken } from '../bearer.js';

describe('verifyBearerToken', () => {
  const TOKEN = 'my-secret-token';

  test('returns true for valid bearer token', () => {
    expect(verifyBearerToken('Bearer my-secret-token', TOKEN)).toBe(true);
  });

  test('returns false for wrong token', () => {
    expect(verifyBearerToken('Bearer wrong-token', TOKEN)).toBe(false);
  });

  test('returns false for missing Bearer prefix', () => {
    expect(verifyBearerToken('my-secret-token', TOKEN)).toBe(false);
  });

  test('returns false for undefined header', () => {
    expect(verifyBearerToken(undefined, TOKEN)).toBe(false);
  });

  test('returns false for empty header', () => {
    expect(verifyBearerToken('', TOKEN)).toBe(false);
  });

  test('returns false for undefined secret', () => {
    expect(verifyBearerToken('Bearer my-secret-token', undefined)).toBe(false);
  });

  test('returns false for empty secret', () => {
    expect(verifyBearerToken('Bearer my-secret-token', '')).toBe(false);
  });

  test('uses timing-safe comparison', () => {
    // Verify it doesn't fail on length mismatch (should return false, not throw)
    expect(verifyBearerToken('Bearer short', 'a-much-longer-token-value')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='bearer'`
Expected: FAIL — cannot find module `../bearer.js`

**Step 3: Write minimal implementation**

```js
// src/bearer.js
import { timingSafeEqual } from 'node:crypto';

export function verifyBearerToken(header, secret) {
  if (!secret || !header || !header.startsWith('Bearer ')) {
    return false;
  }

  const token = header.slice(7); // strip "Bearer "
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);

  if (tokenBuf.length !== secretBuf.length) {
    return false;
  }

  return timingSafeEqual(tokenBuf, secretBuf);
}
```

**Step 4: Run test to verify it passes**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='bearer'`
Expected: All 8 tests PASS

**Step 5: Commit**

```bash
git add src/bearer.js src/__tests__/bearer.test.js
git commit -m "feat: add bearer token auth module for ArgoCD webhooks"
```

---

### Task 2: ArgoCD Mapper

**Files:**
- Create: `src/argocd-mapper.js`
- Test: `src/__tests__/argocd-mapper.test.js`

**Step 1: Write the failing tests**

```js
// src/__tests__/argocd-mapper.test.js
import { describe, test, expect } from '@jest/globals';
import {
  mapPhaseToState,
  extractMetadata,
  buildDeploymentPayload,
  IGNORED_PHASES,
} from '../argocd-mapper.js';

describe('mapPhaseToState', () => {
  test.each([
    ['Succeeded', 'Healthy', 'successful'],
    ['Succeeded', 'Degraded', 'successful'],
    ['Failed', 'Degraded', 'failed'],
    ['Failed', 'Healthy', 'failed'],
    ['Error', 'Degraded', 'failed'],
    ['Error', 'Unknown', 'failed'],
    ['Running', 'Progressing', 'in_progress'],
    ['Running', 'Healthy', 'in_progress'],
    ['', 'Unknown', 'unknown'],
    ['SomethingNew', 'Healthy', 'unknown'],
  ])('maps phase=%s health=%s to %s', (phase, health, expected) => {
    expect(mapPhaseToState(phase, health)).toBe(expected);
  });
});

describe('IGNORED_PHASES', () => {
  test('is empty by default (no ArgoCD phases are ignored yet)', () => {
    expect(IGNORED_PHASES.size).toBe(0);
  });
});

describe('extractMetadata', () => {
  const basePayload = {
    app: 'my-service',
    namespace: 'production',
    revision: 'a1b2c3d4e5f6',
    phase: 'Succeeded',
    healthStatus: 'Healthy',
    message: 'successfully synced',
    finishedAt: '2026-03-05T12:00:00Z',
    annotations: {
      jira: 'PROJ-123,PROJ-456',
      env: 'production',
      envType: 'production',
      url: 'https://argocd.example.com/applications/my-service',
    },
  };

  test('extracts issue keys as array', () => {
    expect(extractMetadata(basePayload).issueKeys).toEqual(['PROJ-123', 'PROJ-456']);
  });

  test('extracts single issue key', () => {
    const payload = { ...basePayload, annotations: { ...basePayload.annotations, jira: 'PROJ-123' } };
    expect(extractMetadata(payload).issueKeys).toEqual(['PROJ-123']);
  });

  test('returns null issueKeys when jira annotation missing', () => {
    const payload = { ...basePayload, annotations: { ...basePayload.annotations } };
    delete payload.annotations.jira;
    expect(extractMetadata(payload).issueKeys).toBeNull();
  });

  test('extracts environment', () => {
    const result = extractMetadata(basePayload);
    expect(result.env).toBe('production');
    expect(result.envType).toBe('production');
  });

  test('defaults envType to unmapped', () => {
    const payload = { ...basePayload, annotations: { ...basePayload.annotations } };
    delete payload.annotations.envType;
    expect(extractMetadata(payload).envType).toBe('unmapped');
  });

  test('returns null env when annotation missing', () => {
    const payload = { ...basePayload, annotations: { ...basePayload.annotations } };
    delete payload.annotations.env;
    expect(extractMetadata(payload).env).toBeNull();
  });

  test('extracts revision', () => {
    expect(extractMetadata(basePayload).revision).toBe('a1b2c3d4e5f6');
  });

  test('extracts url', () => {
    expect(extractMetadata(basePayload).url).toBe('https://argocd.example.com/applications/my-service');
  });

  test('url defaults to empty string', () => {
    const payload = { ...basePayload, annotations: { ...basePayload.annotations } };
    delete payload.annotations.url;
    expect(extractMetadata(payload).url).toBe('');
  });

  test('extracts appName and namespace', () => {
    const result = extractMetadata(basePayload);
    expect(result.appName).toBe('my-service');
    expect(result.namespace).toBe('production');
  });

  test('handles missing annotations object', () => {
    const payload = { ...basePayload };
    delete payload.annotations;
    expect(extractMetadata(payload).issueKeys).toBeNull();
    expect(extractMetadata(payload).env).toBeNull();
  });
});

describe('buildDeploymentPayload', () => {
  const argoPayload = {
    app: 'my-service',
    namespace: 'production',
    revision: 'a1b2c3d4e5f6',
    phase: 'Succeeded',
    healthStatus: 'Healthy',
    message: 'successfully synced',
    finishedAt: '2026-03-05T12:00:00Z',
    annotations: {
      jira: 'PROJ-123,PROJ-456',
      env: 'production',
      envType: 'production',
      url: 'https://argocd.example.com/applications/my-service',
    },
  };

  test('builds valid deployment payload structure', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result).toHaveProperty('deployments');
    expect(result.deployments).toHaveLength(1);
    expect(result).toHaveProperty('providerMetadata.product', 'ArgoCD');
  });

  test('sets state from phase and health', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].state).toBe('successful');
  });

  test('sets associations with issue keys', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].associations).toEqual([
      { associationType: 'issueIdOrKeys', values: ['PROJ-123', 'PROJ-456'] },
    ]);
  });

  test('sets pipeline from app name', () => {
    const result = buildDeploymentPayload(argoPayload);
    const d = result.deployments[0];
    expect(d.pipeline.id).toBe('my-service');
    expect(d.pipeline.displayName).toBe('my-service');
  });

  test('sets environment from annotations', () => {
    const result = buildDeploymentPayload(argoPayload);
    const d = result.deployments[0];
    expect(d.environment.id).toBe('production');
    expect(d.environment.displayName).toBe('production');
    expect(d.environment.type).toBe('production');
  });

  test('sets label to short revision (first 7 chars)', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].label).toBe('a1b2c3d');
  });

  test('sets displayName as "{app} {shortRevision} to {env}"', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].displayName).toBe('my-service a1b2c3d to production');
  });

  test('sets description from message', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].description).toBe('successfully synced');
  });

  test('sets lastUpdated from finishedAt', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].lastUpdated).toBe('2026-03-05T12:00:00Z');
  });

  test('deploymentSequenceNumber is deterministic', () => {
    const a = buildDeploymentPayload(argoPayload);
    const b = buildDeploymentPayload(argoPayload);
    expect(a.deployments[0].deploymentSequenceNumber)
      .toBe(b.deployments[0].deploymentSequenceNumber);
  });

  test('deploymentSequenceNumber differs for different events', () => {
    const other = { ...argoPayload, finishedAt: '2026-03-05T13:00:00Z' };
    const a = buildDeploymentPayload(argoPayload);
    const b = buildDeploymentPayload(other);
    expect(a.deployments[0].deploymentSequenceNumber)
      .not.toBe(b.deployments[0].deploymentSequenceNumber);
  });

  test('url comes from annotations', () => {
    const result = buildDeploymentPayload(argoPayload);
    expect(result.deployments[0].url).toBe('https://argocd.example.com/applications/my-service');
    expect(result.deployments[0].pipeline.url).toBe('https://argocd.example.com/applications/my-service');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='argocd-mapper'`
Expected: FAIL — cannot find module `../argocd-mapper.js`

**Step 3: Write minimal implementation**

```js
// src/argocd-mapper.js
import { createHash } from 'node:crypto';

const PHASE_TO_STATE = {
  Succeeded: 'successful',
  Failed: 'failed',
  Error: 'failed',
  Running: 'in_progress',
};

export const IGNORED_PHASES = new Set([]);

export function mapPhaseToState(phase, _healthStatus) {
  return PHASE_TO_STATE[phase] ?? 'unknown';
}

export function extractMetadata(payload) {
  const annotations = payload.annotations ?? {};

  const jiraRaw = annotations.jira ?? null;
  const issueKeys = jiraRaw
    ? jiraRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : null;

  return {
    issueKeys,
    env: annotations.env ?? null,
    envType: annotations.envType ?? 'unmapped',
    revision: payload.revision ?? null,
    url: annotations.url ?? '',
    appName: payload.app ?? 'unknown',
    namespace: payload.namespace ?? 'default',
  };
}

function deterministicId(name, namespace, revision, timestamp) {
  const input = `${name}:${namespace}:${revision}:${timestamp}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

export function buildDeploymentPayload(argoPayload) {
  const meta = extractMetadata(argoPayload);
  const state = mapPhaseToState(argoPayload.phase, argoPayload.healthStatus);
  const shortRevision = (meta.revision ?? 'unknown').substring(0, 7);

  const seqNum = deterministicId(
    meta.appName,
    meta.namespace,
    meta.revision ?? 'unknown',
    argoPayload.finishedAt
  );

  return {
    deployments: [
      {
        schemaVersion: '1.0',
        deploymentSequenceNumber: seqNum,
        updateSequenceNumber: new Date(argoPayload.finishedAt).getTime(),
        displayName: `${meta.appName} ${shortRevision} to ${meta.env}`,
        url: meta.url,
        description: argoPayload.message ?? '',
        lastUpdated: argoPayload.finishedAt,
        label: shortRevision,
        state,
        pipeline: {
          id: meta.appName,
          displayName: meta.appName,
          url: meta.url,
        },
        environment: {
          id: meta.env,
          displayName: meta.env,
          type: meta.envType,
        },
        associations: [
          {
            associationType: 'issueIdOrKeys',
            values: meta.issueKeys,
          },
        ],
      },
    ],
    providerMetadata: {
      product: 'ArgoCD',
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='argocd-mapper'`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/argocd-mapper.js src/__tests__/argocd-mapper.test.js
git commit -m "feat: add ArgoCD mapper for deployment payload building"
```

---

### Task 3: ArgoCD Handler in index.js

**Files:**
- Modify: `src/index.js`
- Test: `src/__tests__/index.test.js`

**Step 1: Write the failing tests**

Add to `src/__tests__/index.test.js` — after the existing `handleFluxEvent` import and tests:

```js
// At the top, add to the env setup (before imports):
process.env.ARGOCD_WEBHOOK_TOKEN = 'test-argo-token';

// After the existing dynamic import line, add:
const { handleArgoEvent } = await import('../index.js');

// Add new describe block after the existing one:
const validArgoPayload = {
  app: 'my-service',
  namespace: 'production',
  revision: 'a1b2c3d4e5f6',
  phase: 'Succeeded',
  healthStatus: 'Healthy',
  message: 'successfully synced',
  finishedAt: '2026-03-05T12:00:00Z',
  annotations: {
    jira: 'PROJ-123',
    env: 'production',
    envType: 'production',
    url: 'https://argocd.example.com/applications/my-service',
  },
};

function makeArgoEvent(body) {
  return {
    method: 'POST',
    body,
    headers: { authorization: ['Bearer test-argo-token'] },
  };
}

describe('handleArgoEvent', () => {
  beforeEach(() => {
    mockRequestJira.mockReset();
    mockRequestJira.mockResolvedValue({
      ok: true,
      json: async () => ({
        acceptedDeployments: [{}],
        rejectedDeployments: [],
        unknownIssueKeys: [],
      }),
    });
  });

  test('returns 401 for invalid bearer token', async () => {
    const event = {
      method: 'POST',
      body: JSON.stringify(validArgoPayload),
      headers: { authorization: ['Bearer wrong-token'] },
    };
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(401);
  });

  test('returns 401 for missing authorization header', async () => {
    const event = {
      method: 'POST',
      body: JSON.stringify(validArgoPayload),
      headers: {},
    };
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(401);
  });

  test('returns 400 for malformed JSON', async () => {
    const event = makeArgoEvent('not json');
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(400);
  });

  test('returns 204 when jira annotation missing', async () => {
    const noJira = { ...validArgoPayload, annotations: { ...validArgoPayload.annotations } };
    delete noJira.annotations.jira;
    const body = JSON.stringify(noJira);
    const event = makeArgoEvent(body);
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(204);
  });

  test('returns 400 when env annotation missing', async () => {
    const noEnv = { ...validArgoPayload, annotations: { ...validArgoPayload.annotations } };
    delete noEnv.annotations.env;
    const body = JSON.stringify(noEnv);
    const event = makeArgoEvent(body);
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(400);
  });

  test('returns 200 and calls Jira API on valid event', async () => {
    const body = JSON.stringify(validArgoPayload);
    const event = makeArgoEvent(body);
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(200);
    expect(mockRequestJira).toHaveBeenCalledTimes(1);
  });

  test('returns 502 when Jira API fails', async () => {
    mockRequestJira.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    const body = JSON.stringify(validArgoPayload);
    const event = makeArgoEvent(body);
    const result = await handleArgoEvent(event);
    expect(result.statusCode).toBe(502);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='index'`
Expected: FAIL — `handleArgoEvent` is not exported

**Step 3: Write minimal implementation**

Add to `src/index.js`:

```js
import { verifyBearerToken } from './bearer.js';
import { extractMetadata as extractArgoMetadata, buildDeploymentPayload as buildArgoPayload } from './argocd-mapper.js';

export const handleArgoEvent = async (event) => {
  // 1. Verify bearer token
  const authHeader = (event.headers?.['authorization'] ?? [])[0];
  const token = process.env.ARGOCD_WEBHOOK_TOKEN;

  if (!verifyBearerToken(authHeader, token)) {
    console.warn('Bearer token verification failed');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 2. Parse body
  let argoEvent;
  try {
    argoEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 3. Extract metadata and check issue keys
  const meta = extractArgoMetadata(argoEvent);
  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta.appName });
    return { statusCode: 204, body: '' };
  }

  // 4. Check environment
  if (!meta.env) {
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 5. Build and submit
  const payload = buildArgoPayload(argoEvent);

  try {
    const result = await submitDeployment(payload);

    if (result.rejectedDeployments?.length > 0) {
      console.warn('Rejected deployments', result.rejectedDeployments);
    }
    if (result.unknownIssueKeys?.length > 0) {
      console.warn('Unknown issue keys', result.unknownIssueKeys);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': ['application/json'] },
      body: JSON.stringify({ accepted: result.acceptedDeployments?.length ?? 0 }),
    };
  } catch (err) {
    console.error('Jira API call failed', err.message);
    return { statusCode: 502, body: 'Upstream API error' };
  }
};
```

**Step 4: Run test to verify it passes**

Run: `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='index'`
Expected: All tests PASS (both Flux and Argo)

**Step 5: Commit**

```bash
git add src/index.js src/__tests__/index.test.js
git commit -m "feat: add handleArgoEvent handler with bearer token auth"
```

---

### Task 4: Update Manifest

**Files:**
- Modify: `manifest.yml`

**Step 1: Update manifest with ArgoCD webtrigger, function, and provider**

```yaml
modules:
  webtrigger:
    - key: flux-webhook
      function: handleFluxEvent
      response:
        type: dynamic
    - key: argo-webhook
      function: handleArgoEvent
      response:
        type: dynamic

  devops:deploymentInfoProvider:
    - key: flux-deployment-provider
      name:
        value: FluxCD Deployments
      homeUrl: https://fluxcd.io
      logoUrl: https://raw.githubusercontent.com/fluxcd/website/main/static/img/flux-icon.svg
      documentationUrl: https://fluxcd.io/flux/components/notification/
    - key: argo-deployment-provider
      name:
        value: ArgoCD Deployments
      homeUrl: https://argoproj.github.io/cd/
      logoUrl: https://raw.githubusercontent.com/argoproj/argo-cd/master/docs/assets/logo.png
      documentationUrl: https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/

  function:
    - key: handleFluxEvent
      handler: index.handleFluxEvent
    - key: handleArgoEvent
      handler: index.handleArgoEvent

permissions:
  scopes:
    - write:deployment-info:jira
    - write:deployment:jira-software
    - read:deployment:jira-software

app:
  runtime:
    name: nodejs22.x
  id: ari:cloud:ecosystem::app/68338fcf-dcfc-42e0-bfdd-84f903daf321
```

**Step 2: Run all tests to confirm nothing broke**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add manifest.yml
git commit -m "feat: add ArgoCD webtrigger, function, and deployment provider to manifest"
```

---

### Task 5: Update README with ArgoCD Setup

**Files:**
- Modify: `README.md`

**Step 1: Add ArgoCD section to README**

After the FluxCD E2E section, add:

```markdown
## ArgoCD Integration

### 1. Set the bearer token in Forge

```bash
forge variables set --environment development ARGOCD_WEBHOOK_TOKEN '<your-token>'
```

### 2. Get the ArgoCD webtrigger URL

```bash
forge webtrigger create --functionKey argo-webhook
```

### 3. Configure ArgoCD Notifications

Add the webhook service and template to your `argocd-notifications-cm` ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.webhook.jira-deployments: |
    url: <argo-webhook-webtrigger-url>
    headers:
      - name: Authorization
        value: Bearer <your-token>
      - name: Content-Type
        value: application/json

  template.jira-deployment: |
    webhook:
      jira-deployments:
        method: POST
        body: |
          {
            "app": "{{.app.metadata.name}}",
            "namespace": "{{.app.spec.destination.namespace}}",
            "revision": "{{.app.status.sync.revision}}",
            "phase": "{{.app.status.operationState.phase}}",
            "healthStatus": "{{.app.status.health.status}}",
            "message": "{{.app.status.operationState.message}}",
            "finishedAt": "{{.app.status.operationState.finishedAt}}",
            "annotations": {
              "jira": "{{index .app.metadata.annotations \"jira\"}}",
              "env": "{{index .app.metadata.annotations \"env\"}}",
              "envType": "{{index .app.metadata.annotations \"envType\"}}",
              "url": "{{index .app.metadata.annotations \"url\"}}"
            }
          }

  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'
      oncePer: app.status.sync.revision
      send: [jira-deployment]

  trigger.on-sync-failed: |
    - when: app.status.operationState.phase in ['Error', 'Failed']
      send: [jira-deployment]
```

### 4. Annotate your ArgoCD Application

| Annotation | Required | Description |
|---|---|---|
| `jira` | Yes | Comma-separated Jira issue keys (e.g., `PROJ-123,PROJ-456`) |
| `env` | Yes | Environment name (e.g., `staging`, `production`) |
| `envType` | No | Jira environment type: `unmapped`, `development`, `testing`, `staging`, `production` (default: `unmapped`) |
| `url` | Yes | URL shown in the Jira deployment record |

```bash
kubectl annotate application <name> -n argocd \
  jira='PROJ-123' \
  env='production' \
  envType='production' \
  url='https://argocd.example.com/applications/my-app'
```

### 5. Subscribe the Application to triggers

```bash
kubectl annotate application <name> -n argocd \
  notifications.argoproj.io/subscribe.on-deployed.jira-deployments="" \
  notifications.argoproj.io/subscribe.on-sync-failed.jira-deployments=""
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add ArgoCD integration setup instructions"
```

---

### Task 6: Add ArgoCD Test Fixtures

**Files:**
- Create: `test-fixtures/argo-sync-succeeded.json`
- Create: `test-fixtures/argo-sync-failed.json`

**Step 1: Create test fixtures**

```json
// test-fixtures/argo-sync-succeeded.json
{
  "app": "my-service",
  "namespace": "production",
  "revision": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  "phase": "Succeeded",
  "healthStatus": "Healthy",
  "message": "successfully synced (all tasks run)",
  "finishedAt": "2026-03-05T12:00:00Z",
  "annotations": {
    "jira": "PROJ-123,PROJ-456",
    "env": "production",
    "envType": "production",
    "url": "https://argocd.example.com/applications/my-service"
  }
}
```

```json
// test-fixtures/argo-sync-failed.json
{
  "app": "my-service",
  "namespace": "staging",
  "revision": "deadbeef1234567890abcdef1234567890abcdef",
  "phase": "Failed",
  "healthStatus": "Degraded",
  "message": "ComparisonError: failed to sync: resource my-service/Deployment not found",
  "finishedAt": "2026-03-05T12:05:00Z",
  "annotations": {
    "jira": "PROJ-789",
    "env": "staging",
    "envType": "staging",
    "url": "https://argocd.example.com/applications/my-service"
  }
}
```

**Step 2: Commit**

```bash
git add test-fixtures/argo-sync-succeeded.json test-fixtures/argo-sync-failed.json
git commit -m "test: add ArgoCD webhook test fixtures"
```

---

### Task 7: Run Full Test Suite and Verify

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS (existing Flux tests + new Argo tests)

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors
