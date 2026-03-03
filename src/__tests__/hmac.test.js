import { describe, test, expect } from '@jest/globals';
import { verifyHmac } from '../hmac.js';
import { createHmac } from 'node:crypto';

const SECRET = 'test-secret-key';

function sign(body, secret) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyHmac', () => {
  test('returns true for valid signature', () => {
    const body = '{"test": true}';
    const sig = sign(body, SECRET);
    expect(verifyHmac(body, sig, SECRET)).toBe(true);
  });

  test('returns false for invalid signature', () => {
    const body = '{"test": true}';
    expect(verifyHmac(body, 'sha256=invalid', SECRET)).toBe(false);
  });

  test('returns false for tampered body', () => {
    const body = '{"test": true}';
    const sig = sign(body, SECRET);
    expect(verifyHmac('{"test": false}', sig, SECRET)).toBe(false);
  });

  test('returns false for wrong secret', () => {
    const body = '{"test": true}';
    const sig = sign(body, SECRET);
    expect(verifyHmac(body, sig, 'wrong-secret')).toBe(false);
  });

  test('returns false for missing signature', () => {
    expect(verifyHmac('body', undefined, SECRET)).toBe(false);
    expect(verifyHmac('body', '', SECRET)).toBe(false);
  });

  test('returns false for signature without sha256= prefix', () => {
    const body = '{"test": true}';
    const raw = createHmac('sha256', SECRET).update(body).digest('hex');
    expect(verifyHmac(body, raw, SECRET)).toBe(false);
  });

  test('returns false when secret is undefined', () => {
    const body = '{"test": true}';
    expect(verifyHmac(body, 'sha256=abc', undefined)).toBe(false);
  });

  test('returns false when secret is empty string', () => {
    const body = '{"test": true}';
    expect(verifyHmac(body, 'sha256=abc', '')).toBe(false);
  });
});
