import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock @forge/sql
const mockExecute = jest.fn();
const mockBindParams = jest.fn(() => ({ execute: mockExecute }));
const mockPrepare = jest.fn(() => ({ bindParams: mockBindParams, execute: mockExecute }));
const mockExecuteDDL = jest.fn();

jest.unstable_mockModule('@forge/sql', () => ({
  default: {
    prepare: mockPrepare,
    executeDDL: mockExecuteDDL,
  },
}));

const { ensureSchema, logEvent, getEvents, getStats, cleanupOldEvents } =
  await import('../event-log.js');

describe('ensureSchema', () => {
  beforeEach(() => {
    mockExecuteDDL.mockReset();
    mockExecuteDDL.mockResolvedValue({ rows: [] });
  });

  test('creates table and indexes on first call', async () => {
    await ensureSchema();
    expect(mockExecuteDDL).toHaveBeenCalledTimes(3);
    expect(mockExecuteDDL.mock.calls[0][0]).toContain(
      'CREATE TABLE IF NOT EXISTS webhook_events'
    );
    expect(mockExecuteDDL.mock.calls[1][0]).toContain(
      'CREATE INDEX IF NOT EXISTS idx_we_timestamp'
    );
    expect(mockExecuteDDL.mock.calls[2][0]).toContain(
      'CREATE INDEX IF NOT EXISTS idx_we_source_timestamp'
    );
  });

  test('skips SQL on subsequent calls', async () => {
    mockExecuteDDL.mockClear();
    await ensureSchema();
    expect(mockExecuteDDL).not.toHaveBeenCalled();
  });
});

describe('logEvent', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockBindParams.mockClear();
    mockExecute.mockReset();
    mockExecute.mockResolvedValue({ rows: [] });
  });

  test('inserts row with all fields', async () => {
    await logEvent({
      source: 'flux',
      statusCode: 200,
      releaseName: 'my-app',
      namespace: 'prod',
      env: 'production',
      issueKeys: ['DPS-1', 'DPS-2'],
      deploymentState: 'successful',
      accepted: 1,
      rejected: 0,
      unknownKeys: 0,
      error: null,
    });

    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockPrepare.mock.calls[0][0]).toContain('INSERT INTO webhook_events');
    expect(mockBindParams).toHaveBeenCalledTimes(1);

    const params = mockBindParams.mock.calls[0];
    // params: timestamp, source, statusCode, releaseName, namespace, env, issueKeysStr, deploymentState, accepted, rejected, unknownKeys, error
    expect(params).toHaveLength(12);
    expect(params[1]).toBe('flux');
    expect(params[2]).toBe(200);
    expect(params[3]).toBe('my-app');
    expect(params[4]).toBe('prod');
    expect(params[5]).toBe('production');
    expect(params[6]).toBe('DPS-1,DPS-2');
    expect(params[7]).toBe('successful');
    expect(params[8]).toBe(1);
    expect(params[9]).toBe(0);
    expect(params[10]).toBe(0);
    expect(params[11]).toBeNull();
  });

  test('truncates error to 1000 chars', async () => {
    const longError = 'x'.repeat(2000);
    await logEvent({
      source: 'flux',
      statusCode: 502,
      error: longError,
    });

    const params = mockBindParams.mock.calls[0];
    expect(params[11]).toHaveLength(1000);
  });

  test('swallows SQL errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('SQL failure'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      logEvent({ source: 'flux', statusCode: 500 })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log event:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  test('handles null/undefined optional fields', async () => {
    await logEvent({ source: 'flux', statusCode: 204 });

    const params = mockBindParams.mock.calls[0];
    expect(params[3]).toBeNull(); // releaseName
    expect(params[4]).toBeNull(); // namespace
    expect(params[5]).toBeNull(); // env
    expect(params[6]).toBeNull(); // issueKeys
    expect(params[7]).toBeNull(); // deploymentState
    expect(params[8]).toBeNull(); // accepted
    expect(params[9]).toBeNull(); // rejected
    expect(params[10]).toBeNull(); // unknownKeys
    expect(params[11]).toBeNull(); // error
  });
});

describe('getEvents', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockBindParams.mockClear();
    mockExecute.mockReset();
  });

  test('returns events with hasMore=false when <= 25 rows', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    mockExecute.mockResolvedValueOnce({ rows });

    const result = await getEvents();
    expect(result.events).toHaveLength(10);
    expect(result.hasMore).toBe(false);
  });

  test('returns hasMore=true when > 25 rows', async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({ id: i }));
    mockExecute.mockResolvedValueOnce({ rows });

    const result = await getEvents();
    expect(result.events).toHaveLength(25);
    expect(result.hasMore).toBe(true);
  });

  test('applies source filter', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    await getEvents({ source: 'flux' });

    expect(mockPrepare.mock.calls[0][0]).toContain('source = ?');
    expect(mockBindParams.mock.calls[0]).toContain('flux');
  });

  test('applies keyset cursor', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    await getEvents({
      beforeTimestamp: '2026-01-01T00:00:00Z',
      beforeId: 100,
    });

    const query = mockPrepare.mock.calls[0][0];
    expect(query).toContain('timestamp < ?');
    expect(query).toContain('id < ?');
    expect(mockBindParams.mock.calls[0]).toEqual([
      '2026-01-01T00:00:00Z',
      '2026-01-01T00:00:00Z',
      100,
    ]);
  });
});

describe('getStats', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockBindParams.mockClear();
    mockExecute.mockReset();
  });

  test('returns counts from SQL result', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ accepted: 5, failed: 2, skipped: 3 }],
    });

    const result = await getStats();
    expect(result).toEqual({ accepted: 5, failed: 2, skipped: 3 });
  });

  test('returns zeros when no rows', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ accepted: null, failed: null, skipped: null }],
    });

    const result = await getStats();
    expect(result).toEqual({ accepted: 0, failed: 0, skipped: 0 });
  });

  test('applies source filter', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ accepted: 0, failed: 0, skipped: 0 }],
    });

    await getStats({ source: 'argo' });

    expect(mockPrepare.mock.calls[0][0]).toContain('source = ?');
    expect(mockBindParams.mock.calls[0]).toContain('argo');
  });
});

describe('cleanupOldEvents', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockBindParams.mockClear();
    mockExecute.mockReset();
  });

  test('deletes old rows and returns count', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: { affectedRows: 42 },
    });

    const result = await cleanupOldEvents();
    expect(result).toBe(42);
    expect(mockPrepare.mock.calls[0][0]).toContain('DELETE FROM webhook_events');
  });

  test('swallows errors and returns 0', async () => {
    mockExecute.mockRejectedValueOnce(new Error('SQL failure'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await cleanupOldEvents();
    expect(result).toBe(0);

    consoleSpy.mockRestore();
  });
});
