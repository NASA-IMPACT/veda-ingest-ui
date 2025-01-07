import { describe, it, expect, vi } from 'vitest';
import { Octokit } from '@octokit/rest';
import ListPRs from '@/utils/githubUtils/ListPRs';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

vi.mock('@/utils/githubUtils/GetGithubToken', () => ({
  default: vi.fn(),
}));

vi.mock('@octokit/rest', () => {
  const OctokitMock = vi.fn(() => ({
    rest: {
      pulls: {
        list: vi.fn(),
      },
    },
  }));
  return { Octokit: OctokitMock };
});

describe('ListPRs', () => {
  it('should return filtered pull requests', async () => {
    const mockToken = 'mocked-github-token';
    const mockPRs = [
      { title: 'Ingest Request for Feature A', id: 1 },
      { title: 'Ingest Request for Feature B', id: 2 },
      { title: 'Other Request', id: 3 },
    ];
    const GetGithubTokenMock = GetGithubToken as unknown as ReturnType<typeof vi.fn>;
    const OctokitMock = Octokit as unknown as ReturnType<typeof vi.fn>;

    // Mock GetGithubToken to return a token
    GetGithubTokenMock.mockResolvedValue(mockToken);

    // Mock Octokit to return pull requests
    OctokitMock.mockImplementation(() => ({
      rest: {
        pulls: {
          list: vi.fn().mockResolvedValue({
            data: mockPRs,
          }),
        },
      },
    }));

    const result = await ListPRs();

    // Expect the filtered pull requests
    expect(result).toEqual([
      { title: 'Ingest Request for Feature A', id: 1 },
      { title: 'Ingest Request for Feature B', id: 2 },
    ]);
  });

  it('should throw an error when GetGithubToken fails', async () => {
    const GetGithubTokenMock = GetGithubToken as unknown as ReturnType<typeof vi.fn>;

    // Mock GetGithubToken to throw an error
    GetGithubTokenMock.mockRejectedValue(new Error('Token fetch failed'));

    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(ListPRs()).rejects.toThrow('Token fetch failed');

    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('should throw an error when Octokit fails', async () => {
    const mockToken = 'mocked-github-token';
    const GetGithubTokenMock = GetGithubToken as unknown as ReturnType<typeof vi.fn>;
    const OctokitMock = Octokit as unknown as ReturnType<typeof vi.fn>;

    // Mock GetGithubToken to return a token
    GetGithubTokenMock.mockResolvedValue(mockToken);
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Octokit to throw an error
    OctokitMock.mockImplementation(() => ({
      rest: {
        pulls: {
          list: vi.fn().mockRejectedValue(new Error('API call failed')),
        },
      },
    }));

    await expect(ListPRs()).rejects.toThrow('API call failed');
    
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
