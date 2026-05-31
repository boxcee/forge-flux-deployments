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
 * Generic webhook event handler.
 *
 * @param {object} event — The webhook event (with `body` and `headers`).
 * @param {object} config — Provider-specific configuration:
 *   - source: string — identifier for logging (e.g. 'flux', 'argocd').
 *   - getSecret: () => Promise<string> — async function to retrieve the secret/token.
 *   - verifyAuth: (event, secret) => boolean — auth check (HMAC, bearer, etc.).
 *   - extractMetadata: (parsedBody) => object — returns metadata object.
 *   - buildPayload: (parsedBody, meta) => object — builds the deployment payload.
 *   - filterEvent?: (parsedBody, meta) => boolean — optional pre-submit filter (e.g. ignored reasons).
 *   - nameField: string — the meta key that holds the display name (e.g. 'helmReleaseName', 'appName').
 *   - secretLabel: string — human-readable label for the secret (used in warnings).
 *   - secretMissingBody: string — fallback message when secret is not configured.
 */
async function handleWebhookEvent(event, { source, getSecret, verifyAuth, extractMetadata, buildPayload, filterEvent, nameField, secretLabel, secretMissingBody }) {
  const logParams = { source };

  // 1. Get secret/token from storage
  const secret = await getSecret();

  if (!secret) {
    console.warn(`${secretLabel} not configured`);
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    await logEvent(logParams);
    return { statusCode: 503, body: secretMissingBody ?? 'Webhook secret not configured. Configure via app admin page.' };
  }

  // 2. Verify auth
  if (!verifyAuth(event, secret)) {
    console.warn(`${source === 'flux' ? 'HMAC' : 'Bearer token'} verification failed`);
    logParams.statusCode = 401;
    logParams.error = `${source === 'flux' ? 'HMAC' : 'Bearer token'} verification failed`;
    await logEvent(logParams);
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse body
  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    logParams.statusCode = 400;
    logParams.error = 'Malformed JSON';
    await logEvent(logParams);
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 4. Extract metadata
  const meta = extractMetadata(parsedBody);
  const displayName = meta[nameField] ?? 'unknown';
  logParams.releaseName = displayName;
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: displayName });
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

  // 6. Optional pre-submit filter (e.g. ignored reasons for Flux)
  if (filterEvent && filterEvent(parsedBody, meta)) {
    console.info('Event filtered', { source, reason: parsedBody.reason });
    logParams.statusCode = 204;
    await logEvent(logParams);
    return { statusCode: 204, body: '' };
  }

  // 7. Build and submit
  const payload = buildPayload(parsedBody, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

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

export const handleFluxEvent = async (event) => {
  const signature = (event.headers?.['x-signature'] ?? [])[0];
  return handleWebhookEvent(event, {
    source: 'flux',
    getSecret: () => getFluxSecret(),
    verifyAuth: (evt, secret) => {
      const sig = (evt.headers?.['x-signature'] ?? [])[0];
      return verifyHmac(evt.body, sig, secret);
    },
    extractMetadata,
    buildPayload: buildDeploymentPayload,
    filterEvent: (evt) => IGNORED_REASONS.has(evt.reason),
    nameField: 'helmReleaseName',
    secretLabel: 'FluxCD webhook secret',
  });
};

export const handleArgoEvent = async (event) => {
  return handleWebhookEvent(event, {
    source: 'argocd',
    getSecret: () => getArgoSecret(),
    verifyAuth: (evt, token) => {
      const authHeader = (evt.headers?.['authorization'] ?? [])[0];
      return verifyBearerToken(authHeader, token);
    },
    extractMetadata: extractArgoMetadata,
    buildPayload: buildArgoPayload,
    nameField: 'appName',
    secretLabel: 'ArgoCD webhook token',
  });
};
