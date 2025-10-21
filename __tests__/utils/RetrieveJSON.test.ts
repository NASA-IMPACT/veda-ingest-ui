import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  afterAll,
  beforeAll,
} from 'vitest';
import RetrieveJSON from '@/utils/githubUtils/RetrieveJSON';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { Octokit } from '@octokit/rest';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));
vi.mock('@/utils/githubUtils/GetGithubToken');

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

describe('RetrieveJSON', () => {
  const mockGetContent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    process.env.OWNER = 'mockOwner';
    process.env.REPO = 'mockRepo';

    (GetGithubToken as Mock).mockResolvedValue('mockToken');

    (Octokit as unknown as Mock).mockImplementation(() => ({
      rest: {
        repos: {
          getContent: mockGetContent,
        },
      },
    }));
  });

  describe('Dataset Retrieval', () => {
    it('successfully retrieves and parses a dataset JSON', async () => {
      const mockRef = 'feat/mock-dataset';
      const mockFilePath =
        'ingestion-data/staging/dataset-config/mock-dataset.json';
      const mockContentBase64 = Buffer.from(
        JSON.stringify({ collection: 'test-dataset' })
      ).toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          sha: 'mockSha123',
          content: mockContentBase64,
          path: mockFilePath,
        },
      });

      const result = await RetrieveJSON(mockRef, 'dataset');

      // Verify the correct path was used for the API call
      expect(mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({ path: mockFilePath })
      );
      // Verify the result
      expect(result).toEqual({
        fileSha: 'mockSha123',
        filePath: mockFilePath,
        content: { collection: 'test-dataset' },
      });
    });
  });

  describe('Collection Retrieval', () => {
    it('successfully retrieves and parses a collection JSON', async () => {
      const mockRef = 'feat/mock-collection';
      const mockFilePath =
        'ingestion-data/staging/collections/mock-collection.json';
      const mockContentBase64 = Buffer.from(
        JSON.stringify({ id: 'test-collection' })
      ).toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          sha: 'mockSha456',
          content: mockContentBase64,
          path: mockFilePath,
        },
      });

      const result = await RetrieveJSON(mockRef, 'collection');

      // Verify the correct path was used for the API call
      expect(mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({ path: mockFilePath })
      );
      // Verify the result
      expect(result).toEqual({
        fileSha: 'mockSha456',
        filePath: mockFilePath,
        content: { id: 'test-collection' },
      });
    });
  });

  describe('Error Handling', () => {
    it('throws an error for invalid ingestionType', async () => {
      const mockRef = 'feat/some-branch';
      // @ts-expect-error - Intentionally passing an invalid type
      await expect(RetrieveJSON(mockRef, 'invalid-type')).rejects.toThrow(
        'Invalid ingestionType provided: invalid-type'
      );
    });

    it('throws an error if getContent returns a directory listing', async () => {
      const mockRef = 'feat/dir-branch';
      // Mocking a directory response (an array) instead of a file
      mockGetContent.mockResolvedValue({ data: [] });

      await expect(RetrieveJSON(mockRef, 'dataset')).rejects.toThrow(
        'The path "ingestion-data/staging/dataset-config/dir-branch.json" does not point to a file.'
      );
    });

    it('throws an error if the file content is not valid JSON', async () => {
      const mockRef = 'feat/bad-json';
      const mockContentBase64 =
        Buffer.from('this is not json').toString('base64');
      mockGetContent.mockResolvedValue({
        data: {
          sha: 'mockSha789',
          content: mockContentBase64,
          path: 'ingestion-data/staging/dataset-config/bad-json.json',
        },
      });

      await expect(RetrieveJSON(mockRef, 'dataset')).rejects.toThrow(
        'Invalid JSON format in GitHub file: ingestion-data/staging/dataset-config/bad-json.json'
      );
    });

    it('throws an error when environment variables are missing', async () => {
      delete process.env.OWNER;
      await expect(RetrieveJSON('ref', 'dataset')).rejects.toThrow(
        'Missing required environment variables: OWNER or REPO'
      );
    });

    it('throws an error when the Octokit API call fails', async () => {
      mockGetContent.mockRejectedValue(new Error('GitHub API Error'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(RetrieveJSON('ref', 'dataset')).rejects.toThrow(
        'GitHub API Error'
      );

      consoleErrorMock.mockRestore();
    });
  });
});
