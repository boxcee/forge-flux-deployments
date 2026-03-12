import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock @forge/kvs
const mockGetSecret = jest.fn();
const mockSetSecret = jest.fn();
const mockDeleteSecret = jest.fn();

jest.unstable_mockModule('@forge/kvs', () => ({
  kvs: {
    getSecret: mockGetSecret,
    setSecret: mockSetSecret,
    deleteSecret: mockDeleteSecret,
  },
}));

const {
  getFluxSecret,
  getArgoSecret,
  setFluxSecret,
  setArgoSecret,
  deleteFluxSecret,
  deleteArgoSecret,
  getConfigStatus,
} = await import('../storage.js');

describe('storage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockGetSecret.mockReset();
    mockSetSecret.mockReset();
    mockDeleteSecret.mockReset();
    delete process.env.WEBHOOK_SECRET;
    delete process.env.ARGOCD_WEBHOOK_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getFluxSecret', () => {
    test('returns KVS value when set', async () => {
      mockGetSecret.mockResolvedValue('kvs-secret');
      const result = await getFluxSecret();
      expect(result).toBe('kvs-secret');
      expect(mockGetSecret).toHaveBeenCalledWith('flux:hmacSecret');
    });

    test('falls back to process.env.WEBHOOK_SECRET when KVS returns undefined', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      process.env.WEBHOOK_SECRET = 'env-secret';
      const result = await getFluxSecret();
      expect(result).toBe('env-secret');
    });

    test('returns undefined when neither KVS nor env var exists', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      const result = await getFluxSecret();
      expect(result).toBeUndefined();
    });

    test('KVS value takes priority over env var', async () => {
      mockGetSecret.mockResolvedValue('kvs-secret');
      process.env.WEBHOOK_SECRET = 'env-secret';
      const result = await getFluxSecret();
      expect(result).toBe('kvs-secret');
    });
  });

  describe('getArgoSecret', () => {
    test('returns KVS value when set', async () => {
      mockGetSecret.mockResolvedValue('kvs-token');
      const result = await getArgoSecret();
      expect(result).toBe('kvs-token');
      expect(mockGetSecret).toHaveBeenCalledWith('argocd:bearerToken');
    });

    test('falls back to process.env.ARGOCD_WEBHOOK_TOKEN when KVS returns undefined', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      process.env.ARGOCD_WEBHOOK_TOKEN = 'env-token';
      const result = await getArgoSecret();
      expect(result).toBe('env-token');
    });

    test('returns undefined when neither KVS nor env var exists', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      const result = await getArgoSecret();
      expect(result).toBeUndefined();
    });

    test('KVS value takes priority over env var', async () => {
      mockGetSecret.mockResolvedValue('kvs-token');
      process.env.ARGOCD_WEBHOOK_TOKEN = 'env-token';
      const result = await getArgoSecret();
      expect(result).toBe('kvs-token');
    });
  });

  describe('setFluxSecret', () => {
    test('calls kvs.setSecret with correct key', async () => {
      mockSetSecret.mockResolvedValue(undefined);
      await setFluxSecret('my-secret-value');
      expect(mockSetSecret).toHaveBeenCalledWith('flux:hmacSecret', 'my-secret-value');
    });
  });

  describe('setArgoSecret', () => {
    test('calls kvs.setSecret with correct key', async () => {
      mockSetSecret.mockResolvedValue(undefined);
      await setArgoSecret('my-token-value');
      expect(mockSetSecret).toHaveBeenCalledWith('argocd:bearerToken', 'my-token-value');
    });
  });

  describe('deleteFluxSecret', () => {
    test('calls kvs.deleteSecret with correct key', async () => {
      mockDeleteSecret.mockResolvedValue(undefined);
      await deleteFluxSecret();
      expect(mockDeleteSecret).toHaveBeenCalledWith('flux:hmacSecret');
    });
  });

  describe('deleteArgoSecret', () => {
    test('calls kvs.deleteSecret with correct key', async () => {
      mockDeleteSecret.mockResolvedValue(undefined);
      await deleteArgoSecret();
      expect(mockDeleteSecret).toHaveBeenCalledWith('argocd:bearerToken');
    });
  });

  describe('getConfigStatus', () => {
    test('returns configured: true when secrets exist in KVS', async () => {
      mockGetSecret
        .mockResolvedValueOnce('flux-secret')
        .mockResolvedValueOnce('argo-token');
      const status = await getConfigStatus();
      expect(status).toEqual({
        flux: { configured: true },
        argocd: { configured: true },
      });
    });

    test('returns configured: true when secrets exist via env fallback', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      process.env.WEBHOOK_SECRET = 'env-secret';
      process.env.ARGOCD_WEBHOOK_TOKEN = 'env-token';
      const status = await getConfigStatus();
      expect(status).toEqual({
        flux: { configured: true },
        argocd: { configured: true },
      });
    });

    test('returns configured: false when no secrets exist', async () => {
      mockGetSecret.mockResolvedValue(undefined);
      const status = await getConfigStatus();
      expect(status).toEqual({
        flux: { configured: false },
        argocd: { configured: false },
      });
    });

    test('returns mixed status correctly', async () => {
      mockGetSecret
        .mockResolvedValueOnce('flux-secret')
        .mockResolvedValueOnce(undefined);
      const status = await getConfigStatus();
      expect(status).toEqual({
        flux: { configured: true },
        argocd: { configured: false },
      });
    });
  });
});
