import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export async function middleware(request: NextRequest) {
  if (DISABLE_AUTH) {
    return NextResponse.next(); // Bypass authentication
  }

  const session = await auth();
  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    '/create-ingest',
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ];

  // Allow access all authenticated users
  if (
    (pathname.startsWith('/create-ingest') ||
      pathname.startsWith('/upload') ||
      pathname.startsWith('/cog-viewer')) &&
    session
  ) {
    return NextResponse.next();
  }

  // Protect /edit-ingest based on the dataset:update scope
  if (pathname.startsWith('/edit-ingest')) {
    if (!session?.scopes?.includes('Editor')) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url)); // Redirect to an unauthorized page
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
    '/create-ingest',
    '/edit-ingest',
    '/upload',
    '/cog-viewer',
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ],
};
