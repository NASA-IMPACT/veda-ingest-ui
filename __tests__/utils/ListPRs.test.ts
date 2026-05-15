import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
vi.mock('@/config/env', () => ({
  cfg: {
    OWNER: 'test-owner',
    REPO: 'test-repo',
    TARGET_BRANCH: 'main',
    VEDA_TENANT_FILTER_FIELD: 'local:tenant',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'mock-bucket',
  },
}));

import { Octokit } from '@octokit/rest';
import ListPRs from '@/utils/githubUtils/ListPRs';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

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

const mockedGetGithubToken = vi.mocked(GetGithubToken);
const mockedOctokit = vi.mocked(Octokit);

describe('ListPRs Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetGithubToken.mockResolvedValue('mocked-github-token');
    mockedOctokit.mockImplementation(function () {
      return mockOctokitInstance as unknown as Octokit;
    });
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('throws error if ingestionType is invalid', async () => {
    await expect(ListPRs('invalid' as 'collection')).rejects.toThrow(
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
    const pr = {
      number: 1,
      title: 'collection Ingest Request for test',
      user: { login: 'ingest-bot[bot]', type: 'Bot' },
      head: { sha: 'abc123', ref: 'feat/test' },
    };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [
        { filename: 'ingestion-data/staging/collections/test.json' },
        { filename: 'other.txt' },
      ],
    });
    const fileContent = Buffer.from(
      JSON.stringify({ 'local:tenant': 'tenant2' })
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
    const pr = {
      number: 2,
      title: 'collection Ingest Request for bad',
      user: { login: 'ingest-bot[bot]', type: 'Bot' },
      head: { sha: 'def456', ref: 'feat/bad' },
    };
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
    const pr = {
      number: 3,
      title: 'collection Ingest Request for nope',
      user: { login: 'ingest-bot[bot]', type: 'Bot' },
      head: { sha: 'ghi789', ref: 'feat/nope' },
    };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [{ filename: 'not-a-match.txt' }],
    });

    const result = await ListPRs('collection');
    expect(result).toEqual([]);
  });

  it('filters out manual PRs that do not match app naming conventions', async () => {
    const manualPr = {
      number: 4,
      title: 'Update GEDI WMTS collection',
      user: { login: 'human-user', type: 'User' },
      head: { sha: 'jkl012', ref: 'collection/GEDI' },
    };

    mockList.mockResolvedValue({ data: [manualPr] });

    const result = await ListPRs('collection');
    expect(result).toEqual([]);
    expect(mockListFiles).not.toHaveBeenCalled();
  });

  it('includes user-authored PRs when branch/title follow UI naming conventions', async () => {
    const userPrWithConventions = {
      number: 5,
      title: 'collection Ingest Request for GEDI',
      user: { login: 'human-user', type: 'User' },
      head: { sha: 'mno345', ref: 'feat/GEDI' },
    };

    mockList.mockResolvedValue({ data: [userPrWithConventions] });
    mockListFiles.mockResolvedValue({
      data: [{ filename: 'ingestion-data/staging/collections/GEDI.json' }],
    });
    const fileContent = Buffer.from(
      JSON.stringify({ 'local:tenant': 'tenant2' })
    ).toString('base64');
    mockGetContent.mockResolvedValue({
      data: { content: fileContent },
    });

    const result = await ListPRs('collection');
    expect(result).toHaveLength(1);
    expect(result[0].pr).toEqual(userPrWithConventions);
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
