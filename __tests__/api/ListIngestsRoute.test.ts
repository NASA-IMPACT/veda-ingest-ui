import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { GET } from '@/app/api/list-ingests/route';
import ListPRs from '@/utils/githubUtils/ListPRs';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

vi.mock('@/utils/githubUtils/ListPRs', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

const ListPRsMock = ListPRs as Mock;
const authMock = auth as Mock;

describe('GET /api/list-ingests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default mock session that simulates a logged-in user with required scope
    authMock.mockResolvedValue({
      user: { name: 'Test User' },
      scopes: ['dataset:update'],
      tenants: ['tenant1', 'tenant3'],
    });
  });

  it('returns a filtered list of pull requests on success', async () => {
    // This mock data simulates the result *after* filtering
    const mockFilteredPRs = [
      { pr: { id: 1, title: 'Dataset PR' }, tenants: ['tenant1'] },
    ];
    ListPRsMock.mockResolvedValue(mockFilteredPRs);

    const mockRequest = new NextRequest(
      'http://localhost/api/list-ingests?ingestionType=dataset'
    );
    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(authMock).toHaveBeenCalledOnce();
    expect(ListPRsMock).toHaveBeenCalledWith('dataset');
    expect(response.status).toBe(200);
    expect(jsonResponse).toEqual({ githubResponse: mockFilteredPRs });
  });

  it('returns a 401 Unauthorized error if there is no session', async () => {
    // Override the default mock to simulate a logged-out user for this test
    authMock.mockResolvedValue(null);

    const mockRequest = new NextRequest(
      'http://localhost/api/list-ingests?ingestionType=dataset'
    );
    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(401);
    expect(jsonResponse).toEqual({ error: 'Unauthorized' });
    expect(ListPRsMock).not.toHaveBeenCalled();
  });

  it('returns a 400 error if ListPRs throws an error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    ListPRsMock.mockRejectedValue(new Error('GitHub API failed'));

    const mockRequest = new NextRequest(
      'http://localhost/api/list-ingests?ingestionType=dataset'
    );
    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse).toEqual({ error: 'GitHub API failed' });

    consoleErrorSpy.mockRestore();
  });

  it('returns a 400 error if ingestionType parameter is missing', async () => {
    const mockRequest = new NextRequest('http://localhost/api/list-ingests');
    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse).toEqual({
      error: 'ingestionType parameter is required',
    });
  });
});
