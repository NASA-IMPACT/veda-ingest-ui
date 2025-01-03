import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/retrieve-ingest/route';
import RetrieveJSON from '@/utils/RetrieveJSON';
import { NextRequest } from 'next/server';

// Mock implementation
vi.mock('@/utils/RetrieveJSON', () => {
  return {
    default: vi.fn(),
  };
});

describe('GET /api/retrieve-json', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  })

  it('returns the retrieved JSON on success', async () => {
    const mockResponse = {
      fileSha: 'mockFileSha',
      filePath: 'mock/file/path',
      content: { key: 'value' },
    };
    vi.mocked(RetrieveJSON).mockResolvedValue(mockResponse);

    const mockRequest = {
      nextUrl: {
        searchParams: {
          get: vi.fn().mockReturnValue('mockRef'),
        },
      },
    } as unknown as NextRequest;

    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(RetrieveJSON).toHaveBeenCalledWith('mockRef');
    expect(jsonResponse).toEqual(mockResponse);
    expect(response.status).toBe(200);
  });

  it('returns a 400 error on a handled exception', async () => {
    vi.mocked(RetrieveJSON).mockImplementationOnce(() => {
      throw new Error('Mocked error message');
    });

    const mockRequest = {
      nextUrl: {
        searchParams: {
          get: vi.fn().mockReturnValue('mockRef'),
        },
      },
    } as unknown as NextRequest;

    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(RetrieveJSON).toHaveBeenCalledWith('mockRef');
    expect(jsonResponse).toEqual({ error: 'Mocked error message' });
    expect(response.status).toBe(400);
  });

  it('returns a 500 error on an unhandled exception', async () => {
    vi.mocked(RetrieveJSON).mockImplementationOnce(() => {
      throw 'Unhandled error';
    });

    const mockRequest = {
      nextUrl: {
        searchParams: {
          get: vi.fn().mockReturnValue('mockRef'),
        },
      },
    } as unknown as NextRequest;

    const response = await GET(mockRequest);
    const jsonResponse = await response.json();

    expect(RetrieveJSON).toHaveBeenCalledWith('mockRef');
    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });
    expect(response.status).toBe(500);
  });

  it('returns a 400 error when the query parameter is missing', async () => {
    const mockRequest = {
      nextUrl: {
        searchParams: {
          get: vi.fn().mockReturnValue(null), // Simulate missing query parameter
        },
      },
    } as unknown as NextRequest;
  
    const response = await GET(mockRequest);
    const jsonResponse = await response.json();
  
    expect(RetrieveJSON).not.toHaveBeenCalled();
    expect(jsonResponse).toEqual({ error: 'Invalid or missing query parameter' });
    expect(response.status).toBe(400);
  });
});

