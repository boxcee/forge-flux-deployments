import { submitDeployment } from './jira.js';
import { logEvent } from './event-log.js';

/**
 * Shared webhook handler pipeline.
 *
 * Both FluxCD and ArgoCD handlers follow the same steps:
 *   1. Get secret/token from storage
 *   2. Verify authentication
 *   3. Parse JSON body
 *   4. Extract metadata from the event
 *   5. Check for Jira issue keys
 *   6. Check environment annotation
 *   7. (optional) Filter ignored reasons
 *   8. Build and submit deployment payload
 *
 * @param {Object} event  — The webhook event object with { body, headers }.
 * @param {Object} config — Provider-specific configuration.
 * @returns {Promise<Object>} The HTTP response object.
 */
export async function handleWebhookEvent(event, config) {
  const {
    source,
    getSecret,
    extractAuthInput,
    verifyAuth,
    extractMetadata,
    buildPayload,
    ignoredReasons,
    metaNameKey,
  } = config;

  const logParams = { source };

  // 1. Get secret from storage
  const secret = await getSecret();
  if (!secret) {
    console.warn(`${source} webhook secret not configured`);
    logParams.statusCode = 503;
    logParams.error = 'Webhook secret not configured';
    await logEvent(logParams);
    return {
      statusCode: 503,
      body: 'Webhook secret not configured. Configure via app admin page.',
    };
  }

  // 2. Verify authentication
  const authInput = extractAuthInput(event);
  if (!verifyAuth(authInput, event.body, secret)) {
    console.warn(`${source} auth verification failed`);
    logParams.statusCode = 401;
    logParams.error = 'Auth verification failed';
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
  const meta = extractMetadata(parsed);
  logParams.releaseName = meta[metaNameKey];
  logParams.namespace = meta.namespace;
  logParams.env = meta.env;
  logParams.issueKeys = meta.issueKeys;

  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta[metaNameKey] });
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

  // 6. Check ignored reasons (if any)
  if (ignoredReasons?.has(parsed.reason)) {
    console.info('Ignored reason', { reason: parsed.reason });
    logParams.statusCode = 204;
    await logEvent(logParams);
    return { statusCode: 204, body: '' };
  }

  // 7. Build and submit
  const payload = buildPayload(parsed, meta);
  logParams.deploymentState = payload.deployments[0]?.state;

  try {
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
