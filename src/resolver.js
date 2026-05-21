import { makeResolver } from '@forge/resolver';
import { webTrigger } from '@forge/api';
import {
  getConfigStatus as storageGetConfigStatus,
  setFluxSecret as storageSetFluxSecret,
  setArgoSecret as storageSetArgoSecret,
  deleteFluxSecret as storageDeleteFluxSecret,
  deleteArgoSecret as storageDeleteArgoSecret,
} from './storage.js';
import { getEvents, getStats } from './event-log.js';

function validateString(value, label) {
  if (typeof value !== 'string' || value === '') {
    return { success: false, error: `${label} must be a non-empty string` };
  }
  const trimmed = value.trim();
  if (trimmed.length < 8) {
    return { success: false, error: `${label} must be at least 8 characters` };
  }
  return { success: true, trimmed };
}

export const handler = makeResolver({
  getConfigStatus: async () => {
    return await storageGetConfigStatus();
  },

  getWebtriggerUrls: async () => {
    const [flux, argocd] = await Promise.all([
      webTrigger.getUrl('flux-webhook'),
      webTrigger.getUrl('argo-webhook'),
    ]);
    return { flux, argocd };
  },

  setFluxSecret: async ({ payload }) => {
    const check = validateString(payload.secret, 'Secret');
    if (!check.success) return check;
    await storageSetFluxSecret(check.trimmed);
    return { success: true };
  },

  setArgoSecret: async ({ payload }) => {
    const check = validateString(payload.token, 'Token');
    if (!check.success) return check;
    await storageSetArgoSecret(check.trimmed);
    return { success: true };
  },

  deleteFluxSecret: async () => {
    await storageDeleteFluxSecret();
    return { success: true };
  },

  deleteArgoSecret: async () => {
    await storageDeleteArgoSecret();
    return { success: true };
  },

  getEventLog: async ({ payload }) => {
    const { source, beforeTimestamp, beforeId } = payload ?? {};
    return await getEvents({
      source: source || undefined,
      beforeTimestamp: beforeTimestamp || undefined,
      beforeId: beforeId ? Number(beforeId) : undefined,
    });
  },

  getEventStats: async ({ payload }) => {
    const { source } = payload ?? {};
    return await getStats({
      source: source || undefined,
    });
  },
});
