import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  Mock,
  beforeAll,
  afterAll,
} from 'vitest';
import { POST, PUT } from '@/app/api/create-ingest/route';
import { NextRequest } from 'next/server';
import UpdatePR from '@/utils/githubUtils/UpdatePR';
import CreatePR from '@/utils/githubUtils/CreatePR';
import { auth } from '@/auth';

vi.mock('@/utils/githubUtils/UpdatePR');
vi.mock('@/utils/githubUtils/CreatePR');
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const authMock = auth as Mock;

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

describe('POST /api/create-ingest', () => {
  it('returns GitHub URL on successful PR creation for a collection', async () => {
    const mockBody = {
      data: { collection: 'Test Collection' },
      ingestionType: 'collection',
      userComment: undefined,
    };
    const mockRequest = {
      json: vi.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    vi.mocked(CreatePR).mockResolvedValue('https://github.com/test/pr');

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(CreatePR).toHaveBeenCalledWith(
      mockBody.data,
      mockBody.ingestionType,
      mockBody.userComment
    );
    expect(jsonResponse).toEqual({ githubURL: 'https://github.com/test/pr' });
    expect(response.status).toBe(200);
  });

  it('returns an error if "data" is missing from the request body', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({ ingestionType: 'collection' }), // 'data' is missing
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse.error).toBe(
      'Missing or invalid "data" field in the request body.'
    );
    expect(response.status).toBe(400);
  });

  it('returns an error if "ingestionType" is missing or invalid', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({ data: { collection: 'Test' } }), // 'ingestionType' is missing
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse.error).toBe(
      'Missing or invalid "ingestionType". Must be "dataset" or "collection".'
    );
    expect(response.status).toBe(400);
  });

  it('returns an error when CreatePR fails', async () => {
    const mockBody = {
      data: { collection: 'Test Collection' },
      ingestionType: 'collection',
    };
    const mockRequest = {
      json: vi.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    vi.mocked(CreatePR).mockRejectedValue(new Error('Failed to create PR'));

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ error: 'Failed to create PR' });
    expect(response.status).toBe(400);
  });

  it('handles unexpected errors gracefully', async () => {
    const mockBody = {
      data: { collection: 'Test Collection' },
      ingestionType: 'collection',
    };
    const mockRequest = {
      json: vi.fn().mockResolvedValue(mockBody),
    } as unknown as NextRequest;

    vi.mocked(CreatePR).mockImplementation(() => {
      throw 'A non-error was thrown';
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });
    expect(response.status).toBe(500);
  });
});

describe('PUT /api/create-ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth to return a session with the required dataset:update scope
    authMock.mockResolvedValue({
      user: { name: 'Test User' },
      scopes: ['dataset:update'],
    });
  });

  it('returns success message on successful PR update', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        gitRef: 'test-ref',
        fileSha: 'test-sha',
        filePath: 'test-path',
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    vi.mocked(UpdatePR).mockResolvedValue(undefined);

    const response = await PUT(mockRequest);
    const jsonResponse = await response.json();

    expect(UpdatePR).toHaveBeenCalledWith('test-ref', 'test-sha', 'test-path', {
      key: 'value',
    });
    expect(jsonResponse).toEqual({ message: 'Data updated successfully' });
    expect(response.status).toBe(200);
  });

  it('returns an error message when PR update fails', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        gitRef: 'test-ref',
        fileSha: 'test-sha',
        filePath: 'test-path',
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    vi.mocked(UpdatePR).mockRejectedValue(new Error('Failed to update PR'));

    const response = await PUT(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ error: 'Failed to update PR' });
    expect(response.status).toBe(400);
  });

  it('handles unexpected errors gracefully', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        gitRef: 'test-ref',
        fileSha: 'test-sha',
        filePath: 'test-path',
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    vi.mocked(UpdatePR).mockImplementation(() => {
      throw 'A non-error was thrown';
    });

    const response = await PUT(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });
    expect(response.status).toBe(500);
  });

  it('returns an error when a required field is missing', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        gitRef: 'test-ref',
        fileSha: 'test-sha',
        formData: { key: 'value' },
      }), // filePath is missing
    } as unknown as NextRequest;

    const response = await PUT(mockRequest);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({
      error: 'Missing required fields: filePath',
    });
    expect(response.status).toBe(400);
  });
});
