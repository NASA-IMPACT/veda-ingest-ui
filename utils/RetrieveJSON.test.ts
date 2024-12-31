import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import RetrieveJSON from './RetrieveJSON';
import GetGithubToken from './GetGithubToken';
import { Octokit } from '@octokit/rest';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));

vi.mock('./GetGithubToken');

describe('RetrieveJSON', () => {
  const mockGetContent = vi.fn();

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
          getContent: mockGetContent,
        },
      },
    }));
  });

  it('successfully retrieves JSON content', async () => {
    const mockRef = 'feat/mock-branch';
    const mockFileSha = 'mockSha';
    const mockFilePath = 'ingestion-data/staging/dataset-config/mock-branch.json';
    const mockContentBase64 = Buffer.from(JSON.stringify({ key: 'value' })).toString('base64');

    // Mock Octokit response
    mockGetContent.mockResolvedValue({
      data: {
        sha: mockFileSha,
        content: mockContentBase64,
        path: mockFilePath,
      },
    });

    const result = await RetrieveJSON(mockRef);

    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).toHaveBeenCalledWith({
      auth: 'mockToken',
    });
    expect(mockGetContent).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: mockRef,
      path: mockFilePath,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    expect(result).toEqual({
      fileSha: mockFileSha,
      filePath: mockFilePath,
      content: { key: 'value' },
    });
  });

  it('throws an error when environment variables are missing', async () => {
    delete process.env.OWNER;

    const mockRef = 'feat/mock-branch';

    await expect(RetrieveJSON(mockRef)).rejects.toThrow();
    expect(GetGithubToken).not.toHaveBeenCalled();
    expect(Octokit).not.toHaveBeenCalled();
  });

  it('throws an error when Octokit API call fails', async () => {
    const mockRef = 'feat/mock-branch';
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Octokit failure
    mockGetContent.mockRejectedValue(new Error('Failed to fetch content'));

    await expect(RetrieveJSON(mockRef)).rejects.toThrow('Failed to fetch content');
    expect(GetGithubToken).toHaveBeenCalled();
    expect(Octokit).toHaveBeenCalled();
    expect(mockGetContent).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
