import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-util';
import { fetchAuthSession } from 'aws-amplify/auth/server';

// Mock dependencies
vi.mock('@/utils/amplify-server-util', () => ({
  runWithAmplifyServerContext: vi.fn(),
}));

vi.mock('aws-amplify/auth/server', () => ({
  fetchAuthSession: vi.fn(),
}));

// JWT Mock
const mockJWT = {
  payload: { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 }, // Example payload
  toString: () => 'mockJWT',
};

// List of protected routes
const protectedRoutes = [
  '/list-ingests',
  '/retrieve-ingest',
  '/api/create-ingest',
  '/api/edit-ingest',
];

describe('Middleware - Protected Routes', () => {
  protectedRoutes.forEach((route) => {
    it(`allows authenticated users to proceed for ${route}`, async () => {
      // Mock authenticated behavior
      vi.mocked(runWithAmplifyServerContext).mockImplementation(async ({ operation }) => {
        return operation({
          token: { value: Symbol('mockToken') },
        });
      });

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: { accessToken: mockJWT },
      });

      // Mock request and invoke middleware
      const mockRequest = new NextRequest(`http://localhost${route}`);
      const response = await middleware(mockRequest);

      expect(response.status).toBe(200); // Status 200 implies `NextResponse.next()`
    });

    it(`rejects unauthenticated users for ${route}`, async () => {
      // Mock unauthenticated behavior
      vi.mocked(runWithAmplifyServerContext).mockImplementation(async ({ operation }) => {
        return operation({
          token: { value: Symbol('mockToken') },
        });
      });

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: undefined, // Simulate missing tokens for unauthenticated users
      });

      // Mock request and invoke middleware
      const mockRequest = new NextRequest(`http://localhost${route}`);
      const response = await middleware(mockRequest);
      const jsonResponse = await response.json();

      expect(response.status).toBe(401);
      expect(jsonResponse).toEqual({ message: 'Not Authenticated' });
    });
  });
});
