import { runWithAmplifyServerContext } from '@/utils/amplify-server-util';
import { AmplifyServer } from 'aws-amplify/adapter-core';

// The fetchAuthSession is pulled as the server version from aws-amplify/auth/server
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // The runWithAmplifyServerContext will run the operation below
  // in an isolated matter.
  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec: AmplifyServer.ContextSpec) => {
      try {
        // The fetch will grab the session cookies
        const session = await fetchAuthSession(contextSpec, {});
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  // If user is authenticated then the route request will continue on
  if (authenticated) {
    return response;
  }

  // user is not authenticated
  return NextResponse.json({ message: 'Not Authenticated' }, { status: 401 });

}

// This config will match all routes accept /login, /api, _next/static, /_next/image
// favicon.ico
export const config = {
  matcher: [
    '/api/list-ingests',
    '/api/retrieve-ingest',
    '/api/create-ingest',
  ],
};
