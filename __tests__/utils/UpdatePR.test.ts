import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
vi.mock('@/config/env', () => ({
  cfg: {
    OWNER: 'mockOwner',
    REPO: 'mockRepo',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'mock-bucket',
  },
}));

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
    vi.resetModules();
    // Restore default env cfg mock for each test run
    vi.doMock('@/config/env', () => ({
      cfg: {
        OWNER: 'mockOwner',
        REPO: 'mockRepo',
        TARGET_BRANCH: 'main',
        AWS_REGION: 'us-west-2',
        NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'mock-bucket',
      },
    }));
    vi.clearAllMocks();

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

    await expect(
      UpdatePR(mockRef, mockFileSha, mockFilePath, mockFormData)
    ).resolves.toBeUndefined();

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
    // Re-mock cfg to simulate missing OWNER
    vi.doMock('@/config/env', () => ({
      cfg: {
        OWNER: '',
        REPO: 'mockRepo',
        TARGET_BRANCH: 'main',
        AWS_REGION: 'us-west-2',
        NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'mock-bucket',
      },
    }));
    // Re-import UpdatePR so it picks up new mock
    const UpdatePRMissing = (await import('@/utils/githubUtils/UpdatePR'))
      .default;

    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };

    await expect(
      UpdatePRMissing(mockRef, mockFileSha, mockFilePath, mockFormData)
    ).rejects.toThrow('Missing required environment variables: OWNER or REPO');

    expect(GetGithubToken).not.toHaveBeenCalled();
    expect(Octokit).not.toHaveBeenCalled();
  });

  it('throws an error when GetGithubToken fails', async () => {
    // Ensure default cfg is active for this test
    const UpdatePRDefault = (await import('@/utils/githubUtils/UpdatePR'))
      .default;
    (GetGithubToken as Mock).mockRejectedValue(
      new Error('Token retrieval failed')
    );

    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };

    // Suppress console.error for this test
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(
      UpdatePRDefault(mockRef, mockFileSha, mockFilePath, mockFormData)
    ).rejects.toThrow('Token retrieval failed');

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).not.toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('throws an error when Octokit API call fails', async () => {
    const UpdatePRDefault = (await import('@/utils/githubUtils/UpdatePR'))
      .default;
    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'path/to/file.json';
    const mockFormData = { key: 'value' };
    // Suppress console.error for this test
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock Octokit failure
    mockCreateOrUpdateFileContents.mockRejectedValue(new Error('API error'));

    await expect(
      UpdatePRDefault(mockRef, mockFileSha, mockFilePath, mockFormData)
    ).rejects.toThrow('API error');

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).toHaveBeenCalled();
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalled();
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
