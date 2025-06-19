import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { GET } from '@/app/api/retrieve-ingest/route';
import RetrieveJSON from '@/utils/githubUtils/RetrieveJSON';
import { NextRequest } from 'next/server';

vi.mock('@/utils/githubUtils/RetrieveJSON', () => {
  return {
    default: vi.fn(),
  };
});

const createMockRequest = (params: Record<string, string>): NextRequest => {
  const url = new URL('http://localhost/api/retrieve-ingest');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return new NextRequest(url);
};

const RetrieveJSONMock = RetrieveJSON as Mock;

describe('GET /api/retrieve-ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with ingestionType="dataset"', () => {
    it('returns the retrieved JSON on success', async () => {
      const mockResponse = {
        fileSha: 'mockFileSha',
        filePath: 'mock/dataset/path',
        content: { collection: 'valid-dataset' },
      };
      RetrieveJSONMock.mockResolvedValue(mockResponse);

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'dataset',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).toHaveBeenCalledWith('mockRef', 'dataset');
      expect(jsonResponse).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    it('returns a 400 error if "collection" key is missing or not a non-empty string', async () => {
      const mockResponse = {
        fileSha: 'mockFileSha',
        filePath: 'mock/dataset/path',
        content: { id: 'some-id' },
      };
      RetrieveJSONMock.mockResolvedValue(mockResponse);

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'dataset',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).toHaveBeenCalledWith('mockRef', 'dataset');
      expect(jsonResponse.error).toBe(
        'Invalid file format for dataset. Expected a JSON object with a non-empty "collection" key.'
      );
      expect(response.status).toBe(400);
    });
  });

  describe('with ingestionType="collection"', () => {
    it('returns the retrieved JSON on success', async () => {
      const mockResponse = {
        fileSha: 'mockFileSha',
        filePath: 'mock/collection/path',
        content: { id: 'valid-collection-id', collection: 'some-name' },
      };
      RetrieveJSONMock.mockResolvedValue(mockResponse);

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'collection',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).toHaveBeenCalledWith('mockRef', 'collection');
      expect(jsonResponse).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    it('returns a 400 error if "id" key is missing or not a non-empty string', async () => {
      const mockResponse = {
        fileSha: 'mockFileSha',
        filePath: 'mock/collection/path',
        content: { collection: 'some-name' },
      };
      RetrieveJSONMock.mockResolvedValue(mockResponse);

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'collection',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).toHaveBeenCalledWith('mockRef', 'collection');
      expect(jsonResponse.error).toBe(
        'Invalid file format for collection. Expected a JSON object with a non-empty "id" key.'
      );
      expect(response.status).toBe(400);
    });
  });

  describe('Parameter and General Error Handling', () => {
    it('returns a 400 error if "ref" query parameter is missing', async () => {
      const mockRequest = createMockRequest({ ingestionType: 'dataset' }); // 'ref' is missing
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).not.toHaveBeenCalled();
      expect(jsonResponse.error).toBe(
        'Missing required query parameter: "ref".'
      );
      expect(response.status).toBe(400);
    });

    it('returns a 400 error if "ingestionType" query parameter is missing', async () => {
      const mockRequest = createMockRequest({ ref: 'mockRef' });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).not.toHaveBeenCalled();
      expect(jsonResponse.error).toBe(
        'Missing or invalid "ingestionType". Must be "dataset" or "collection".'
      );
      expect(response.status).toBe(400);
    });

    it('returns a 400 error if "ingestionType" is invalid', async () => {
      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'invalid_type',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(RetrieveJSONMock).not.toHaveBeenCalled();
      expect(jsonResponse.error).toBe(
        'Missing or invalid "ingestionType". Must be "dataset" or "collection".'
      );
      expect(response.status).toBe(400);
    });

    it('returns a 400 error on a handled exception from RetrieveJSON', async () => {
      RetrieveJSONMock.mockRejectedValue(
        new Error('Mocked error from utility')
      );

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'dataset',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(jsonResponse.error).toBe('Mocked error from utility');
      expect(response.status).toBe(400);
    });

    it('returns a 500 error on an unhandled exception', async () => {
      RetrieveJSONMock.mockRejectedValue('Some unhandled error');
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockRequest = createMockRequest({
        ref: 'mockRef',
        ingestionType: 'dataset',
      });
      const response = await GET(mockRequest);
      const jsonResponse = await response.json();

      expect(jsonResponse.error).toBe(
        'An unexpected error occurred on the server.'
      );
      expect(response.status).toBe(500);

      consoleErrorMock.mockRestore();
    });
  });
});
