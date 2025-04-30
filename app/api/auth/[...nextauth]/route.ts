import NextAuth, { NextAuthConfig } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

const providers =
  process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
    ? []
    : [
        KeycloakProvider({
          clientId: process.env.KEYCLOAK_CLIENT_ID!,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
          issuer: process.env.KEYCLOAK_ISSUER!,
        }),
      ];

const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies Parameters<typeof NextAuth>[0];

const handler = NextAuth(authOptions);
