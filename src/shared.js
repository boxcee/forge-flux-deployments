import { createHash } from 'node:crypto';

export function deterministicId(name, namespace, version, timestamp) {
  const input = `${name}:${namespace}:${version}:${timestamp}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Take first 8 hex chars → unsigned 32-bit range (0–4,294,967,295).
  // Jira Deployments API accepts int64 for deploymentSequenceNumber,
  // so no overflow concern; JavaScript Number handles this safely (up to 2^53).
  return parseInt(hash.substring(0, 8), 16);
}

export function parseIssueKeys(raw) {
  if (!raw) return null;
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}
