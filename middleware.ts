import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

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
    return NextResponse.next(); // Bypass authentication
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;
  const hasLimitedAccess = session?.scopes?.includes('dataset:limited-access');

  // Block limited access users from create/edit collection/dataset pages and APIs
  if (
    hasLimitedAccess &&
    (pathname.startsWith('/create-collection') ||
      pathname.startsWith('/edit-collection') ||
      pathname.startsWith('/create-dataset') ||
      pathname.startsWith('/edit-dataset') ||
      pathname.startsWith('/api/create-ingest') ||
      pathname.startsWith('/api/upload-url'))
  ) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden', { status: 403 });
    } else {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  const protectedRoutes = [
    '/create-dataset',
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ];

  // Allow access all authenticated users
  if (
    (pathname.startsWith('/collections') ||
      pathname.startsWith('/create-collection') ||
      pathname.startsWith('/edit-collection') ||
      pathname.startsWith('/datasets') ||
      pathname.startsWith('/create-dataset') ||
      pathname.startsWith('/edit-dataset') ||
      pathname.startsWith('/upload') ||
      pathname.startsWith('/cog-viewer')) &&
    session
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/edit-dataset') ||
    pathname.startsWith('/edit-collection')
  ) {
    if (!session?.scopes?.includes('dataset:update')) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    return NextResponse.next();
  }

  // Authentication check for other protected routes
  if (!session && protectedRoutes.some((path) => pathname.startsWith(path))) {
    if (pathname.startsWith('/api/')) {
      // For API routes, return a 401 Unauthorized response
      return new NextResponse('Unauthorized', { status: 401 });
    } else {
      // For page routes, redirect to the login page
      return NextResponse.redirect(new URL('/login', request.url));
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
