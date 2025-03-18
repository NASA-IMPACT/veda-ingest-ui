import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/upload-url/route';
import { NextRequest } from 'next/server';
import * as s3Utils from '@/utils/s3';

// Mock environment variables
vi.stubEnv('AWS_REGION', 'us-east-1');
vi.stubEnv('NEXT_PUBLIC_AWS_S3_BUCKET_NAME', 'test-bucket');

vi.mock('@/utils/s3', () => ({
  checkFileExists: vi.fn(),
  generateSignedUrl: vi.fn(),
}));

describe('POST /api/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: object) =>
    new NextRequest('http://localhost/api/upload-url', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('returns fileUrl, signedUrl, and fileExist=false if new filename is uploaded', async () => {
    vi.spyOn(s3Utils, 'checkFileExists').mockResolvedValue(false);
    vi.spyOn(s3Utils, 'generateSignedUrl').mockResolvedValue(
      'https://signed-url.com'
    );

    const req = createRequest({
      filename: 'newfile.png',
      filetype: 'image/png',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      uploadUrl: 'https://signed-url.com',
      fileUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/newfile.png',
      fileExists: false,
    });
  });

  it('returns fileUrl, signedUrl, and fileExist=true if existing filename is uploaded', async () => {
    vi.spyOn(s3Utils, 'checkFileExists').mockResolvedValue(true);
    vi.spyOn(s3Utils, 'generateSignedUrl').mockResolvedValue(
      'https://signed-url.com'
    );

    const req = createRequest({
      filename: 'existingfile.png',
      filetype: 'image/png',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      uploadUrl: 'https://signed-url.com',
      fileUrl:
        'https://test-bucket.s3.us-east-1.amazonaws.com/existingfile.png',
      fileExists: true,
    });
  });

  it('returns a 400 error if filename is missing from POST body', async () => {
    const req = createRequest({ filetype: 'image/png' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns a 400 error if filetype is missing from POST body', async () => {
    const req = createRequest({ filename: 'test.png' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns a 400 error if filetype is not jpg or png', async () => {
    const req = createRequest({ filename: 'test.txt', filetype: 'text/plain' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns a 500 error if unable to check file existence in S3', async () => {
    vi.spyOn(s3Utils, 'checkFileExists').mockRejectedValue(
      new Error('S3 Error')
    );

    const req = createRequest({ filename: 'test.png', filetype: 'image/png' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns a 500 error if unable to generate signed URL', async () => {
    vi.spyOn(s3Utils, 'checkFileExists').mockResolvedValue(false);
    vi.spyOn(s3Utils, 'generateSignedUrl').mockRejectedValue(
      new Error('S3 Error')
    );

    const req = createRequest({ filename: 'test.png', filetype: 'image/png' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
