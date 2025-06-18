import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Octokit } from '@octokit/rest';
import ListPRs from '@/utils/githubUtils/ListPRs';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

// Mock the dependent modules
vi.mock('@/utils/githubUtils/GetGithubToken', () => ({
  default: vi.fn(),
}));

const listFilesMock = vi.fn();
const listPRsMock = vi.fn();

vi.mock('@octokit/rest', () => {
  const OctokitMock = vi.fn(() => ({
    rest: {
      pulls: {
        list: listPRsMock,
        listFiles: listFilesMock,
      },
    },
  }));
  return { Octokit: OctokitMock };
});

// Type the mocked GetGithubToken for easier use
const GetGithubTokenMock = GetGithubToken as Mock;

describe('ListPRs Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    GetGithubTokenMock.mockResolvedValue('mocked-github-token');
  });

  describe('list dataset PRs', () => {
    it('should return filtered pull requests for datasets', async () => {
      // Mock the list of all open pull requests
      const mockPRs = [{ number: 1 }, { number: 2 }, { number: 3 }];
      listPRsMock.mockResolvedValue({ data: mockPRs });

      listFilesMock.mockImplementation(({ pull_number }) => {
        if (pull_number === 1) {
          // This PR has a matching dataset file
          return Promise.resolve({
            data: [
              {
                filename:
                  'ingestion-data/staging/dataset-config/my-dataset.json',
              },
            ],
          });
        }
        if (pull_number === 2) {
          // This PR has a file from the wrong directory
          return Promise.resolve({
            data: [
              {
                filename:
                  'ingestion-data/staging/collections/my-collection.json',
              },
            ],
          });
        }
        // This PR has no matching files
        return Promise.resolve({ data: [{ filename: 'README.md' }] });
      });

      const result = await ListPRs('dataset');

      // Expect only the PR with the matching dataset file to be returned
      expect(result).toEqual([{ number: 1 }]);
      expect(listPRsMock).toHaveBeenCalledOnce();
      expect(listFilesMock).toHaveBeenCalledTimes(3);
    });

    it('should throw an error when GetGithubToken fails', async () => {
      // Mock GetGithubToken to throw an error
      GetGithubTokenMock.mockRejectedValue(new Error('Token fetch failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(ListPRs('dataset')).rejects.toThrow('Token fetch failed');

      consoleErrorMock.mockRestore();
    });

    it('should throw an error when pulls.list fails', async () => {
      // Mock the pulls.list method to throw an error
      listPRsMock.mockRejectedValue(new Error('API call failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(ListPRs('dataset')).rejects.toThrow('API call failed');

      consoleErrorMock.mockRestore();
    });

    it('should throw an error when pulls.listFiles fails', async () => {
      // Mock pulls.list to succeed but pulls.listFiles to fail
      listPRsMock.mockResolvedValue({ data: [{ number: 1 }] });
      listFilesMock.mockRejectedValue(new Error('File list fetch failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(ListPRs('dataset')).rejects.toThrow(
        'File list fetch failed'
      );

      consoleErrorMock.mockRestore();
    });
  });

  describe('list collection PRs', () => {
    it('should return filtered pull requests for collections', async () => {
      // Mock the list of all open pull requests
      const mockPRs = [{ number: 1 }, { number: 2 }, { number: 3 }];
      listPRsMock.mockResolvedValue({ data: mockPRs });

      // Mock the files returned for each pull request
      listFilesMock.mockImplementation(({ pull_number }) => {
        if (pull_number === 1) {
          // This PR has a file from the wrong directory
          return Promise.resolve({
            data: [
              {
                filename:
                  'ingestion-data/staging/dataset-config/my-dataset.json',
              },
            ],
          });
        }
        if (pull_number === 2) {
          // This PR has a matching collection file
          return Promise.resolve({
            data: [
              {
                filename:
                  'ingestion-data/staging/collections/my-collection.json',
              },
            ],
          });
        }
        // This PR has no matching files
        return Promise.resolve({ data: [{ filename: 'README.md' }] });
      });

      // Call the function with 'collection' type
      const result = await ListPRs('collection');

      // Expect only the PR with the matching collection file to be returned
      expect(result).toEqual([{ number: 2 }]);
      expect(listPRsMock).toHaveBeenCalledOnce();
      expect(listFilesMock).toHaveBeenCalledTimes(3);
    });

    it('should throw an error when GetGithubToken fails', async () => {
      GetGithubTokenMock.mockRejectedValue(new Error('Token fetch failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(ListPRs('collection')).rejects.toThrow('Token fetch failed');
      consoleErrorMock.mockRestore();
    });

    it('should throw an error when pulls.list fails', async () => {
      listPRsMock.mockRejectedValue(new Error('API call failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(ListPRs('collection')).rejects.toThrow('API call failed');
      consoleErrorMock.mockRestore();
    });

    it('should throw an error when pulls.listFiles fails', async () => {
      listPRsMock.mockResolvedValue({ data: [{ number: 1 }] });
      listFilesMock.mockRejectedValue(new Error('File list fetch failed'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(ListPRs('collection')).rejects.toThrow(
        'File list fetch failed'
      );
      consoleErrorMock.mockRestore();
    });
  });

  describe('Parameter Error Handling', () => {
    it('should throw an error if ingestionType is not provided', async () => {
      // The 'any' cast bypasses TypeScript's compile-time checks for this specific test case.
      await expect(ListPRs(undefined as any)).rejects.toThrow(
        'ingestionType parameter is required and must be either "collection" or "dataset".'
      );
    });

    it('should throw an error if ingestionType is invalid', async () => {
      await expect(ListPRs('invalid-type' as any)).rejects.toThrow(
        'ingestionType parameter is required and must be either "collection" or "dataset".'
      );
    });
  });
});
