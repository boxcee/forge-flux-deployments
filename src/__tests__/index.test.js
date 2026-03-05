import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { createHmac } from 'node:crypto';

const SECRET = 'test-hmac-secret';

function sign(body) {
  return 'sha256=' + createHmac('sha256', SECRET).update(body).digest('hex');
}

// Mock @forge/api
const mockRequestJira = jest.fn();
jest.unstable_mockModule('@forge/api', () => ({
  default: {
    asApp: () => ({ requestJira: mockRequestJira }),
  },
  route: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}));

// Set env vars before import
process.env.WEBHOOK_SECRET = SECRET;
process.env.ARGOCD_WEBHOOK_TOKEN = 'test-argo-token';

const { handleFluxEvent, handleArgoEvent } = await import('../index.js');

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
};

function makeEvent(body) {
  return {
    method: 'POST',
    body,
    headers: { 'x-signature': [sign(body)] },
  };
}

describe('handleFluxEvent', () => {
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

  test('returns 401 for invalid HMAC', async () => {
    const event = {
      method: 'POST',
      body: JSON.stringify(validFluxEvent),
      headers: { 'x-signature': ['sha256=invalid'] },
    };
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(401);
  });

  test('returns 400 for malformed JSON', async () => {
    const body = 'not json';
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(400);
  });

  test('returns 204 when jira annotation missing', async () => {
    const noJira = { ...validFluxEvent, metadata: { ...validFluxEvent.metadata } };
    delete noJira.metadata['event.toolkit.fluxcd.io/jira'];
    const body = JSON.stringify(noJira);
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(204);
  });

  test('returns 400 when env annotation missing', async () => {
    const noEnv = { ...validFluxEvent, metadata: { ...validFluxEvent.metadata } };
    delete noEnv.metadata['event.toolkit.fluxcd.io/env'];
    const body = JSON.stringify(noEnv);
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(400);
  });

  test('returns 204 for ignored reasons', async () => {
    const uninstall = { ...validFluxEvent, reason: 'UninstallSucceeded' };
    const body = JSON.stringify(uninstall);
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(204);
  });

  test('returns 200 and calls Jira API on valid event', async () => {
    const body = JSON.stringify(validFluxEvent);
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(200);
    expect(mockRequestJira).toHaveBeenCalledTimes(1);
  });

  test('returns 502 when Jira API fails', async () => {
    mockRequestJira.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    const body = JSON.stringify(validFluxEvent);
    const event = makeEvent(body);
    const result = await handleFluxEvent(event);
    expect(result.statusCode).toBe(502);
  });
});

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
