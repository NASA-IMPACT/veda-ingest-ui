import NextAuth, { type NextAuthConfig, Session } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Helper function to get mock tenants from environment variable
const getMockTenants = (): string[] => {
  const mockTenants = process.env.NEXT_PUBLIC_MOCK_TENANTS;
  if (mockTenants && mockTenants.trim() !== '') {
    return mockTenants
      .split(',')
      .map((tenant) => tenant.trim())
      .filter(Boolean);
  }
  // Default fallback tenants if none specified
  return [''];
};

let auth: any, handlers: any, signIn: any, signOut: any;

if (authDisabled) {
  // --- MOCKED AUTH FOR TESTING --- 🎭
  console.log('🎭 Auth is disabled. Using mock session.');

  const mockTenants = getMockTenants();
  console.log('🎭 Mock tenants:', mockTenants);

  const mockSession: Session = {
    user: {
      name: 'Mock User',
      email: 'test@example.com',
    },
    expires: '2099-12-31T23:59:59.999Z',
    tenants: mockTenants,
    scopes: ['dataset:update', 'stac:collection:update'],
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
        }
        return token;
      },
      async session({ session, token }) {
        const customToken = token as JWT;
        const customSession = session as Session & { tenants?: string[] };

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
