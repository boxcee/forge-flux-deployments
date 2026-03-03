import { describe, test, expect } from '@jest/globals';
import { mapReasonToState, IGNORED_REASONS } from '../mapper.js';
import { extractMetadata } from '../mapper.js';

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
});
