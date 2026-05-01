import { auth } from '@/auth';
import {
  deriveCapabilities,
  UserCapabilities,
} from '@/lib/authorization/policy';
import { NextResponse, NextRequest } from 'next/server';

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

export async function proxy(request: NextRequest) {
  // Security: Ensure auth is never disabled in production
  if (DISABLE_AUTH && process.env.NODE_ENV === 'production') {
    console.error(
      'SECURITY WARNING: Authentication cannot be disabled in production'
    );
    throw new Error('Authentication cannot be disabled in production');
  }

  if (DISABLE_AUTH) {
    console.warn(
      'WARNING: Authentication is disabled for development - middleware skipping auth checks'
    );
    return NextResponse.next();
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;

  const capabilities = deriveCapabilities(session);

  // Check if the route is allowed for this permission level
  if (!isRouteAllowed(pathname, capabilities)) {
    if (pathname.startsWith('/api/')) {
      const status = capabilities.isAuthenticated ? 403 : 401;
      return new NextResponse(
        capabilities.isAuthenticated ? 'Forbidden' : 'Unauthorized',
        { status }
      );
    } else {
      const redirectUrl = capabilities.isAuthenticated
        ? '/unauthorized'
        : '/login';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

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
