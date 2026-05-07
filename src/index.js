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
 * Orchestrates the common pipeline for both FluxCD and ArgoCD webhooks:
 *   1. Retrieve provider secret
 *   2. Verify authentication
 *   3. Parse JSON body
 *   4. Extract metadata (issue keys, env, etc.)
 *   5. Optional event filtering (e.g. IGNORED_REASONS for FluxCD)
 *   6. Build and submit deployment payload to Jira
 *   7. Log the event
 *
 * @param {object} event - The incoming webhook event.
 * @param {object} config - Provider-specific configuration.
 * @param {string} config.source - Identifier for logging (e.g. 'flux', 'argocd').
 * @param {Function} config.getSecret - Async function returning the provider secret.
 * @param {Function} config.verifyAuth - Function(event, secret) returning boolean.
 * @param {Function} config.extractMetadata - Function(parsedBody) returning metadata object.
 * @param {Function} config.buildPayload - Function(parsedBody, meta) returning deployment payload.
 * @param {Function} [config.filterEvent] - Optional function(parsedBody) returning boolean (true = skip).
 * @param {Function} config.releaseNameFromMeta - Function(meta) returning the release/app name.
 * @returns {Promise<object>} HTTP-like response { statusCode, body, headers? }.
 */
async function handleWebhookEvent(event, {
  source,
  getSecret,
  verifyAuth,
  extractMetadata: extractMeta,
  buildPayload,
  filterEvent,
  releaseNameFromMeta,
}) {
  const logParams = { source };

  // 1. Get secret
  const secret = await getSecret();
  if (!secret) {
    console.warn(`${source} webhook secret not configured`);
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    await logEvent(logParams);
    return { statusCode: 503, body: 'Webhook secret not configured. Configure via app admin page.' };
  }

  // 2. Verify authentication
  if (!verifyAuth(event, secret)) {
    console.warn(`${source} authentication failed`);
    logParams.statusCode = 401;
    logParams.error = `${source} authentication failed`;
    await logEvent(logParams);
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse body
  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    logParams.statusCode = 400;
    logParams.error = 'Malformed JSON';
    await logEvent(logParams);
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 4. Extract metadata
  const meta = extractMeta(parsed);
  logParams.releaseName = releaseNameFromMeta(meta);
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: logParams.releaseName });
    logParams.statusCode = 204;
    await logEvent(logParams);
    return { statusCode: 204, body: '' };
  }

  // 5. Check environment
  if (!meta.env) {
    logParams.statusCode = 400;
    logParams.error = 'Missing env annotation';
    await logEvent(logParams);
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 6. Optional filter (e.g. IGNORED_REASONS for FluxCD)
  if (filterEvent && filterEvent(parsed)) {
    console.info('Ignored event', { reason: parsed.reason });
    logParams.statusCode = 204;
    await logEvent(logParams);
    return { statusCode: 204, body: '' };
  }

  // 7. Build and submit
  const payload = buildPayload(parsed, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

  try {
    const { response, counts } = await submitAndRespond(payload);
    logParams.statusCode = 200;
    logParams.accepted = counts.accepted;
    logParams.rejected = counts.rejected;
    logParams.unknownKeys = counts.unknownKeys;
    try {
      await logEvent(logParams);
      return response;
    } catch (err) {
      logParams.statusCode = 502;
      logParams.error = err.message;
      await logEvent(logParams);
      return { statusCode: 502, body: 'Logging failed' };
    }
  } catch (err) {
    console.error('Jira API call failed', err.message);
    logParams.statusCode = 502;
    logParams.error = err.message;
    await logEvent(logParams);
    return { statusCode: 502, body: 'Upstream API error' };
  }
}

/**
 * FluxCD webhook handler.
 * Receives generic-hmac events from FluxCD Alert resource.
 */
export const handleFluxEvent = async (event) => {
  const signature = (event.headers?.['x-signature'] ?? [])[0];
  return handleWebhookEvent(event, {
    source: 'flux',
    getSecret: getFluxSecret,
    verifyAuth: (_event, secret) => verifyHmac(event.body, signature, secret),
    extractMetadata,
    buildPayload: buildDeploymentPayload,
    filterEvent: (parsed) => IGNORED_REASONS.has(parsed.reason),
    releaseNameFromMeta: (meta) => meta.helmReleaseName,
  });
};

/**
 * ArgoCD webhook handler.
 * Receives application event notifications from ArgoCD.
 */
export const handleArgoEvent = async (event) => {
  const authHeader = (event.headers?.['authorization'] ?? [])[0];
  return handleWebhookEvent(event, {
    source: 'argocd',
    getSecret: getArgoSecret,
    verifyAuth: (_event, secret) => verifyBearerToken(authHeader, secret),
    extractMetadata: extractArgoMetadata,
    buildPayload: buildArgoPayload,
    filterEvent: undefined,
    releaseNameFromMeta: (meta) => meta.appName,
  });
};
