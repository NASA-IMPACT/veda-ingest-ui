import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Define route permissions in a declarative way
const routeConfig = {
  // Routes that require authentication but no special permissions
  limited: ['/collections', '/datasets', '/cog-viewer', '/upload-url'],

  // Routes that require create permissions (blocked for limited access)
  createAccess: [
    '/create-collection',
    '/create-dataset',
    '/upload',
    '/create-ingest',
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
  ],
};

function getUserPermissionLevel(session: any) {
  if (!session) return 'unauthenticated';
  if (session.scopes?.includes('dataset:limited-access')) return 'limited';

  const hasDatasetUpdate = session.scopes?.includes('dataset:update');
  const hasStacCollectionUpdate = session.scopes?.includes(
    'stac:collection:update'
  );
  const hasDatasetCreate = session.scopes?.includes('dataset:create');

  if (hasDatasetUpdate && hasStacCollectionUpdate) return 'full-edit';
  if (hasDatasetUpdate) return 'edit';
  if (hasStacCollectionUpdate) return 'edit-existing';
  if (hasDatasetCreate) return 'create';

  // Authenticated user but no application-specific permissions
  return 'authenticated-guest';
}

function isRouteAllowed(pathname: string, permissionLevel: string) {
  // Check if route starts with any of the configured paths
  const matchesRoute = (routes: string[]) =>
    routes.some((route) => pathname.startsWith(route));

  switch (permissionLevel) {
    case 'unauthenticated':
      // Unauthenticated users have no access - should be redirected to login
      return false;

    case 'authenticated-guest':
      // Authenticated users without app permissions - should be redirected to unauthorized
      return false;

    case 'limited':
      // Limited users can access authenticated routes and upload-url, but not create/edit
      return matchesRoute([...routeConfig.limited]);

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

    case 'edit-existing':
      return matchesRoute([
        ...routeConfig.limited,
        ...routeConfig.createAccess,
        ...routeConfig.editStacCollectionAccess,
      ]);

    case 'full-edit':
      return matchesRoute([
        ...routeConfig.limited,
        ...routeConfig.createAccess,
        ...routeConfig.editAccess,
        ...routeConfig.editStacCollectionAccess,
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
    console.warn(
      'WARNING: Authentication is disabled for development - middleware skipping auth checks'
    );
    return NextResponse.next();
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;
  const permissionLevel = getUserPermissionLevel(session);

  // Check if the route is allowed for this permission level
  if (!isRouteAllowed(pathname, permissionLevel)) {
    if (pathname.startsWith('/api/')) {
      const status = permissionLevel === 'unauthenticated' ? 401 : 403;
      return new NextResponse(
        permissionLevel === 'unauthenticated' ? 'Unauthorized' : 'Forbidden',
        { status }
      );
    } else {
      const redirectUrl =
        permissionLevel === 'unauthenticated' ? '/login' : '/unauthorized';
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
    '/edit-existing-collection',
    '/upload',
    '/cog-viewer',
    '/list-ingests',
    '/retrieve-ingest',
    '/create-ingest',
    '/upload-url',
    '/allowed-tenants',
    '/existing-collection',
  ],
};
