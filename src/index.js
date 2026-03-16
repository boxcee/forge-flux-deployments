import { verifyHmac } from './hmac.js';
import { extractMetadata, buildDeploymentPayload, IGNORED_REASONS } from './mapper.js';
import { submitDeployment } from './jira.js';
import { verifyBearerToken } from './bearer.js';
import { extractMetadata as extractArgoMetadata, buildDeploymentPayload as buildArgoPayload } from './argocd-mapper.js';
import { getFluxSecret, getArgoSecret } from './storage.js';
import { logEvent } from './event-log.js';

async function submitAndRespond(payload) {
  const result = await submitDeployment(payload);

  if (result.rejectedDeployments?.length > 0) {
    console.warn('Rejected deployments', result.rejectedDeployments);
  }
  if (result.unknownIssueKeys?.length > 0) {
    console.warn('Unknown issue keys', result.unknownIssueKeys);
  }

  const counts = {
    accepted: result.acceptedDeployments?.length ?? 0,
    rejected: result.rejectedDeployments?.length ?? 0,
    unknownKeys: result.unknownIssueKeys?.length ?? 0,
  };

  const response = {
    statusCode: 200,
    headers: { 'Content-Type': ['application/json'] },
    body: JSON.stringify({ accepted: counts.accepted }),
  };

  return { response, counts };
}

export const handleFluxEvent = async (event) => {
  const logParams = { source: 'flux' };

  // 1. Get secret from storage
  const signature = (event.headers?.['x-signature'] ?? [])[0];
  const secret = await getFluxSecret();

  if (!secret) {
    console.warn('FluxCD webhook secret not configured');
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
  }

  // 2. Verify HMAC
  if (!verifyHmac(event.body, signature, secret)) {
    console.warn('HMAC verification failed');
    logParams.statusCode = 401;
    logParams.error = 'HMAC verification failed';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse body
  let fluxEvent;
  try {
    fluxEvent = JSON.parse(event.body);
  } catch {
    logParams.statusCode = 400;
    logParams.error = 'Malformed JSON';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 4. Extract metadata
  const meta = extractMetadata(fluxEvent);
  logParams.releaseName = meta.helmReleaseName;
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta.helmReleaseName });
    logParams.statusCode = 204;
    try { await logEvent(logParams); } catch {}
    return { statusCode: 204, body: '' };
  }

  // 5. Check environment
  if (!meta.env) {
    logParams.statusCode = 400;
    logParams.error = 'Missing env annotation';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 6. Check reason
  if (IGNORED_REASONS.has(fluxEvent.reason)) {
    console.info('Ignored reason', { reason: fluxEvent.reason });
    logParams.statusCode = 204;
    try { await logEvent(logParams); } catch {}
    return { statusCode: 204, body: '' };
  }

  // 7. Build and submit
  const payload = buildDeploymentPayload(fluxEvent, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

  try {
    const { response, counts } = await submitAndRespond(payload);
    logParams.statusCode = 200;
    logParams.accepted = counts.accepted;
    logParams.rejected = counts.rejected;
    logParams.unknownKeys = counts.unknownKeys;
    try { await logEvent(logParams); } catch {}
    return response;
  } catch (err) {
    console.error('Jira API call failed', err.message);
    logParams.statusCode = 502;
    logParams.error = err.message;
    try { await logEvent(logParams); } catch {}
    return { statusCode: 502, body: 'Upstream API error' };
  }
};

export const handleArgoEvent = async (event) => {
  const logParams = { source: 'argo' };

  // 1. Get token from storage
  const authHeader = (event.headers?.['authorization'] ?? [])[0];
  const token = await getArgoSecret();

  if (!token) {
    console.warn('ArgoCD webhook token not configured');
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
  }

  // 2. Verify bearer token
  if (!verifyBearerToken(authHeader, token)) {
    console.warn('Bearer token verification failed');
    logParams.statusCode = 401;
    logParams.error = 'Bearer token verification failed';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse body
  let argoEvent;
  try {
    argoEvent = JSON.parse(event.body);
  } catch {
    logParams.statusCode = 400;
    logParams.error = 'Malformed JSON';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 4. Extract metadata and check issue keys
  const meta = extractArgoMetadata(argoEvent);
  logParams.releaseName = meta.appName;
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta.appName });
    logParams.statusCode = 204;
    try { await logEvent(logParams); } catch {}
    return { statusCode: 204, body: '' };
  }

  // 5. Check environment
  if (!meta.env) {
    logParams.statusCode = 400;
    logParams.error = 'Missing env annotation';
    try { await logEvent(logParams); } catch {}
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 6. Build and submit
  const payload = buildArgoPayload(argoEvent, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

  try {
    const { response, counts } = await submitAndRespond(payload);
    logParams.statusCode = 200;
    logParams.accepted = counts.accepted;
    logParams.rejected = counts.rejected;
    logParams.unknownKeys = counts.unknownKeys;
    try { await logEvent(logParams); } catch {}
    return response;
  } catch (err) {
    console.error('Jira API call failed', err.message);
    logParams.statusCode = 502;
    logParams.error = err.message;
    try { await logEvent(logParams); } catch {}
    return { statusCode: 502, body: 'Upstream API error' };
  }
};
