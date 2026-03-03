import { verifyHmac } from './hmac.js';
import { extractMetadata, buildDeploymentPayload, IGNORED_REASONS } from './mapper.js';
import { submitDeployment } from './jira.js';

export const handleFluxEvent = async (event) => {
  // 1. Verify HMAC
  const signature = (event.headers?.['x-signature'] ?? [])[0];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyHmac(event.body, signature, secret)) {
    console.warn('HMAC verification failed');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 2. Parse body
  let fluxEvent;
  try {
    fluxEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Malformed JSON' };
  }

  // 3. Extract issue keys
  const meta = extractMetadata(fluxEvent);
  if (!meta.issueKeys) {
    console.info('No jira annotation — skipping', { name: meta.helmReleaseName });
    return { statusCode: 204, body: '' };
  }

  // 4. Check environment
  if (!meta.env) {
    return { statusCode: 400, body: 'Missing env annotation' };
  }

  // 5. Check reason
  if (IGNORED_REASONS.has(fluxEvent.reason)) {
    console.info('Ignored reason', { reason: fluxEvent.reason });
    return { statusCode: 204, body: '' };
  }

  // 6. Build and submit
  const payload = buildDeploymentPayload(fluxEvent);

  try {
    const result = await submitDeployment(payload);

    if (result.rejectedDeployments?.length > 0) {
      console.warn('Rejected deployments', result.rejectedDeployments);
    }
    if (result.unknownIssueKeys?.length > 0) {
      console.warn('Unknown issue keys', result.unknownIssueKeys);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': ['application/json'] },
      body: JSON.stringify({ accepted: result.acceptedDeployments?.length ?? 0 }),
    };
  } catch (err) {
    console.error('Jira API call failed', err.message);
    return { statusCode: 502, body: 'Upstream API error' };
  }
};
