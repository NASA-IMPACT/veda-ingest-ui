import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { GET } from '@/app/api/list-ingests/route';
import ListPRs from '@/utils/githubUtils/ListPRs';
import { NextRequest } from 'next/server';

vi.mock('@/utils/githubUtils/ListPRs', () => ({
  default: vi.fn(),
}));

const ListPRsMock = ListPRs as Mock;

describe('GET /api/list-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with ingestionType="dataset"', () => {
    it('returns a list of pull requests on success', async () => {
      const mockPRs = [{ id: 1, title: 'Dataset PR' }];
      ListPRsMock.mockResolvedValue(mockPRs);

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=dataset'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(ListPRsMock).toHaveBeenCalledWith('dataset');
      expect(jsonResponse).toEqual({ githubResponse: mockPRs });
      expect(response.status).toBe(200);
    });

    it('returns a 400 error on a handled exception', async () => {
      ListPRsMock.mockRejectedValue(new Error('Dataset-specific error'));

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=dataset'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(ListPRsMock).toHaveBeenCalledWith('dataset');
      expect(jsonResponse).toEqual({ error: 'Dataset-specific error' });
      expect(response.status).toBe(400);
    });

    it('returns a 500 error on an unhandled exception', async () => {
      ListPRsMock.mockRejectedValue('Some unhandled string error');
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=dataset'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(ListPRsMock).toHaveBeenCalledWith('dataset');
      expect(jsonResponse).toEqual({
        error: 'An unexpected error occurred on the server.',
      });
      expect(response.status).toBe(500);
      consoleErrorMock.mockRestore();
    });
  });

  describe('with ingestionType="collection"', () => {
    it('returns a list of pull requests on success', async () => {
      const mockPRs = [{ id: 2, title: 'Collection PR' }];
      ListPRsMock.mockResolvedValue(mockPRs);

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=collection'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(ListPRsMock).toHaveBeenCalledWith('collection');
      expect(jsonResponse).toEqual({ githubResponse: mockPRs });
      expect(response.status).toBe(200);
    });

    it('returns a 400 error on a handled exception', async () => {
      ListPRsMock.mockRejectedValue(new Error('Collection-specific error'));

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=collection'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(ListPRsMock).toHaveBeenCalledWith('collection');
      expect(jsonResponse).toEqual({ error: 'Collection-specific error' });
      expect(response.status).toBe(400);
    });
  });

  describe('Parameter Handling', () => {
    const errorMessage =
      'ingestionType parameter is required and must be either "collection" or "dataset".';

    it('returns a 400 error if ingestionType is missing', async () => {
      ListPRsMock.mockRejectedValue(new Error(errorMessage));

      const mockRequest = new NextRequest('http://localhost/api/list-requests');
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(response.status).toBe(400);
      expect(jsonResponse.error).toBe(errorMessage);
    });

    it('returns a 400 error if ingestionType is invalid', async () => {
      ListPRsMock.mockRejectedValue(new Error(errorMessage));

      const mockRequest = new NextRequest(
        'http://localhost/api/list-requests?ingestionType=invalid'
      );
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(response.status).toBe(400);
      expect(jsonResponse.error).toBe(errorMessage);
    });
  });
});
