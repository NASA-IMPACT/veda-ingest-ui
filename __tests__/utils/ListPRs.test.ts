import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { Octokit } from '@octokit/rest';
import ListPRs from '@/utils/githubUtils/ListPRs';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { IngestPullRequest } from '@/types/ingest';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));
vi.mock('@/utils/githubUtils/GetGithubToken', () => ({
  default: vi.fn(),
}));

const mockList = vi.fn();
const mockListFiles = vi.fn();
const mockGetContent = vi.fn();

const mockOctokitInstance = {
  rest: {
    pulls: {
      list: mockList,
      listFiles: mockListFiles,
    },
    repos: {
      getContent: mockGetContent,
    },
  },
};

describe('ListPRs Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (GetGithubToken as any).mockResolvedValue('mocked-github-token');
    (Octokit as any).mockImplementation(() => mockOctokitInstance);
    process.env.OWNER = 'test-owner';
    process.env.REPO = 'test-repo';
    process.env.TARGET_BRANCH = 'main';
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('throws error if ingestionType is invalid', async () => {
    await expect(ListPRs('invalid' as any)).rejects.toThrow(
      'ingestionType parameter is required and must be either "collection" or "dataset".'
    );
  });

  it('returns empty array if no PRs found', async () => {
    mockList.mockResolvedValue({ data: [] });
    const result = await ListPRs('collection');
    expect(result).toEqual([]);
    expect(mockList).toHaveBeenCalled();
  });

  it('returns PRs with valid matching file and tenant', async () => {
    const pr = { number: 1, head: { sha: 'abc123' } };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [
        { filename: 'ingestion-data/staging/collections/test.json' },
        { filename: 'other.txt' },
      ],
    });
    const fileContent = Buffer.from(
      JSON.stringify({ tenant: 'tenant2' })
    ).toString('base64');
    mockGetContent.mockResolvedValue({
      data: { content: fileContent },
    });

    const result = await ListPRs('collection');
    expect(result).toHaveLength(1);
    expect(result[0].pr).toEqual(pr);
    expect(result[0].tenant).toEqual('tenant2');
  });

  it('returns PRs with tenant undefined if JSON parse fails', async () => {
    const pr = { number: 2, head: { sha: 'def456' } };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [{ filename: 'ingestion-data/staging/collections/bad.json' }],
    });
    const badContent = Buffer.from('not-json').toString('base64');
    mockGetContent.mockResolvedValue({
      data: { content: badContent },
    });

    const result = await ListPRs('collection');
    expect(result).toHaveLength(1);
    expect(result[0].pr).toEqual(pr);
    expect(result[0].tenant).toBeUndefined();
  });

  it('filters out PRs without matching files', async () => {
    const pr = { number: 3, head: { sha: 'ghi789' } };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [{ filename: 'not-a-match.txt' }],
    });

    const result = await ListPRs('collection');
    expect(result).toEqual([]);
  });

  it('throws and logs error if octokit fails', async () => {
    mockList.mockRejectedValue(new Error('API fail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(ListPRs('collection')).rejects.toThrow('API fail');
    expect(spy).toHaveBeenCalledWith(
      'Failed to list pull requests:',
      expect.any(Error)
    );
    spy.mockRestore();
  });
});
