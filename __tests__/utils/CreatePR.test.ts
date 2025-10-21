import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  Mock,
  afterAll,
  beforeAll,
} from 'vitest';
import CreatePR from '@/utils/githubUtils/CreatePR';
import { createOctokit } from '@/utils/githubUtils/OctokitFactory';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { RequestError } from '@octokit/request-error';
import { CleanAndPrettifyJSON } from '@/utils/CleanAndPrettifyJson';

vi.mock('@/utils/githubUtils/OctokitFactory');
vi.mock('@/utils/githubUtils/GetGithubToken');
vi.mock('@/utils/CleanAndPrettifyJson');
vi.mock('@/utils/FormatFilename', () => ({
  formatFilename: (name: string) => name.replace(/\s+/g, '-').toLowerCase(),
}));

describe('CreatePR', () => {
  const mockGetRef = vi.fn();
  const mockGetTree = vi.fn();
  const mockCreateBlob = vi.fn();
  const mockCreateTree = vi.fn();
  const mockCreateCommit = vi.fn();
  const mockCreateRef = vi.fn();
  const mockCreatePullRequest = vi.fn();

  // Reset mocks and environment before each test
  beforeEach(() => {
    vi.stubEnv('TARGET_BRANCH', 'my_branch');
    vi.stubEnv('OWNER', 'mockOwner');
    vi.stubEnv('REPO', 'mockRepo');
    vi.clearAllMocks();

    (GetGithubToken as Mock).mockResolvedValue('mockToken');
    (createOctokit as Mock).mockReturnValue({
      rest: {
        git: {
          getRef: mockGetRef,
          getTree: mockGetTree,
          createBlob: mockCreateBlob,
          createTree: mockCreateTree,
          createCommit: mockCreateCommit,
          createRef: mockCreateRef,
        },
        pulls: {
          create: mockCreatePullRequest,
        },
      },
    });

    (CleanAndPrettifyJSON as Mock).mockImplementation((data) =>
      JSON.stringify(data, null, 2)
    );

    // Default successful responses for the mocked Octokit calls
    mockGetRef.mockResolvedValue({ data: { object: { sha: 'mockSha' } } });
    mockGetTree.mockResolvedValue({ data: { sha: 'mockTreeSha' } });
    mockCreateBlob.mockResolvedValue({ data: { sha: 'mockBlobSha' } });
    mockCreateTree.mockResolvedValue({ data: { sha: 'mockNewTreeSha' } });
    mockCreateCommit.mockResolvedValue({ data: { sha: 'mockCommitSha' } });
    mockCreateRef.mockResolvedValue({});
    mockCreatePullRequest.mockResolvedValue({
      data: { html_url: 'mockPullRequestUrl' },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Collection Ingestion', () => {
    it('creates a pull request successfully using the id for filename and title', async () => {
      const mockData = {
        collection: 'My Test Collection',
        id: 'test-collection-id',
        key1: 'value1',
      };
      const result = await CreatePR(mockData, 'collection');

      // Verify correct path for collections, using the 'id'
      expect(mockCreateTree).toHaveBeenCalledWith(
        expect.objectContaining({
          tree: expect.arrayContaining([
            expect.objectContaining({
              path: 'ingestion-data/staging/collections/test-collection-id.json',
            }),
          ]),
        })
      );

      // Verify PR title uses the 'id'
      expect(mockCreatePullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ingest Request for test-collection-id',
        })
      );

      expect(result).toBe('mockPullRequestUrl');
    });

    it('throws an error if id is missing for collection type', async () => {
      // Mock data missing the 'id' field
      const mockData = { collection: 'Collection without ID' };

      await expect(CreatePR(mockData, 'collection')).rejects.toThrow(
        "Missing 'id' field for collection ingestion."
      );
    });
  });

  describe('Dataset Ingestion', () => {
    it('creates a pull request successfully using the collection name for filename and title', async () => {
      const mockData = { collection: 'My Test Dataset', key1: 'value1' };
      await CreatePR(mockData, 'dataset');

      // Verify correct path for datasets, using the 'collection' name
      expect(mockCreateTree).toHaveBeenCalledWith(
        expect.objectContaining({
          tree: expect.arrayContaining([
            expect.objectContaining({
              path: 'ingestion-data/staging/dataset-config/my-test-dataset.json',
            }),
          ]),
        })
      );

      // Verify PR title uses the 'collection' name
      expect(mockCreatePullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ingest Request for My Test Dataset',
        })
      );
    });
  });

  describe('General Error Handling', () => {
    it('throws an error when a GitHub API call fails', async () => {
      mockGetRef.mockRejectedValue(new Error('Test Error'));
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        CreatePR({ collection: 'Test Collection', id: 'test-id' }, 'collection')
      ).rejects.toThrow('Test Error');

      consoleErrorMock.mockRestore();
    });

    it('throws an error when GitHub API returns a 422 error', async () => {
      const mockData = {
        collection: 'Test Collection',
        id: 'existing-collection',
      };
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockCreatePullRequest.mockRejectedValue(
        new RequestError('Validation Failed', 422, {
          response: {
            data: { message: 'Branch already exists' },
            headers: {},
            status: 422,
            url: 'https://api.github.com/repos/mockOwner/mockRepo/pulls',
          },
          request: {
            method: 'POST',
            url: 'https://api.github.com/repos/mockOwner/mockRepo/pulls',
            headers: {},
          },
        })
      );

      await expect(CreatePR(mockData, 'collection')).rejects.toThrow(
        'Branch already exists'
      );
      consoleErrorMock.mockRestore();
    });

    it('throws an error when required environment variables are missing', async () => {
      delete process.env.OWNER;
      await expect(
        CreatePR({ collection: 'Test Collection', id: 'test-id' }, 'collection')
      ).rejects.toThrow(
        'Missing required environment variables: OWNER or REPO'
      );
    });

    it('throws an error for an invalid ingestionType', async () => {
      const mockData = { collection: 'Test Collection' };
      // @ts-expect-error - Intentionally passing an invalid type for testing
      await expect(CreatePR(mockData, 'invalidType')).rejects.toThrow(
        'Invalid ingestionType: invalidType'
      );
    });
  });
});
