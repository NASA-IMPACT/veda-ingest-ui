import { auth } from '@/auth';
import {
  deriveCapabilities,
  UserCapabilities,
} from '@/lib/authorization/policy';
import { NextResponse, NextRequest } from 'next/server';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestStart,
  summarizeSession,
} from '@/lib/structuredLogger';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Define route permissions in a declarative way
const routeConfig = {
  // Routes that require authentication but no special permissions
  authenticated: ['/', '/collections', '/datasets', '/cog-viewer'],

  // Routes that require create permissions (blocked for limited access)
  createAccess: [
    '/create-collection',
    '/create-dataset',
    '/upload',
    '/create-ingest',
    '/upload-url',
  ],

  // Routes that require edit permissions (blocked for limited access + need dataset:update)
  editAccess: [
    '/edit-collection',
    '/edit-dataset',
    '/list-ingests',
    '/retrieve-ingest',
  ],

  editStacCollectionAccess: [
    '/edit-existing-collection',
    '/existing-collection',
    '/api/existing-collection',
  ],
};

function isRouteAllowed(pathname: string, capabilities: UserCapabilities) {
  // Check if route starts with any of the configured paths
  const matchesRoute = (routes: string[]) =>
    routes.some((route) =>
      route === '/' ? pathname === '/' : pathname.startsWith(route)
    );

  const hasAppAccess =
    capabilities.isLimited ||
    capabilities.canCreateIngest ||
    capabilities.canEditIngest ||
    capabilities.canEditExistingCollection;

  if (!capabilities.isAuthenticated) {
    return false;
  }

  if (matchesRoute(routeConfig.authenticated)) {
    return hasAppAccess;
  }

  if (capabilities.canCreateIngest && matchesRoute(routeConfig.createAccess)) {
    return true;
  }

  if (capabilities.canEditIngest && matchesRoute(routeConfig.editAccess)) {
    return true;
  }

  if (
    capabilities.canEditExistingCollection &&
    matchesRoute(routeConfig.editStacCollectionAccess)
  ) {
    return true;
  }

  return false;
}

function getPermissionLevel(capabilities: UserCapabilities): string {
  if (!capabilities.isAuthenticated) {
    return 'unauthenticated';
  }

  if (capabilities.canEditIngest) {
    return 'edit';
  }

  if (capabilities.canEditExistingCollection) {
    return 'edit_stac_collection';
  }

  if (capabilities.canCreateIngest) {
    return 'create';
  }

  if (capabilities.isLimited) {
    return 'limited';
  }

  return 'authenticated';
}

export async function middleware(request: NextRequest) {
  const logContext = createRequestLogContext(request, 'middleware');
  logRequestStart(logContext, { target: 'authz-gate' });

  // Security: Ensure auth is never disabled in production
  if (DISABLE_AUTH && process.env.NODE_ENV === 'production') {
    logRequestEnd(logContext, 500, {
      reason: 'auth_disabled_in_production',
    });
    throw new Error('Authentication cannot be disabled in production');
  }

  if (DISABLE_AUTH) {
    logRequestEnd(logContext, 200, {
      reason: 'auth_disabled_in_non_production',
    });
    return NextResponse.next();
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;

  const capabilities = deriveCapabilities(session);
  const permissionLevel = getPermissionLevel(capabilities);

  // Check if the route is allowed for this permission level
  if (!isRouteAllowed(pathname, capabilities)) {
    if (pathname.startsWith('/api/')) {
      const status = capabilities.isAuthenticated ? 403 : 401;
      logRequestEnd(logContext, status, {
        reason: 'route_not_allowed',
        permissionLevel,
        ...summarizeSession(session),
      });
      return new NextResponse(
        capabilities.isAuthenticated ? 'Forbidden' : 'Unauthorized',
        { status }
      );
    } else {
      const redirectUrl = capabilities.isAuthenticated
        ? '/unauthorized'
        : '/login';
      logRequestEnd(logContext, 302, {
        reason: 'route_not_allowed_redirect',
        permissionLevel,
        redirectUrl,
        ...summarizeSession(session),
      });
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  logRequestEnd(logContext, 200, {
    reason: 'route_allowed',
    permissionLevel,
    ...summarizeSession(session),
  });
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/datasets',
    '/collections',
    '/create-dataset',
    '/edit-dataset',
    '/create-collection',
    '/edit-collection',
    '/edit-existing-collection',
    '/upload',
    '/cog-viewer',
    '/list-ingests',
    '/retrieve-ingest',
    '/create-ingest',
    '/upload-url',
    '/existing-collection',
    '/api/existing-collection/:path*',
  ],
};
