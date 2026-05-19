import { describe, test, expect } from '@jest/globals';
import { deterministicId, parseIssueKeys } from '../shared.js';

describe('deterministicId', () => {
  test('returns a number', () => {
    expect(typeof deterministicId('a', 'ns', 'v1', '2024-01-01')).toBe('number');
  });

  test('is deterministic — same input produces same output', () => {
    const a = deterministicId('test', 'default', 'v1', '2024-01-01');
    const b = deterministicId('test', 'default', 'v1', '2024-01-01');
    expect(a).toBe(b);
  });

  test('different inputs produce different outputs', () => {
    const a = deterministicId('alpha', 'ns', 'v1', '2024-01-01');
    const b = deterministicId('beta', 'ns', 'v1', '2024-01-01');
    expect(a).not.toBe(b);
  });

  test('fits in a 32-bit unsigned integer range (0 to 4294967295)', () => {
    const id = deterministicId('anything', 'ns', 'v1', 'timestamp');
    expect(id).toBeGreaterThanOrEqual(0);
    expect(id).toBeLessThanOrEqual(0xffffffff);
  });

  test('changes when name changes', () => {
    const a = deterministicId('name-a', 'ns', 'v1', 'ts');
    const b = deterministicId('name-b', 'ns', 'v1', 'ts');
    expect(a).not.toBe(b);
  });

  test('changes when namespace changes', () => {
    const a = deterministicId('name', 'ns-a', 'v1', 'ts');
    const b = deterministicId('name', 'ns-b', 'v1', 'ts');
    expect(a).not.toBe(b);
  });

  test('changes when version changes', () => {
    const a = deterministicId('name', 'ns', 'v1', 'ts');
    const b = deterministicId('name', 'ns', 'v2', 'ts');
    expect(a).not.toBe(b);
  });

  test('changes when timestamp changes', () => {
    const a = deterministicId('name', 'ns', 'v1', '2024-01-01');
    const b = deterministicId('name', 'ns', 'v1', '2024-01-02');
    expect(a).not.toBe(b);
  });
});

describe('parseIssueKeys', () => {
  test('returns null for null input', () => {
    expect(parseIssueKeys(null)).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(parseIssueKeys(undefined)).toBeNull();
  });

  test('returns null for empty string input', () => {
    // parseIssueKeys returns null for any falsy input — empty string is falsy
    expect(parseIssueKeys('')).toBeNull();
  });

  test('parses a single key', () => {
    expect(parseIssueKeys('key1')).toEqual(['key1']);
  });

  test('parses multiple comma-separated keys', () => {
    expect(parseIssueKeys('key1,key2,key3')).toEqual(['key1', 'key2', 'key3']);
  });

  test('trims whitespace around keys', () => {
    expect(parseIssueKeys(' key1 , key2 , key3 ')).toEqual(['key1', 'key2', 'key3']);
  });

  test('filters out empty entries', () => {
    expect(parseIssueKeys('key1,,key2,')).toEqual(['key1', 'key2']);
  });
});
