import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/frontend-logs/route';
import { auth } from '@/auth';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const authMock = auth as Mock;

const validLogEntry = {
  level: 'error',
  event: 'frontend.test.event',
  details: {
    runtime: 'browser',
    pathname: '/collections',
  },
  clientTimestamp: '2026-05-14T00:00:00.000Z',
};

describe('POST /api/frontend-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { name: 'Test User' },
      scopes: ['dataset:create'],
      tenants: ['Public'],
    });
  });

  it('returns 403 when origin host mismatches forwarded host in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest(
      'https://ingest.example.com/api/frontend-logs',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://evil.example.com',
          'x-forwarded-host': 'ingest.example.com',
        },
        body: JSON.stringify({ logs: [validLogEntry] }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: 'Origin validation failed' });
  });

  it('returns 202 for valid same-origin forwarded-host requests in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest(
      'https://ingest.example.com/api/frontend-logs',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://preview.example.amplifyapp.com',
          'x-forwarded-host': 'preview.example.amplifyapp.com',
          'sec-fetch-site': 'same-origin',
        },
        body: JSON.stringify({ logs: [validLogEntry] }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(202);
    expect(json).toEqual({
      accepted: true,
      ingestedCount: 1,
      droppedCount: 0,
    });
  });
});
