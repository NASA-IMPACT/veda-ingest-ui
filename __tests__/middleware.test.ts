import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
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
  payload: { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 },
  toString: () => 'mockJWT',
};

// List of protected routes
const protectedRoutes = [
  '/api/list-ingests',
  '/api/retrieve-ingest',
  '/api/create-ingest',
  '/api/upload-url',
];

describe('Middleware - Protected Routes', () => {
  let originalDisableAuthEnv: string | undefined;

  beforeEach(() => {
    // Store original env variable and set it for tests
    originalDisableAuthEnv = process.env.NEXT_PUBLIC_DISABLE_AUTH;
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false'; // Ensure auth is NOT disabled

    // Reset mocks before each test to ensure clean state
    vi.mocked(runWithAmplifyServerContext).mockReset();
    vi.mocked(fetchAuthSession).mockReset();
  });

  afterEach(() => {
    // Restore original env variable
    process.env.NEXT_PUBLIC_DISABLE_AUTH = originalDisableAuthEnv;
  });

  protectedRoutes.forEach((route) => {
    it('allows authenticated users to proceed', async () => {
      // Mock authenticated behavior
      vi.mocked(runWithAmplifyServerContext).mockImplementation(
        async ({ operation }) => {
          return operation({
            token: { value: Symbol('mockToken') },
          });
        }
      );

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: { accessToken: mockJWT },
      });

      // Mock request and invoke middleware
      const mockRequest = new NextRequest(`http://localhost${route}`);
      const response = await middleware(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBeNull();
    });

    it(`rejects unauthenticated users for ${route}`, async () => {
      // Mock unauthenticated behavior
      vi.mocked(runWithAmplifyServerContext).mockImplementation(
        async ({ operation }) => {
          return operation({
            token: { value: Symbol('mockToken') },
          });
        }
      );

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: undefined, // Simulate missing tokens for unauthenticated users
      });

      // Mock request and invoke middleware
      const mockRequest = new NextRequest(`http://localhost${route}`);
      const responseFromMiddleware = await middleware(mockRequest);

      expect(responseFromMiddleware.status).toBe(401);
      const jsonResponse = await responseFromMiddleware.json(); // This should now work
      expect(jsonResponse).toEqual({ message: 'Not Authenticated' });
    });
  });
});

it('allows access if NEXT_PUBLIC_DISABLE_AUTH is true, even if unauthenticated', async () => {
  process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true'; // Override for this test

  // No need to mock runWithAmplifyServerContext or fetchAuthSession deeply,
  // as the `authenticated` variable might not even be checked if NEXT_PUBLIC_DISABLE_AUTH is true.
  // However, runWithAmplifyServerContext will still be called.
  vi.mocked(runWithAmplifyServerContext).mockImplementation(async (args) => {
    // Simulate it returning false for authentication for clarity
    return args.operation({} as any); // The operation will determine `authenticated`
  });
  // And ensure fetchAuthSession within the operation would lead to `authenticated = false`
  vi.mocked(fetchAuthSession).mockResolvedValue({ tokens: undefined });

  const mockRequest = new NextRequest(`http://localhost${protectedRoutes[0]}`); // Use any protected route
  const response = await middleware(mockRequest);

  expect(response.status).toBe(200); // Should be NextResponse.next()
  // Ensure it didn't try to return a JSON body
  let errorOnJson = false;
  try {
    await response.json();
  } catch (e) {
    errorOnJson = true;
  }
  expect(
    errorOnJson,
    'Response body should not be JSON when auth is disabled and it passes'
  ).toBe(true);

  // Reset for other tests if not using afterEach for this specific var
  process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';
});
