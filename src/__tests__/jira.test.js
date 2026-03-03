import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock @forge/api before importing jira module
const mockRequestJira = jest.fn();
jest.unstable_mockModule('@forge/api', () => ({
  default: {
    asApp: () => ({ requestJira: mockRequestJira }),
  },
  route: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}));

const { submitDeployment } = await import('../jira.js');

describe('submitDeployment', () => {
  const payload = {
    deployments: [{ state: 'successful' }],
    providerMetadata: { product: 'FluxCD' },
  };

  beforeEach(() => {
    mockRequestJira.mockReset();
  });

  test('calls requestJira with correct path and method', async () => {
    mockRequestJira.mockResolvedValue({
      ok: true,
      json: async () => ({ acceptedDeployments: [{}], rejectedDeployments: [], unknownIssueKeys: [] }),
    });

    await submitDeployment(payload);

    expect(mockRequestJira).toHaveBeenCalledWith(
      '/rest/deployments/0.1/bulk',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  test('returns parsed response on success', async () => {
    const responseBody = {
      acceptedDeployments: [{ pipelineId: 'p1' }],
      rejectedDeployments: [],
      unknownIssueKeys: [],
    };
    mockRequestJira.mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });

    const result = await submitDeployment(payload);
    expect(result).toEqual(responseBody);
  });

  test('throws on non-ok response', async () => {
    mockRequestJira.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    await expect(submitDeployment(payload)).rejects.toThrow('Jira API error (400): Bad Request');
  });
});
