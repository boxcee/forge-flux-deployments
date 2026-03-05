import { timingSafeEqual } from 'node:crypto';

export function verifyBearerToken(header, secret) {
  if (!secret || !header || !header.startsWith('Bearer ')) {
    return false;
  }

  const token = header.slice(7);
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);

  if (tokenBuf.length !== secretBuf.length) {
    return false;
  }

  return timingSafeEqual(tokenBuf, secretBuf);
}
