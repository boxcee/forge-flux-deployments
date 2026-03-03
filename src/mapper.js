import { createHash } from 'node:crypto';

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

function deterministicId(name, namespace, chartVersion, timestamp) {
  const input = `${name}:${namespace}:${chartVersion}:${timestamp}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Take first 8 hex chars → fits in a 32-bit int range
  return parseInt(hash.substring(0, 8), 16);
}

export function buildDeploymentPayload(fluxEvent) {
  const meta = extractMetadata(fluxEvent);
  const state = mapReasonToState(fluxEvent.reason);

  const seqNum = deterministicId(
    meta.helmReleaseName,
    meta.namespace,
    meta.chartVersion ?? 'unknown',
    fluxEvent.timestamp
  );

  return {
    deployments: [
      {
        schemaVersion: '1.0',
        deploymentSequenceNumber: seqNum,
        updateSequenceNumber: new Date(fluxEvent.timestamp).getTime(),
        displayName: `${meta.helmReleaseName} ${meta.chartVersion ?? 'unknown'} to ${meta.env}`,
        url: meta.url,
        description: fluxEvent.message ?? '',
        lastUpdated: fluxEvent.timestamp,
        label: meta.chartVersion ?? '',
        state,
        pipeline: {
          id: meta.helmReleaseName,
          displayName: meta.helmReleaseName,
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
      product: 'FluxCD',
    },
  };
}
