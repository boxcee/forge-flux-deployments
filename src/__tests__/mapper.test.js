import { describe, test, expect } from '@jest/globals';
import { mapReasonToState, IGNORED_REASONS } from '../mapper.js';
import { extractMetadata } from '../mapper.js';
import { buildDeploymentPayload } from '../mapper.js';

describe('mapReasonToState', () => {
  test.each([
    ['InstallSucceeded', 'successful'],
    ['UpgradeSucceeded', 'successful'],
    ['TestSucceeded', 'successful'],
    ['ReconciliationSucceeded', 'successful'],
  ])('maps %s to %s', (reason, expected) => {
    expect(mapReasonToState(reason)).toBe(expected);
  });

  test.each([
    ['InstallFailed', 'failed'],
    ['UpgradeFailed', 'failed'],
    ['TestFailed', 'failed'],
    ['ReconciliationFailed', 'failed'],
    ['RollbackFailed', 'failed'],
    ['UninstallFailed', 'failed'],
    ['ArtifactFailed', 'failed'],
  ])('maps %s to %s', (reason, expected) => {
    expect(mapReasonToState(reason)).toBe(expected);
  });

  test('maps RollbackSucceeded to rolled_back', () => {
    expect(mapReasonToState('RollbackSucceeded')).toBe('rolled_back');
  });

  test('maps unknown reasons to unknown', () => {
    expect(mapReasonToState('SomethingNew')).toBe('unknown');
  });
});

describe('IGNORED_REASONS', () => {
  test('includes UninstallSucceeded', () => {
    expect(IGNORED_REASONS.has('UninstallSucceeded')).toBe(true);
  });

  test('includes DependencyNotReady', () => {
    expect(IGNORED_REASONS.has('DependencyNotReady')).toBe(true);
  });
});

describe('extractMetadata', () => {
  const baseEvent = {
    involvedObject: { name: 'my-app', namespace: 'production' },
    metadata: {
      'event.toolkit.fluxcd.io/jira': 'DPS-123,DPS-456',
      'event.toolkit.fluxcd.io/env': 'production',
      'event.toolkit.fluxcd.io/env-type': 'production',
      'event.toolkit.fluxcd.io/url': 'https://github.com/org/repo',
      'helm.toolkit.fluxcd.io/chart-version': '1.4.2',
    },
    reason: 'UpgradeSucceeded',
    message: 'Helm upgrade succeeded',
    timestamp: '2026-03-03T14:00:00Z',
  };

  test('extracts issue keys as array', () => {
    const result = extractMetadata(baseEvent);
    expect(result.issueKeys).toEqual(['DPS-123', 'DPS-456']);
  });

  test('extracts single issue key', () => {
    const event = {
      ...baseEvent,
      metadata: { ...baseEvent.metadata, 'event.toolkit.fluxcd.io/jira': 'DPS-123' },
    };
    expect(extractMetadata(event).issueKeys).toEqual(['DPS-123']);
  });

  test('returns null issueKeys when jira annotation missing', () => {
    const event = {
      ...baseEvent,
      metadata: { ...baseEvent.metadata },
    };
    delete event.metadata['event.toolkit.fluxcd.io/jira'];
    expect(extractMetadata(event).issueKeys).toBeNull();
  });

  test('extracts environment', () => {
    const result = extractMetadata(baseEvent);
    expect(result.env).toBe('production');
    expect(result.envType).toBe('production');
  });

  test('defaults envType to unmapped', () => {
    const event = {
      ...baseEvent,
      metadata: { ...baseEvent.metadata },
    };
    delete event.metadata['event.toolkit.fluxcd.io/env-type'];
    expect(extractMetadata(event).envType).toBe('unmapped');
  });

  test('returns null env when annotation missing', () => {
    const event = {
      ...baseEvent,
      metadata: { ...baseEvent.metadata },
    };
    delete event.metadata['event.toolkit.fluxcd.io/env'];
    expect(extractMetadata(event).env).toBeNull();
  });

  test('extracts chart version', () => {
    expect(extractMetadata(baseEvent).chartVersion).toBe('1.4.2');
  });

  test('extracts url from metadata', () => {
    expect(extractMetadata(baseEvent).url).toBe('https://github.com/org/repo');
  });

  test('url defaults to empty string when missing', () => {
    const event = {
      ...baseEvent,
      metadata: { ...baseEvent.metadata },
    };
    delete event.metadata['event.toolkit.fluxcd.io/url'];
    expect(extractMetadata(event).url).toBe('');
  });

  test('extracts helmReleaseName and namespace', () => {
    const result = extractMetadata(baseEvent);
    expect(result.helmReleaseName).toBe('my-app');
    expect(result.namespace).toBe('production');
  });

  describe('short keys (Flux strips annotation prefixes)', () => {
    const shortKeyEvent = {
      involvedObject: { name: 'podinfo', namespace: 'flux-system' },
      metadata: {
        jira: 'KAN-2',
        env: 'test',
        'env-type': 'testing',
        url: 'https://github.com/org/repo',
        revision: '6.6.2',
      },
    };

    test('extracts issue keys from short key', () => {
      expect(extractMetadata(shortKeyEvent).issueKeys).toEqual(['KAN-2']);
    });

    test('extracts env from short key', () => {
      expect(extractMetadata(shortKeyEvent).env).toBe('test');
    });

    test('extracts envType from short key', () => {
      expect(extractMetadata(shortKeyEvent).envType).toBe('testing');
    });

    test('extracts url from short key', () => {
      expect(extractMetadata(shortKeyEvent).url).toBe('https://github.com/org/repo');
    });

    test('extracts chartVersion from revision short key', () => {
      expect(extractMetadata(shortKeyEvent).chartVersion).toBe('6.6.2');
    });

    test('full keys take precedence over short keys', () => {
      const event = {
        involvedObject: { name: 'app', namespace: 'ns' },
        metadata: {
          'event.toolkit.fluxcd.io/jira': 'FULL-1',
          jira: 'SHORT-1',
        },
      };
      expect(extractMetadata(event).issueKeys).toEqual(['FULL-1']);
    });
  });
});

