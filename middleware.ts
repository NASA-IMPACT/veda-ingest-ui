import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse, NextRequest } from 'next/server';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export async function middleware(request: NextRequest) {
  if (DISABLE_AUTH) {
    return NextResponse.next(); // Bypass authentication
  }

  const session = await auth();
  const protectedRoutes = [
    '/create-ingest',
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/upload-url',
  ];

  if (
    !session &&
    protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
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
