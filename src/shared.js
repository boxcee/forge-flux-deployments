import { createHash } from 'node:crypto';

export function deterministicId(name, namespace, version, timestamp) {
  const input = `${name}:${namespace}:${version}:${timestamp}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Take first 8 hex chars → fits in a 32-bit int range
  return parseInt(hash.substring(0, 8), 16);
}

export function parseIssueKeys(raw) {
  if (!raw) return null;
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}
