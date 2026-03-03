const REASON_TO_STATE = {
  InstallSucceeded: 'successful',
  UpgradeSucceeded: 'successful',
  TestSucceeded: 'successful',
  ReconciliationSucceeded: 'successful',
  InstallFailed: 'failed',
  UpgradeFailed: 'failed',
  TestFailed: 'failed',
  ReconciliationFailed: 'failed',
  RollbackFailed: 'failed',
  UninstallFailed: 'failed',
  ArtifactFailed: 'failed',
  RollbackSucceeded: 'rolled_back',
};

export const IGNORED_REASONS = new Set([
  'UninstallSucceeded',
  'DependencyNotReady',
]);

export function mapReasonToState(reason) {
  return REASON_TO_STATE[reason] ?? 'unknown';
}
