import { verifyHmac } from './hmac.js';
import { verifyBearerToken } from './bearer.js';
import { extractMetadata, buildDeploymentPayload, IGNORED_REASONS } from './mapper.js';
import {
  extractMetadata as extractArgoMetadata,
  buildDeploymentPayload as buildArgoPayload,
} from './argocd-mapper.js';
import { getFluxSecret, getArgoSecret } from './storage.js';
import { handleWebhookEvent } from './orchestrator.js';

/**
 * FluxCD webhook handler.
 *
 * Verifies HMAC signature, extracts metadata from FluxCD events,
 * and submits deployment records to Jira.
 */
export const handleFluxEvent = async (event) => {
  return handleWebhookEvent(event, {
    source: 'flux',
    getSecret: getFluxSecret,
    extractAuthInput: (ev) => (ev.headers?.['x-signature'] ?? [])[0],
    verifyAuth: (signature, body, secret) => verifyHmac(body, signature, secret),
    extractMetadata,
    buildPayload: buildDeploymentPayload,
    ignoredReasons: IGNORED_REASONS,
    metaNameKey: 'helmReleaseName',
  });
};

/**
 * ArgoCD webhook handler.
 *
 * Verifies bearer token, extracts metadata from ArgoCD events,
 * and submits deployment records to Jira.
 */
export const handleArgoEvent = async (event) => {
  return handleWebhookEvent(event, {
    source: 'argocd',
    getSecret: getArgoSecret,
    extractAuthInput: (ev) => (ev.headers?.['authorization'] ?? [])[0],
    verifyAuth: (header, _body, secret) => verifyBearerToken(header, secret),
    extractMetadata: extractArgoMetadata,
    buildPayload: buildArgoPayload,
    metaNameKey: 'appName',
  });
};
