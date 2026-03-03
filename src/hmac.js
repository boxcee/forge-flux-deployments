import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify FluxCD generic-hmac X-Signature header.
 * Expects signature in format: sha256=<hex>
 */
export function verifyHmac(body, signature, secret) {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}
