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
