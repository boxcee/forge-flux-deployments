import { deterministicId, parseIssueKeys } from './shared.js';

const PHASE_TO_STATE = {
  Succeeded: 'successful',
  Failed: 'failed',
  Error: 'failed',
  Running: 'in_progress',
};

export function mapPhaseToState(phase, _healthStatus) {
  return PHASE_TO_STATE[phase] ?? 'unknown';
}

export function extractMetadata(payload) {
  const annotations = payload.annotations ?? {};

  return {
    issueKeys: parseIssueKeys(annotations.jira),
    env: annotations.env ?? null,
    envType: annotations.envType ?? 'unmapped',
    revision: payload.revision ?? null,
    url: annotations.url ?? '',
    appName: payload.app ?? 'unknown',
    namespace: payload.namespace ?? 'default',
  };
}

export function buildDeploymentPayload(argoPayload, meta) {
  if (!meta) meta = extractMetadata(argoPayload);
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