describe('buildDeploymentPayload', () => {
  const fluxEvent = {
    involvedObject: { name: 'my-app', namespace: 'production' },
    metadata: {
      'event.toolkit.fluxcd.io/jira': 'DPS-123,DPS-456',
      'event.toolkit.fluxcd.io/env': 'production',
      'event.toolkit.fluxcd.io/env-type': 'production',
      'event.toolkit.fluxcd.io/url': 'https://github.com/org/repo',
      'helm.toolkit.fluxcd.io/chart-version': '1.4.2',
    },
    reason: 'UpgradeSucceeded',
    message: 'Helm upgrade succeeded for release production/my-app.v3',
    timestamp: '2026-03-03T14:00:00Z',
  };

  test('builds valid deployment payload structure', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result).toHaveProperty('deployments');
    expect(result.deployments).toHaveLength(1);
    expect(result).toHaveProperty('providerMetadata.product', 'FluxCD');
  });

  test('sets state from reason', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].state).toBe('successful');
  });

  test('sets associations with issue keys', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].associations).toEqual([
      { associationType: 'issueIdOrKeys', values: ['DPS-123', 'DPS-456'] },
    ]);
  });

  test('sets pipeline from HelmRelease name', () => {
    const result = buildDeploymentPayload(fluxEvent);
    const d = result.deployments[0];
    expect(d.pipeline.id).toBe('my-app');
    expect(d.pipeline.displayName).toBe('my-app');
  });

  test('sets environment from metadata', () => {
    const result = buildDeploymentPayload(fluxEvent);
    const d = result.deployments[0];
    expect(d.environment.id).toBe('production');
    expect(d.environment.displayName).toBe('production');
    expect(d.environment.type).toBe('production');
  });

  test('sets label to chart version', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].label).toBe('1.4.2');
  });

  test('sets displayName as "{name} {version} to {env}"', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].displayName).toBe('my-app 1.4.2 to production');
  });

  test('sets description from FluxCD message', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].description).toBe(
      'Helm upgrade succeeded for release production/my-app.v3'
    );
  });

  test('sets lastUpdated from timestamp', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].lastUpdated).toBe('2026-03-03T14:00:00Z');
  });

  test('deploymentSequenceNumber is deterministic', () => {
    const a = buildDeploymentPayload(fluxEvent);
    const b = buildDeploymentPayload(fluxEvent);
    expect(a.deployments[0].deploymentSequenceNumber)
      .toBe(b.deployments[0].deploymentSequenceNumber);
  });

  test('deploymentSequenceNumber differs for different events', () => {
    const other = { ...fluxEvent, timestamp: '2026-03-03T15:00:00Z' };
    const a = buildDeploymentPayload(fluxEvent);
    const b = buildDeploymentPayload(other);
    expect(a.deployments[0].deploymentSequenceNumber)
      .not.toBe(b.deployments[0].deploymentSequenceNumber);
  });

  test('url comes from metadata', () => {
    const result = buildDeploymentPayload(fluxEvent);
    expect(result.deployments[0].url).toBe('https://github.com/org/repo');
    expect(result.deployments[0].pipeline.url).toBe('https://github.com/org/repo');
  });
});
