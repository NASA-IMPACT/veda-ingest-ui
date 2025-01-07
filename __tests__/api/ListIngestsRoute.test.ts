import { describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/list-ingests/route';
import ListPRs from '@/utils/githubUtils/ListPRs';
import { NextRequest } from 'next/server';
import { Endpoints } from '@octokit/types';

type PullRequest = Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][number];

// pick values from pull requests that we care about in front end
type SimplifiedPullRequest = Pick<PullRequest, 'id' | 'title'> & {
  head: Pick<PullRequest['head'], 'ref'>;
};

// Mock implementation
vi.mock('@/utils/githubUtils/ListPRs', () => {
  const mockPRs: SimplifiedPullRequest[] = [
    {
      id: 1,
      title: 'Ingest Request for Dataset A',
      head: {
        ref: 'feature/ingest-dataset-a',
      },
    },
    {
      id: 2,
      title: 'Ingest Request for Dataset B',
      head: {
        ref: 'feature/ingest-dataset-b',
      },
    },
  ];

  return {
    default: vi.fn().mockResolvedValue(mockPRs),
  };
});

describe('GET /api/list-ingests', () => {
  it('returns a list of pull requests on success', async () => {
    const mockRequest = {} as NextRequest;
    const response = await GET(mockRequest);

    // Parse the response
    const jsonResponse = await response.json();

    // Assertions
    expect(ListPRs).toHaveBeenCalled(); // Verify ListPRs was called
    expect(jsonResponse).toEqual({
      githubResponse: [
        {
          id: 1,
          title: 'Ingest Request for Dataset A',
          head: {
            ref: 'feature/ingest-dataset-a',
          },
        },
        {
          id: 2,
          title: 'Ingest Request for Dataset B',
          head: {
            ref: 'feature/ingest-dataset-b',
          },
        },
      ],
    });
    expect(response.status).toBe(200);
  });

  it('returns a 400 error on a handled exception', async () => {
    // Mock an error
    vi.mocked(ListPRs).mockImplementationOnce(() => {
      throw new Error('Mocked error message');
    });

    const mockRequest = {} as NextRequest;
    const response = await GET(mockRequest);

    // Parse the response
    const jsonResponse = await response.json();

    // Assertions
    expect(ListPRs).toHaveBeenCalled();
    expect(jsonResponse).toEqual({ error: 'Mocked error message' });
    expect(response.status).toBe(400);
  });

  it('returns a 500 error on an unhandled exception', async () => {
    // Mock an unhandled exception
    vi.mocked(ListPRs).mockImplementationOnce(() => {
      throw 'Unhandled error';
    });

    const mockRequest = {} as NextRequest;
    const response = await GET(mockRequest);

    // Parse the response
    const jsonResponse = await response.json();

    // Assertions
    expect(ListPRs).toHaveBeenCalled();
    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });
    expect(response.status).toBe(500);
  });
});
