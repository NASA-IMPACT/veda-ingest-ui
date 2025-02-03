import { describe, expect, it, vi } from 'vitest';
import { POST, PUT } from '@/app/api/create-ingest/route';
import { NextRequest } from 'next/server';
import UpdatePR from '@/utils/githubUtils/UpdatePR';
import CreatePR from '@/utils/githubUtils/CreatePR';

vi.mock('@/utils/githubUtils/UpdatePR');
vi.mock('@/utils/githubUtils/CreatePR');

describe('POST /create-ingest', () => {
  it('returns GitHub URL on successful PR creation', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        title: 'Test PR',
      }),
    } as unknown as NextRequest;

    // Mock the CreatePR function to return a fake GitHub URL
    vi.mocked(CreatePR).mockResolvedValue('https://github.com/test/pr');

    const response = await POST(mockRequest);

    // Verify CreatePR is called with the correct data
    expect(CreatePR).toHaveBeenCalledWith({ title: 'Test PR' });

    // Parse the response to validate content
    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ githubURL: 'https://github.com/test/pr' });

    // Check response status
    expect(response.status).toBe(200);
  });

  it('returns error message when PR update fails', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        title: 'Test PR',
      }),
    } as unknown as NextRequest;

    // Mock the UpdatePR function to reject
    vi.mocked(CreatePR).mockRejectedValue(new Error('Failed to Create PR'));

    const response = await POST(mockRequest);

    // Parse the response to validate content
    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ error: 'Failed to Create PR' });

    // Check response status
    expect(response.status).toBe(400);
  });

  it('handles unexpected errors gracefully', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        title: 'Test PR',
      }),
    } as unknown as NextRequest;

    // Mock the UpdatePR function to throw a non-error object
    vi.mocked(CreatePR).mockImplementation(() => {
      throw 'Unexpected Error';
    });

    const response = await POST(mockRequest);

    // Parse the response to validate content
    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });

    // Check response status
    expect(response.status).toBe(500);
  });

});

describe('PUT /create-ingest', () => {
  it('returns success message on successful PR update', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        ref: 'test-ref',
        fileSha: 'test-sha',
        filePath: 'test-path',
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    // Mock the UpdatePR function
    vi.mocked(UpdatePR).mockResolvedValue(undefined);

    const response = await PUT(mockRequest);

    expect(UpdatePR).toHaveBeenCalledWith(
      'test-ref',
      'test-sha',
      'test-path',
      { key: 'value' }
    );

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ message: 'Data updated successfully' });
    expect(response.status).toBe(200);
  });

  it('returns error message when PR update fails', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        ref: 'test-ref',
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
        ref: 'test-ref',
        fileSha: 'test-sha',
        filePath: 'test-path',
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    vi.mocked(UpdatePR).mockImplementation(() => {
      throw 'Unexpected Error';
    });

    const response = await PUT(mockRequest);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ error: 'Internal Server Error' });
    expect(response.status).toBe(500);
  });

  it('returns error when a required field is missing', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        ref: 'test-ref',
        fileSha: 'test-sha',
        // filePath is missing
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    const response = await PUT(mockRequest);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ error: 'Missing required fields: filePath' });
    expect(response.status).toBe(400);
  });

  it('returns error when multiple required fields are missing', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        ref: 'test-ref',
        // fileSha and filePath are missing
        formData: { key: 'value' },
      }),
    } as unknown as NextRequest;

    const response = await PUT(mockRequest);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ error: 'Missing required fields: fileSha, filePath' });
    expect(response.status).toBe(400);
  });

  it('returns error when all required fields are missing', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await PUT(mockRequest);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({
      error: 'Missing required fields: ref, fileSha, filePath, formData',
    });
    expect(response.status).toBe(400);
  });
});
