import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

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

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => mockOctokitInstance),
}));

vi.mock('@/utils/githubUtils/GetGithubToken', () => ({
  default: vi.fn().mockResolvedValue('mocked-github-token'),
}));

describe('ListPRs fallback tenant behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('falls back to eic:tenant when VEDA_TENANT_FILTER_FIELD is unset and ignores other tenant-like keys', async () => {
    vi.doMock('@/config/env', () => ({
      cfg: {
        OWNER: 'test-owner',
        REPO: 'test-repo',
        TARGET_BRANCH: 'main',
        AWS_REGION: 'us-west-2',
        NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'mock-bucket',
      },
    }));

    const { default: ListPRs } = await import('@/utils/githubUtils/ListPRs');

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
