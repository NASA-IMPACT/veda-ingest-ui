
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { Octokit } from '@octokit/rest';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: vi.fn(),
}));

describe('GetGithubToken', () => {
  const mockAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock process.env values
    process.env.APP_ID = '123';
    process.env.INSTALLATION_ID = '456';
    process.env.GITHUB_PRIVATE_KEY = 'mock-private-key';

    // Mock Octokit behavior
    (Octokit as unknown as Mock).mockImplementation(() => ({
      auth: mockAuth,
    }));
  });

  it('returns a valid token on success', async () => {
    // Mock auth token response
    mockAuth.mockResolvedValue({ token: 'mock-token' });

    const token = await GetGithubToken();

    expect(token).toBe('mock-token');
    expect(Octokit).toHaveBeenCalledWith({
      authStrategy: expect.any(Function),
      auth: {
        appId: 123,
        privateKey: 'mock-private-key',
        installationId: 456,
      },
    });
    expect(mockAuth).toHaveBeenCalledWith({
      type: 'installation',
      installationId: 456,
    });
  });

  it('throws an error when environment variables are missing', async () => {
    delete process.env.APP_ID;
  
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(GetGithubToken()).rejects.toThrow(
      'Missing or invalid environment variables for GitHub authentication'
    );
    expect(Octokit).not.toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('throws an error when Octokit auth fails', async () => {
    mockAuth.mockRejectedValue(new Error('Failed to fetch GitHub token'));
  
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(GetGithubToken()).rejects.toThrow('Failed to fetch GitHub token');
    expect(mockAuth).toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
