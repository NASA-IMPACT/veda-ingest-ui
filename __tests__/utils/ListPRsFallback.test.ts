import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Hoist cfg mock so it is applied before ListPRs is imported
vi.mock('@/config/env', () => ({
  cfg: {
    OWNER: 'test-owner',
    REPO: 'test-repo',
    TARGET_BRANCH: 'main',
    // VEDA_TENANT_FILTER_FIELD intentionally absent to exercise fallback to 'eic:tenant'
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

describe('ListPRs fallback tenant behavior', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetGithubToken.mockResolvedValue('mocked-github-token');
    mockedOctokit.mockImplementation(function () {
      return mockOctokitInstance as unknown as Octokit;
    });
  });

  it('falls back to eic:tenant when VEDA_TENANT_FILTER_FIELD is unset and ignores other tenant-like keys', async () => {
    const pr = { number: 1, head: { sha: 'abc123' } };
    mockList.mockResolvedValue({ data: [pr] });
    mockListFiles.mockResolvedValue({
      data: [{ filename: 'ingestion-data/staging/collections/test.json' }],
    });

    const fileContent = Buffer.from(
      JSON.stringify({
        'eic:tenant': 'tenant-eic',
        'foo:tenant': 'tenant-foo',
        tenant: 'tenant-legacy',
      })
    ).toString('base64');

    mockGetContent.mockResolvedValue({
      data: { content: fileContent },
    });

    const result = await ListPRs('collection');

    expect(result).toHaveLength(1);
    expect(result[0].pr).toEqual(pr);
    expect(result[0].tenant).toBe('tenant-eic');
  });
});
