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
