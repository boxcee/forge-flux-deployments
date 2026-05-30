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

/**
 * Shared webhook event handler.
 *
 * Pipeline: get secret → verify auth → parse JSON → extract metadata
 *          → check issue keys → check env → optional filter → build payload
 *          → submit → log.
 *
 * @param {Object} event - The webhook event
 * @param {Object} config - Provider-specific configuration
 * @param {string} config.source - Source label ('flux' | 'argocd')
 * @param {string} config.label - Display name for console warnings ('FluxCD' | 'ArgoCD')
 * @param {Function} config.getSecret - Async function that returns the auth secret
 * @param {Function} config.verifyAuth - (event, secret) → boolean
 * @param {Function} config.extractMetadata - (parsedEvent) → metadata object
 * @param {string} config.releaseNameField - Key in metadata for the release/app name
 * @param {Function} config.buildPayload - (parsedEvent, meta) → deployment payload
 * @param {Function} [config.filterEvent] - (parsedEvent) → { statusCode, body } | undefined
 * @returns {Promise<Object>} The HTTP response
 */
async function handleWebhookEvent(event, { source, label, getSecret, verifyAuth, extractMetadata, releaseNameField, buildPayload, filterEvent }) {
  const logParams = { source };

  // 1. Get secret from storage
  const secret = await getSecret();
  if (!secret) {
    console.warn(`${label} webhook secret not configured`);
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    await logEvent(logParams);
    return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
  }

  // 2. Verify auth
  if (!verifyAuth(event, secret)) {
    const authError = source === 'flux' ? 'HMAC verification failed' : 'Bearer token verification failed';
    console.warn(authError);
    logParams.statusCode = 401;
    logParams.error = authError;
    await logEvent(logParams);
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse body
  let parsedEvent;
  try {
    parsedEvent = JSON.parse(event.body);
  } catch {
    logParams.statusCode = 400;
    logParams.error = 'Malformed JSON';
    await logEvent(logParams);
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 4. Extract metadata
  const meta = extractMetadata(parsedEvent);
  logParams.releaseName = meta[releaseNameField];
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  // 5. Check issue keys
  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta[releaseNameField] });
    logParams.statusCode = 204;
    await logEvent(logParams);
    return { statusCode: 204, body: '' };
  }

  // 6. Check environment
  if (!meta.env) {
    logParams.statusCode = 400;
    logParams.error = 'Missing env annotation';
    await logEvent(logParams);
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 7. Optional filter (e.g., ignored reasons for Flux)
  if (filterEvent) {
    const result = filterEvent(parsedEvent);
    if (result) {
      console.info('Ignored reason', { reason: parsedEvent.reason });
      logParams.statusCode = result.statusCode;
      await logEvent(logParams);
      return result;
    }
  }

  // 8. Build payload
  const payload = buildPayload(parsedEvent, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

  // 9. Submit and respond
  try {
    const { response, counts } = await submitAndRespond(payload);
    logParams.statusCode = 200;
    logParams.accepted = counts.accepted;
    logParams.rejected = counts.rejected;
    logParams.unknownKeys = counts.unknownKeys;
    await logEvent(logParams);
    return response;
  } catch (err) {
    console.error('Jira API call failed', err.message);
    logParams.statusCode = 502;
    logParams.error = err.message;
    await logEvent(logParams);
    return { statusCode: 502, body: 'Upstream API error' };
  }
}

export const handleFluxEvent = async (event) =>
  handleWebhookEvent(event, {
    source: 'flux',
    label: 'FluxCD',
    getSecret: getFluxSecret,
    verifyAuth: (event, secret) => verifyHmac(event.body, (event.headers?.['x-signature'] ?? [])[0], secret),
    extractMetadata,
    releaseNameField: 'helmReleaseName',
    buildPayload: buildDeploymentPayload,
    filterEvent: (event) => IGNORED_REASONS.has(event.reason)
      ? { statusCode: 204, body: '' }
      : undefined,
  });

export const handleArgoEvent = async (event) =>
  handleWebhookEvent(event, {
    source: 'argocd',
    label: 'ArgoCD',
    getSecret: getArgoSecret,
    verifyAuth: (event, secret) => verifyBearerToken((event.headers?.['authorization'] ?? [])[0], secret),
    extractMetadata: extractArgoMetadata,
    releaseNameField: 'appName',
    buildPayload: buildArgoPayload,
  });
