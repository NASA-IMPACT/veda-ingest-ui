import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Define route permissions in a declarative way
const routeConfig = {
  // Routes that require authentication but no special permissions
  limited: ['/collections', '/datasets', '/cog-viewer'],

  // Routes that require create permissions (blocked for limited access)
  createAccess: ['/create-collection', '/create-dataset', '/upload'],

  // Routes that require edit permissions (blocked for limited access + need dataset:update)
  editAccess: ['/edit-collection', '/edit-dataset'],

  // API routes that require authentication
  apiRoutes: [
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ],
};

function getUserPermissionLevel(session: any) {
  if (!session) return 'guest';
  if (session.scopes?.includes('dataset:limited-access')) return 'limited';
  if (session.scopes?.includes('dataset:update')) return 'edit';
  if (session.scopes?.includes('dataset:create')) return 'create';
  return 'guest';
}

function isRouteAllowed(pathname: string, permissionLevel: string) {
  // Check if route starts with any of the configured paths
  const matchesRoute = (routes: string[]) =>
    routes.some((route) => pathname.startsWith(route));

  switch (permissionLevel) {
    case 'guest':
      // Guests have no access - should be redirected to login
      return false;

    case 'limited':
      // Limited users can access authenticated routes, but not create/edit
      return matchesRoute(routeConfig.limited);

    case 'create':
      return matchesRoute([
        ...routeConfig.limited,
        ...routeConfig.createAccess,
      ]);

    case 'edit':
      return matchesRoute([
        ...routeConfig.limited,
        ...routeConfig.createAccess,
        ...routeConfig.editAccess,
      ]);

    default:
      return false;
  }
}

export async function middleware(request: NextRequest) {
  // Security: Ensure auth is never disabled in production
  if (DISABLE_AUTH && process.env.NODE_ENV === 'production') {
    console.error(
      'SECURITY WARNING: Authentication cannot be disabled in production'
    );
    throw new Error('Authentication cannot be disabled in production');
  }

  if (DISABLE_AUTH) {
    console.warn('WARNING: Authentication is disabled for development');
    return NextResponse.next();
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;
  const permissionLevel = getUserPermissionLevel(session);

  // Check if the route is allowed for this permission level
  if (!isRouteAllowed(pathname, permissionLevel)) {
    if (pathname.startsWith('/api/')) {
      const status = permissionLevel === 'guest' ? 401 : 403;
      return new NextResponse(
        permissionLevel === 'guest' ? 'Unauthorized' : 'Forbidden',
        { status }
      );
    } else {
      const redirectUrl =
        permissionLevel === 'guest' ? '/login' : '/unauthorized';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/datasets',
    '/collections',
    '/create-dataset',
    '/edit-dataset',
    '/create-collection',
    '/edit-collection',
    '/upload',
    '/cog-viewer',
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ],
};
