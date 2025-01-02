import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, Mock } from 'vitest';
import CreatePR from './CreatePR';
import { createOctokit } from './OctokitFactory';
import GetGithubToken from './GetGithubToken';
import { RequestError } from '@octokit/request-error';

vi.mock('./OctokitFactory');
vi.mock('./GetGithubToken');
vi.mock('./FormatFilename', () => ({
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

  beforeAll(() => {
    vi.stubEnv('TARGET_BRANCH', 'my_branch');
    vi.stubEnv('OWNER', 'mockOwner')
    vi.stubEnv('REPO', 'mockRepo')
  })
  afterAll(() => {
    vi.unstubAllEnvs();
  });
  
  beforeEach(() => {
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

    mockGetRef.mockResolvedValue({ data: { object: { sha: 'mockSha' } } });
    mockGetTree.mockResolvedValue({ data: { sha: 'mockTreeSha' } });
    mockCreateBlob.mockResolvedValue({ data: { sha: 'mockBlobSha' } });
    mockCreateTree.mockResolvedValue({ data: { sha: 'mockNewTreeSha' } });
    mockCreateCommit.mockResolvedValue({ data: { sha: 'mockCommitSha' } });
    mockCreateRef.mockResolvedValue({});
    mockCreatePullRequest.mockResolvedValue({ data: { html_url: 'mockPullRequestUrl' } });
  });

  it('creates a pull request successfully', async () => {
    const mockData = { collection: 'Test Collection', key1: 'value1' };
    const result = await CreatePR(mockData);

    expect(mockGetRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'heads/my_branch',
    });
    expect(result).toBe('mockPullRequestUrl');
  });

  it('throws an error when RequestError occurs', async () => {
    mockGetRef.mockRejectedValue(new Error('Test Error'));
    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(CreatePR({ collection: 'Test Collection' })).rejects.toThrow('Test Error');
    
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('throws an error when GitHub API returns a 422 error', async () => {
    const mockData = { collection: 'Test Collection', key: 'value' };

    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock 422 error for `octokit.rest.pulls.create`
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

    await expect(CreatePR(mockData)).rejects.toThrow('Branch already exists');

    expect(GetGithubToken).toHaveBeenCalled();
    expect(createOctokit).toHaveBeenCalledWith('mockToken');
    expect(mockCreatePullRequest).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      head: 'feat/test-collection',
      base: 'my_branch',
      title: 'Ingest Request for Test Collection',
    });
    
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('creates a pull request successfully in main branch if no TARGET_BRANCH env var supplied', async () => {
    delete process.env.TARGET_BRANCH;

    const mockData = { collection: 'Test Collection', key1: 'value1' };
    const result = await CreatePR(mockData);

    expect(mockGetRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'heads/main',
    });
    expect(result).toBe('mockPullRequestUrl');

  });

  it('throws an error when environment variables are missing', async () => {
    delete process.env.OWNER;

    await expect(CreatePR({ collection: 'Test Collection' })).rejects.toThrow(
      'Missing required environment variables: OWNER or REPO'
    );
  });

});
