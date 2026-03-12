import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock storage.js
const mockGetConfigStatus = jest.fn();
const mockSetFluxSecret = jest.fn();
const mockSetArgoSecret = jest.fn();
const mockDeleteFluxSecret = jest.fn();
const mockDeleteArgoSecret = jest.fn();

jest.unstable_mockModule('../storage.js', () => ({
  getConfigStatus: mockGetConfigStatus,
  setFluxSecret: mockSetFluxSecret,
  setArgoSecret: mockSetArgoSecret,
  deleteFluxSecret: mockDeleteFluxSecret,
  deleteArgoSecret: mockDeleteArgoSecret,
}));

// Mock @forge/api
const mockGetUrl = jest.fn();
jest.unstable_mockModule('@forge/api', () => ({
  webTrigger: { getUrl: mockGetUrl },
}));

// Mock @forge/resolver — capture define() calls
const handlers = {};
const mockDefine = jest.fn((key, fn) => { handlers[key] = fn; });
jest.unstable_mockModule('@forge/resolver', () => {
  const MockResolver = function () {
    this.define = mockDefine;
    this.getDefinitions = () => 'resolver-definitions';
  };
  return { default: MockResolver };
});

// Import resolver (triggers define() calls)
const { handler } = await import('../resolver.js');

// Helper to invoke a defined handler
async function invoke(key, payload) {
  const fn = handlers[key];
  if (!fn) throw new Error(`No handler defined for key: ${key}`);
  return fn({ payload });
}

describe('resolver', () => {
  beforeEach(() => {
    mockGetConfigStatus.mockReset();
    mockSetFluxSecret.mockReset();
    mockSetArgoSecret.mockReset();
    mockDeleteFluxSecret.mockReset();
    mockDeleteArgoSecret.mockReset();
    mockGetUrl.mockReset();
  });

  test('handler is the resolver definitions', () => {
    expect(handler).toBe('resolver-definitions');
  });

  describe('getConfigStatus', () => {
    test('returns storage.getConfigStatus() result', async () => {
      const status = { flux: { configured: true }, argocd: { configured: false } };
      mockGetConfigStatus.mockResolvedValue(status);
      const result = await invoke('getConfigStatus');
      expect(result).toEqual(status);
      expect(mockGetConfigStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWebtriggerUrls', () => {
    test('returns flux and argocd URLs from webTrigger.getUrl', async () => {
      mockGetUrl
        .mockResolvedValueOnce('https://forge.example.com/flux')
        .mockResolvedValueOnce('https://forge.example.com/argocd');
      const result = await invoke('getWebtriggerUrls');
      expect(result).toEqual({
        flux: 'https://forge.example.com/flux',
        argocd: 'https://forge.example.com/argocd',
      });
      expect(mockGetUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('setFluxSecret', () => {
    test('stores valid secret and returns success', async () => {
      mockSetFluxSecret.mockResolvedValue(undefined);
      const result = await invoke('setFluxSecret', { secret: 'valid-secret-123' });
      expect(result).toEqual({ success: true });
      expect(mockSetFluxSecret).toHaveBeenCalledWith('valid-secret-123');
    });

    test('trims whitespace before storing', async () => {
      mockSetFluxSecret.mockResolvedValue(undefined);
      const result = await invoke('setFluxSecret', { secret: '  valid-secret-123  ' });
      expect(result).toEqual({ success: true });
      expect(mockSetFluxSecret).toHaveBeenCalledWith('valid-secret-123');
    });

    test('rejects secret shorter than 8 characters', async () => {
      const result = await invoke('setFluxSecret', { secret: 'short' });
      expect(result).toEqual({ success: false, error: 'Secret must be at least 8 characters' });
      expect(mockSetFluxSecret).not.toHaveBeenCalled();
    });

    test('rejects exactly 7 character secret', async () => {
      const result = await invoke('setFluxSecret', { secret: '1234567' });
      expect(result).toEqual({ success: false, error: 'Secret must be at least 8 characters' });
    });

    test('accepts exactly 8 character secret', async () => {
      mockSetFluxSecret.mockResolvedValue(undefined);
      const result = await invoke('setFluxSecret', { secret: '12345678' });
      expect(result).toEqual({ success: true });
    });

    test('rejects empty string', async () => {
      const result = await invoke('setFluxSecret', { secret: '' });
      expect(result).toEqual({ success: false, error: 'Secret must be a non-empty string' });
    });

    test('rejects whitespace-only string (trimmed becomes empty)', async () => {
      const result = await invoke('setFluxSecret', { secret: '       ' });
      expect(result).toEqual({ success: false, error: 'Secret must be at least 8 characters' });
    });

    test('rejects null input', async () => {
      const result = await invoke('setFluxSecret', { secret: null });
      expect(result).toEqual({ success: false, error: 'Secret must be a non-empty string' });
    });

    test('rejects undefined input', async () => {
      const result = await invoke('setFluxSecret', { secret: undefined });
      expect(result).toEqual({ success: false, error: 'Secret must be a non-empty string' });
    });

    test('rejects non-string input', async () => {
      const result = await invoke('setFluxSecret', { secret: 12345678 });
      expect(result).toEqual({ success: false, error: 'Secret must be a non-empty string' });
    });
  });

  describe('setArgoSecret', () => {
    test('stores valid token and returns success', async () => {
      mockSetArgoSecret.mockResolvedValue(undefined);
      const result = await invoke('setArgoSecret', { token: 'valid-token-123' });
      expect(result).toEqual({ success: true });
      expect(mockSetArgoSecret).toHaveBeenCalledWith('valid-token-123');
    });

    test('trims whitespace before storing', async () => {
      mockSetArgoSecret.mockResolvedValue(undefined);
      const result = await invoke('setArgoSecret', { token: '  valid-token-123  ' });
      expect(result).toEqual({ success: true });
      expect(mockSetArgoSecret).toHaveBeenCalledWith('valid-token-123');
    });

    test('rejects token shorter than 8 characters', async () => {
      const result = await invoke('setArgoSecret', { token: 'short' });
      expect(result).toEqual({ success: false, error: 'Token must be at least 8 characters' });
      expect(mockSetArgoSecret).not.toHaveBeenCalled();
    });

    test('rejects null input', async () => {
      const result = await invoke('setArgoSecret', { token: null });
      expect(result).toEqual({ success: false, error: 'Token must be a non-empty string' });
    });

    test('rejects undefined input', async () => {
      const result = await invoke('setArgoSecret', { token: undefined });
      expect(result).toEqual({ success: false, error: 'Token must be a non-empty string' });
    });

    test('rejects non-string input', async () => {
      const result = await invoke('setArgoSecret', { token: 12345678 });
      expect(result).toEqual({ success: false, error: 'Token must be a non-empty string' });
    });
  });

  describe('deleteFluxSecret', () => {
    test('calls storage.deleteFluxSecret and returns success', async () => {
      mockDeleteFluxSecret.mockResolvedValue(undefined);
      const result = await invoke('deleteFluxSecret');
      expect(result).toEqual({ success: true });
      expect(mockDeleteFluxSecret).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteArgoSecret', () => {
    test('calls storage.deleteArgoSecret and returns success', async () => {
      mockDeleteArgoSecret.mockResolvedValue(undefined);
      const result = await invoke('deleteArgoSecret');
      expect(result).toEqual({ success: true });
      expect(mockDeleteArgoSecret).toHaveBeenCalledTimes(1);
    });
  });
});
