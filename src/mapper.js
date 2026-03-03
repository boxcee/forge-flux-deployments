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

export function extractMetadata(event) {
  const meta = event.metadata ?? {};

  const jiraRaw = meta['event.toolkit.fluxcd.io/jira'];
  const issueKeys = jiraRaw
    ? jiraRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : null;

  return {
    issueKeys,
    env: meta['event.toolkit.fluxcd.io/env'] ?? null,
    envType: meta['event.toolkit.fluxcd.io/env-type'] ?? 'unmapped',
    chartVersion: meta['helm.toolkit.fluxcd.io/chart-version'] ?? null,
    url: meta['event.toolkit.fluxcd.io/url'] ?? '',
    helmReleaseName: event.involvedObject?.name ?? 'unknown',
    namespace: event.involvedObject?.namespace ?? 'default',
  };
}
