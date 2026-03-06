import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    scopes?: string[];
    tenants?: string[];
    error?: 'RefreshAccessTokenError' | 'NoRefreshToken';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    scopes?: string[];
    tenants?: string[];
    error?: 'RefreshAccessTokenError' | 'NoRefreshToken';
  }
}
