import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  const NextResponseMock = vi
    .fn()
    .mockImplementation((body, init) => new Response(body, init));

  Object.assign(NextResponseMock, {
    redirect: vi.fn(),
    next: vi.fn(),
  });

  return {
    ...actual,
    NextResponse: NextResponseMock,
  };
});

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_DISABLE_AUTH', 'false');
    vi.stubEnv('NODE_ENV', 'development');
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: { pathname },
      url: `http://localhost:3000${pathname}`,
    } as NextRequest;
  };

  describe('Unauthenticated users', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(null);
    });

    it('redirects unauthenticated users to login for any protected route', async () => {
      const testRoutes = [
        '/collections',
        '/create-dataset',
        '/edit-dataset',
        '/create-collection',
        '/edit-collection',
        '/upload',
        '/datasets',
        '/collections',
      ];

      for (const pathname of testRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.redirect)).toHaveBeenCalledWith(
          new URL('/login', request.url)
        );
      }
    });
  });

  describe('Authenticated users with basic scopes only', () => {
    const authenticatedGuestSession = {
      user: { name: 'Stephen Kilbourn', email: 'skilbourn@element84.com' },
      expires: '2026-02-04T23:40:16.341Z',
      tenants: [],
      scopes: ['openid', 'profile', 'email'],
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(authenticatedGuestSession);
    });

    it('redirects authenticated users without app permissions to unauthorized', async () => {
      const testRoutes = [
        '/collections',
        '/datasets',
        '/create-dataset',
        '/edit-dataset',
        '/upload',
      ];

      for (const pathname of testRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.redirect)).toHaveBeenCalledWith(
          new URL('/unauthorized', request.url)
        );
      }
    });
  });

  describe('Limited access users', () => {
    const limitedSession = {
      user: { name: 'Test' },
      scopes: ['dataset:limited-access'],
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(limitedSession);
    });

    it('allows access to basic authenticated routes', async () => {
      const allowedRoutes = ['/collections', '/datasets', '/cog-viewer'];

      for (const pathname of allowedRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.next)).toHaveBeenCalled();
        expect(vi.mocked(NextResponse.redirect)).not.toHaveBeenCalled();
      }
    });

    it('blocks access to create/edit and upload routes', async () => {
      const blockedRoutes = [
        '/create-collection',
        '/create-dataset',
        '/edit-collection',
        '/edit-dataset',
        '/upload',
      ];

      for (const pathname of blockedRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.redirect)).toHaveBeenCalledWith(
          new URL('/unauthorized', request.url)
        );
      }
    });
  });

  describe('Users with create permissions', () => {
    const createSession = {
      user: { name: 'Test' },
      scopes: ['dataset:create'],
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(createSession);
    });

    it('allows access to authenticated and create routes', async () => {
      const allowedRoutes = [
        '/collections',
        '/datasets',
        '/cog-viewer',
        '/create-collection',
        '/create-dataset',
        '/upload',
      ];

      for (const pathname of allowedRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.next)).toHaveBeenCalled();
        expect(vi.mocked(NextResponse.redirect)).not.toHaveBeenCalled();
      }
    });

    it('blocks access to edit routes', async () => {
      const blockedRoutes = ['/edit-collection', '/edit-dataset'];

      for (const pathname of blockedRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.redirect)).toHaveBeenCalledWith(
          new URL('/unauthorized', request.url)
        );
      }
    });
  });

  describe('Users with edit permissions', () => {
    const editSession = {
      user: { name: 'Test' },
      scopes: ['dataset:update'],
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(editSession);
    });

    it('allows access to all routes', async () => {
      const allowedRoutes = [
        '/collections',
        '/datasets',
        '/cog-viewer',
        '/create-collection',
        '/create-dataset',
        '/upload',
        '/edit-collection',
        '/edit-dataset',
      ];

      for (const pathname of allowedRoutes) {
        vi.clearAllMocks();
        const request = createMockRequest(pathname);
        await middleware(request);

        expect(vi.mocked(NextResponse.next)).toHaveBeenCalled();
        expect(vi.mocked(NextResponse.redirect)).not.toHaveBeenCalled();
      }
    });
  });

  describe('API route handling', () => {
    it('returns 401 for unauthenticated API requests', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = createMockRequest('/api/create-ingest');
      const result = await middleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(401);
      expect(await result.text()).toBe('Unauthorized');
    });

    it('returns 403 for limited access users on restricted API routes', async () => {
      const limitedSession = {
        user: { name: 'Test' },
        scopes: ['dataset:limited-access'],
      };
      vi.mocked(auth).mockResolvedValue(limitedSession);

      const request = createMockRequest('/api/create-ingest');
      const result = await middleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(403);
      expect(await result.text()).toBe('Forbidden');
    });
  });

  describe('Permission level detection', () => {
    it('correctly identifies permission levels', async () => {
      const testCases = [
        { scopes: null, expectedRedirect: '/login' }, // unauthenticated
        {
          scopes: ['openid', 'profile', 'email'], // Authenticated but no app permissions
          route: '/collections',
          expectedRedirect: '/unauthorized',
        },
        {
          scopes: ['dataset:limited-access'],
          route: '/create-dataset',
          expectedRedirect: '/unauthorized',
        },
        {
          scopes: ['dataset:create'],
          route: '/edit-dataset',
          expectedRedirect: '/unauthorized',
        },
        {
          scopes: ['dataset:update'],
          route: '/edit-dataset',
          shouldAllow: true,
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const session = testCase.scopes
          ? {
              user: { name: 'Test' },
              scopes: testCase.scopes,
            }
          : null;

        vi.mocked(auth).mockResolvedValue(session);

        const request = createMockRequest(testCase.route || '/collections');
        await middleware(request);

        if (testCase.shouldAllow) {
          expect(vi.mocked(NextResponse.next)).toHaveBeenCalled();
        } else if (testCase.expectedRedirect) {
          expect(vi.mocked(NextResponse.redirect)).toHaveBeenCalledWith(
            new URL(testCase.expectedRedirect, request.url)
          );
        }
      }
    });
  });
});
