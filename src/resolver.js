import ResolverModule from '@forge/resolver';

const Resolver = ResolverModule.default || ResolverModule;
import { webTrigger } from '@forge/api';
import {
  getConfigStatus as storageGetConfigStatus,
  setFluxSecret as storageSetFluxSecret,
  setArgoSecret as storageSetArgoSecret,
  deleteFluxSecret as storageDeleteFluxSecret,
  deleteArgoSecret as storageDeleteArgoSecret,
} from './storage.js';
import { getEvents, getStats } from './event-log.js';

const resolver = new Resolver();

resolver.define('getConfigStatus', async () => {
  return await storageGetConfigStatus();
});

resolver.define('getWebtriggerUrls', async () => {
  const [flux, argocd] = await Promise.all([
    webTrigger.getUrl('flux-webhook'),
    webTrigger.getUrl('argo-webhook'),
  ]);
  return { flux, argocd };
});

function validateString(value, label) {
  if (typeof value !== 'string' || value === '') {
    return { success: false, error: `${label} must be a non-empty string` };
  }
  const trimmed = value.trim();
  if (trimmed.length < 8) {
    return { success: false, error: `${label} must be at least 8 characters` };
  }
  return { valid: true, trimmed };
}

resolver.define('setFluxSecret', async ({ payload }) => {
  const check = validateString(payload.secret, 'Secret');
  if (!check.valid) return check;
  await storageSetFluxSecret(check.trimmed);
  return { success: true };
});

resolver.define('setArgoSecret', async ({ payload }) => {
  const check = validateString(payload.token, 'Token');
  if (!check.valid) return check;
  await storageSetArgoSecret(check.trimmed);
  return { success: true };
});

resolver.define('deleteFluxSecret', async () => {
  await storageDeleteFluxSecret();
  return { success: true };
});

resolver.define('deleteArgoSecret', async () => {
  await storageDeleteArgoSecret();
  return { success: true };
});

resolver.define('getEventLog', async ({ payload }) => {
  const { source, beforeTimestamp, beforeId } = payload ?? {};
  return await getEvents({
    source: source || undefined,
    beforeTimestamp: beforeTimestamp || undefined,
    beforeId: beforeId ? Number(beforeId) : undefined,
  });
});

resolver.define('getEventStats', async ({ payload }) => {
  const { source } = payload ?? {};
  return await getStats({
    source: source || undefined,
  });
});

export const handler = resolver.getDefinitions();
