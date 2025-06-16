import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import CreatePR from '@/utils/githubUtils/CreatePR';
import { createOctokit } from '@/utils/githubUtils/OctokitFactory';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { RequestError } from '@octokit/request-error';
import { CleanAndPrettifyJSON } from '@/utils/CleanAndPrettifyJson';

// Mocking the dependencies
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
    // Stub env vars here to reset for each test
    vi.stubEnv('TARGET_BRANCH', 'my_branch');
    vi.stubEnv('OWNER', 'mockOwner');
    vi.stubEnv('REPO', 'mockRepo');

    vi.clearAllMocks();

    // Mock the Octokit factory and its methods
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

    // Mock the JSON utility
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

  // Clean up environment variables after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a pull request successfully for a collection', async () => {
    const mockData = { collection: 'Test Collection', key1: 'value1' };
    const result = await CreatePR(mockData, 'collection');

    expect(mockGetRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'heads/my_branch',
    });

    // Verify the correct path is used for collections
    expect(mockCreateTree).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: expect.arrayContaining([
          expect.objectContaining({
            path: 'ingestion-data/staging/collections/test-collection.json',
          }),
        ]),
      })
    );
    expect(result).toBe('mockPullRequestUrl');
  });

  it('creates a pull request successfully for a dataset', async () => {
    const mockData = { collection: 'Test Dataset', key1: 'value1' };
    await CreatePR(mockData, 'dataset');

    // Verify the correct path is used for datasets
    expect(mockCreateTree).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: expect.arrayContaining([
          expect.objectContaining({
            path: 'ingestion-data/staging/dataset-config/test-dataset.json',
          }),
        ]),
      })
    );
  });

  it('throws a RequestError when a GitHub API call fails', async () => {
    mockGetRef.mockRejectedValue(new Error('Test Error'));
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(
      CreatePR({ collection: 'Test Collection' }, 'collection')
    ).rejects.toThrow('Test Error');

    consoleErrorMock.mockRestore();
  });

  it('throws an error when GitHub API returns a 422 error for an existing branch', async () => {
    const mockData = { collection: 'Test Collection', key: 'value' };
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock a 422 error specifically for the pull request creation
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

    // Verify the correct pull request parameters were used
    expect(mockCreatePullRequest).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      head: 'feat/test-collection',
      base: 'my_branch',
      title: 'Ingest Request for Test Collection',
    });

    consoleErrorMock.mockRestore();
  });

  it('uses the main branch if TARGET_BRANCH environment variable is not supplied', async () => {
    delete process.env.TARGET_BRANCH;

    const mockData = { collection: 'Test Collection', key1: 'value1' };
    const result = await CreatePR(mockData, 'collection');

    expect(mockGetRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'heads/main',
    });
    expect(result).toBe('mockPullRequestUrl');
  });

  it('throws an error when required environment variables are missing', async () => {
    delete process.env.OWNER;

    await expect(
      CreatePR({ collection: 'Test Collection' }, 'collection')
    ).rejects.toThrow('Missing required environment variables: OWNER or REPO');
  });

  it('throws an error for an invalid ingestionType', async () => {
    const mockData = { collection: 'Test Collection' };
    // @ts-expect-error - Intentionally passing an invalid type for testing
    await expect(CreatePR(mockData, 'invalidType')).rejects.toThrow(
      'Invalid ingestionType: invalidType'
    );
  });
});
