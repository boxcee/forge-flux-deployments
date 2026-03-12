import { kvs } from '@forge/kvs';

const KEYS = {
  fluxHmacSecret: 'flux:hmacSecret',
  argocdBearerToken: 'argocd:bearerToken',
};

export async function getFluxSecret() {
  const value = await kvs.getSecret(KEYS.fluxHmacSecret);
  if (value !== undefined) return value;
  return process.env.WEBHOOK_SECRET;
}

export async function getArgoSecret() {
  const value = await kvs.getSecret(KEYS.argocdBearerToken);
  if (value !== undefined) return value;
  return process.env.ARGOCD_WEBHOOK_TOKEN;
}

export async function setFluxSecret(secret) {
  await kvs.setSecret(KEYS.fluxHmacSecret, secret);
}

export async function setArgoSecret(token) {
  await kvs.setSecret(KEYS.argocdBearerToken, token);
}

export async function deleteFluxSecret() {
  await kvs.deleteSecret(KEYS.fluxHmacSecret);
}

export async function deleteArgoSecret() {
  await kvs.deleteSecret(KEYS.argocdBearerToken);
}

export async function getConfigStatus() {
  const fluxSecret = await getFluxSecret();
  const argoSecret = await getArgoSecret();
  return {
    flux: { configured: fluxSecret !== undefined },
    argocd: { configured: argoSecret !== undefined },
  };
}
