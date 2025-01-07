import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import UpdatePR from '@/utils/githubUtils/UpdatePR';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { Octokit } from '@octokit/rest';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));

vi.mock('@/utils/githubUtils/GetGithubToken');

describe('UpdatePR', () => {
  const mockCreateOrUpdateFileContents = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    process.env.OWNER = 'mockOwner';
    process.env.REPO = 'mockRepo';

    // Mock GetGithubToken
    (GetGithubToken as Mock).mockResolvedValue('mockToken');

    // Mock Octokit
    (Octokit as unknown as Mock).mockImplementation(() => ({
      rest: {
        repos: {
          createOrUpdateFileContents: mockCreateOrUpdateFileContents,
        },
      },
    }));
  });

  it('successfully updates a pull request file', async () => {
    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };

    // Mock Octokit response
    mockCreateOrUpdateFileContents.mockResolvedValue({});

    await expect(UpdatePR(mockRef, mockFileSha, mockFilePath, mockFormData)).resolves.toBeUndefined();

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).toHaveBeenCalledWith({
      auth: 'mockToken',
    });
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      branch: mockRef,
      sha: mockFileSha,
      path: mockFilePath,
      message: 'update via UI',
      content: btoa(JSON.stringify(mockFormData, null, 2)),
    });
  });

  it('throws an error when environment variables are missing', async () => {
    delete process.env.OWNER;

    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };

    await expect(UpdatePR(mockRef, mockFileSha, mockFilePath, mockFormData)).rejects.toThrow(
      'Missing required environment variables: OWNER or REPO'
    );

    expect(GetGithubToken).not.toHaveBeenCalled();
    expect(Octokit).not.toHaveBeenCalled();
  });

  it('throws an error when GetGithubToken fails', async () => {
    (GetGithubToken as Mock).mockRejectedValue(new Error('Token retrieval failed'));

    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };

     // Suppress console.error for this test
     const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(UpdatePR(mockRef, mockFileSha, mockFilePath, mockFormData)).rejects.toThrow(
      'Token retrieval failed'
    );

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).not.toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('throws an error when Octokit API call fails', async () => {
    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});


    // Mock Octokit failure
    mockCreateOrUpdateFileContents.mockRejectedValue(new Error('API error'));

    await expect(UpdatePR(mockRef, mockFileSha, mockFilePath, mockFormData)).rejects.toThrow(
      'API error'
    );

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).toHaveBeenCalled();
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
