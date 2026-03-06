import NextAuth, { type NextAuthConfig, Session } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { VEDA_BACKEND_URL } from '@/config/env';

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

type AppJWT = JWT & {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  scopes?: string[];
  tenants?: string[];
  error?: 'RefreshAccessTokenError' | 'NoRefreshToken';
};

const REFRESH_BUFFER_MS = 60_000;

const parseScopesFromAccessToken = (accessToken: string): string[] => {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return [];
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString()
    ) as { scope?: string | string[] };
    const rawScopes = decodedPayload.scope;
    if (Array.isArray(rawScopes)) return rawScopes;
    if (typeof rawScopes === 'string') return rawScopes.split(' ');
    return [];
  } catch {
    return [];
  }
};

const fetchWritableTenants = async (accessToken: string): Promise<string[]> => {
  const tenantsResponse = await fetch(
    `${VEDA_BACKEND_URL}/ingest/auth/tenants/writable`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!tenantsResponse.ok) {
    console.warn(
      'Failed to fetch allowed tenants during auth:',
      tenantsResponse.status
    );
    return [];
  }

  const tenantsData = await tenantsResponse.json();
  const rawTenants = Array.isArray(tenantsData)
    ? tenantsData
    : Array.isArray(tenantsData?.tenants)
      ? tenantsData.tenants
      : [];

  return rawTenants
    .filter((tenant: unknown): tenant is string => typeof tenant === 'string')
    .map((tenant: string) => tenant.trim())
    .filter(Boolean);
};

const refreshAccessToken = async (token: AppJWT): Promise<AppJWT> => {
  if (!token.refreshToken) {
    return { ...token, error: 'NoRefreshToken' };
  }

  try {
    const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER!;
    const tokenEndpoint = `${issuer}/protocol/openid-connect/token`;

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) {
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const refreshed = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const refreshedAccessToken = refreshed.access_token;
    const refreshedScopes = parseScopesFromAccessToken(refreshedAccessToken);
    const refreshedTenants = await fetchWritableTenants(refreshedAccessToken);

    return {
      ...token,
      accessToken: refreshedAccessToken,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      scopes: refreshedScopes,
      tenants: refreshedTenants,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
};

if (authDisabled) {
  // --- MOCKED AUTH FOR TESTING --- 🎭
  console.log('🎭 Auth is disabled. Using mock session.');

  const mockTenants = getMockTenants();
  console.log('🎭 Mock tenants:', mockTenants);

  const mockScopes = getMockScopes();
  console.log('Mock scopes:', mockScopes);

  const mockSession: Session & {
    scopes?: string[];
    accessToken?: string;
    tenants?: string[];
  } = {
    user: {
      name: 'Mock User',
      email: 'test@example.com',
    },
    expires: '2099-12-31T23:59:59.999Z',
    tenants: mockTenants,
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
        const customToken = token as AppJWT;

        if (account?.access_token) {
          customToken.accessToken = account.access_token;
          customToken.refreshToken = account.refresh_token;
          customToken.accessTokenExpires = account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 5 * 60 * 1000;
          customToken.scopes = parseScopesFromAccessToken(account.access_token);

          try {
            if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
              console.log(
                'Skipping external tenants fetch in test environment'
              );
              const mockTenants = process.env.NEXT_PUBLIC_MOCK_TENANTS;
              if (mockTenants && mockTenants.trim() !== '') {
                customToken.tenants = mockTenants
                  .split(',')
                  .map((tenant) => tenant.trim())
                  .filter(Boolean);
              }
            } else {
              customToken.tenants = await fetchWritableTenants(
                account.access_token
              );
            }
          } catch (error) {
            console.error('Error fetching allowed tenants during auth:', error);
            customToken.tenants = [];
          }

          return customToken;
        }

        if (
          customToken.accessTokenExpires &&
          Date.now() < customToken.accessTokenExpires - REFRESH_BUFFER_MS
        ) {
          return customToken;
        }

        return refreshAccessToken(customToken);
      },
      async session({ session, token }) {
        const customToken = token as AppJWT;
        const customSession = session as Session & {
          tenants?: string[];
          scopes?: string[];
          accessToken?: string;
          error?: 'RefreshAccessTokenError' | 'NoRefreshToken';
        };

        if (customToken.accessToken) {
          (customSession as any).accessToken = customToken.accessToken;
        }

        if (customToken.tenants) {
          customSession.tenants = customToken.tenants as string[];
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

        if (customToken.error) {
          customSession.error = customToken.error;
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
