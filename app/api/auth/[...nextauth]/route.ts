import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

const providers = [];

if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true') {
  providers.push(
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER!,
    })
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: {
    strategy: 'jwt',
  },
});
