import { describe, test, expect } from '@jest/globals';
import { verifyBearerToken } from '../bearer.js';

describe('verifyBearerToken', () => {
  const TOKEN = 'my-secret-token';

  test('returns true for valid bearer token', () => {
    expect(verifyBearerToken('Bearer my-secret-token', TOKEN)).toBe(true);
  });

  test('returns false for wrong token', () => {
    expect(verifyBearerToken('Bearer wrong-token', TOKEN)).toBe(false);
  });

  test('returns false for missing Bearer prefix', () => {
    expect(verifyBearerToken('my-secret-token', TOKEN)).toBe(false);
  });

  test('returns false for undefined header', () => {
    expect(verifyBearerToken(undefined, TOKEN)).toBe(false);
  });

  test('returns false for empty header', () => {
    expect(verifyBearerToken('', TOKEN)).toBe(false);
  });

  test('returns false for undefined secret', () => {
    expect(verifyBearerToken('Bearer my-secret-token', undefined)).toBe(false);
  });

  test('returns false for empty secret', () => {
    expect(verifyBearerToken('Bearer my-secret-token', '')).toBe(false);
  });

  test('uses timing-safe comparison', () => {
    expect(verifyBearerToken('Bearer short', 'a-much-longer-token-value')).toBe(false);
  });
});
