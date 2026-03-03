import { describe, test, expect } from '@jest/globals';
import { mapReasonToState, IGNORED_REASONS } from '../mapper.js';

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
