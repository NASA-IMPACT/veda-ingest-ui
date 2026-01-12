import NextAuth, { type NextAuthConfig, Session } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { VEDA_BACKEND_URL } from '@/config/env';

const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

const getMockTenants = (): string[] => {
  const mockTenants = process.env.NEXT_PUBLIC_MOCK_TENANTS;
  if (mockTenants && mockTenants.trim() !== '') {
    return mockTenants
      .split(',')
      .map((tenant) => tenant.trim())
      .filter(Boolean);
  }
  return [''];
};

const getMockScopes = (): string[] => {
  const mockScopes = process.env.NEXT_PUBLIC_MOCK_SCOPES;
  if (mockScopes && mockScopes.trim() !== '') {
    // Handle both comma and space separated scopes
    return mockScopes
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }
  return [];
};

let auth: any, handlers: any, signIn: any, signOut: any;

if (authDisabled) {
  // --- MOCKED AUTH FOR TESTING ---
  console.log('Auth is disabled. Using mock session.');

  const mockTenants = getMockTenants();
  console.log('🎭Mock tenants:', mockTenants);

  const mockScopes = getMockScopes();
  console.log('Mock scopes:', mockScopes);
  const mockSession: Session & {
    scopes?: string[];
    accessToken?: string;
    allowedTenants?: string[];
  } = {
    user: {
      name: 'Mock User',
      email: 'test@example.com',
    },
    expires: '2099-12-31T23:59:59.999Z',
    allowedTenants: mockTenants,
    accessToken: 'mock-access-token-for-development',
    ...(mockScopes.length > 0 ? { scopes: mockScopes } : {}),
  };

  // The `auth` function is used by middleware and server components
  auth = async () => mockSession;

  handlers = {
    GET: async () => NextResponse.json(mockSession),
    POST: async () => new NextResponse(),
  };

  signIn = async () => {};
  signOut = async () => {};
} else {
  // --- REAL NEXTAUTH.JS CONFIGURATION FOR PRODUCTION ---

  const providers = [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER!,
    }),
  ];

  const authOptions: NextAuthConfig = {
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    providers,
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async jwt({ token, account }) {
        if (account?.access_token) {
          const base64Payload = account.access_token.split('.')[1];
          const decodedPayload = JSON.parse(
            Buffer.from(base64Payload, 'base64').toString()
          );

          (token as JWT).accessToken = account.access_token;
          const tenants = decodedPayload.groups || [];
          (token as JWT).tenants = tenants;

          const rawScopes = decodedPayload.scope;
          if (Array.isArray(rawScopes)) {
            (token as JWT).scopes = rawScopes;
          } else if (typeof rawScopes === 'string') {
            (token as JWT).scopes = rawScopes.split(' ');
          }

          try {
            if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
              console.log(
                'Skipping external tenants fetch in test environment'
              );
              const mockTenants = process.env.NEXT_PUBLIC_MOCK_TENANTS;
              if (mockTenants && mockTenants.trim() !== '') {
                (token as JWT).allowedTenants = mockTenants
                  .split(',')
                  .map((tenant) => tenant.trim())
                  .filter(Boolean);
              }
            } else {
              const allowedTenantsResponse = await fetch(
                `${VEDA_BACKEND_URL}/ingest/auth/tenants/writable`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${account.access_token}`,
                    Accept: 'application/json',
                  },
                }
              );
              console.log({ allowedTenantsResponse });

              if (allowedTenantsResponse.ok) {
                const allowedTenantsData = await allowedTenantsResponse.json();
                console.log(
                  'Fetched allowed tenants during auth:',
                  allowedTenantsData.tenants
                );
                (token as JWT).allowedTenants =
                  allowedTenantsData.tenants || [];
              } else {
                console.warn(
                  'Failed to fetch allowed tenants during auth:',
                  allowedTenantsResponse.status
                );
                (token as JWT).allowedTenants = [];
              }
            }
          } catch (error) {
            console.error('Error fetching allowed tenants during auth:', error);
            (token as JWT).allowedTenants = [];
          }
        }
        return token;
      },
      async session({ session, token }) {
        const customToken = token as JWT;
        const customSession = session as Session & {
          tenants?: string[];
          scopes?: string[];
          accessToken?: string;
          allowedTenants?: string[];
        };

        if (customToken.accessToken) {
          (customSession as any).accessToken = customToken.accessToken;
        }

        if (customToken.allowedTenants) {
          customSession.allowedTenants = customToken.allowedTenants as string[];
        }

        // Check if we should use mock tenants instead of real ones
        const mockTenants = process.env.NEXT_PUBLIC_MOCK_TENANTS;
        if (mockTenants && mockTenants.trim() !== '') {
          const tenants = mockTenants
            .split(',')
            .map((tenant) => tenant.trim())
            .filter(Boolean);
          console.log('🎭 Overriding real tenants with mock tenants:', tenants);
          customSession.tenants = tenants;
        } else {
          customSession.tenants = customToken.tenants;
        }

        // Inject mock scopes from env if present
        const mockScopes = process.env.NEXT_PUBLIC_MOCK_SCOPES;
        if (mockScopes && mockScopes.trim() !== '') {
          const scopes = mockScopes.split(/[ ,]+/).filter(Boolean);
          console.log('🎭 Overriding real scopes with mock scopes:', scopes);
          customSession.scopes = scopes;
        } else if (customToken.scopes) {
          customSession.scopes = customToken.scopes as string[];
        }

        return customSession;
      },
    },
  };

  const nextAuthExports = NextAuth(authOptions);
  auth = nextAuthExports.auth;
  handlers = nextAuthExports.handlers;
  signIn = nextAuthExports.signIn;
  signOut = nextAuthExports.signOut;
}

export { auth, handlers, signIn, signOut };

export const { GET, POST } = handlers;
