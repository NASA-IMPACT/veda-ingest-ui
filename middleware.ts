import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and NextAuth routes
  if (
    pathname.startsWith('/api/auth') ||
    process.env.NEXT_PUBLIC_DISABLE_AUTH
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret });

  if (token) {
    return NextResponse.next();
  }

  // If no token, redirect to sign-in page or return an unauthorized response
  return NextResponse.json({ message: 'Not Authenticated' }, { status: 401 });
}

export const config = {
  matcher: [
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
    '/api/uload-url',
  ],
};
