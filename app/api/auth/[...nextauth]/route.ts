import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

const providers = [];

if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true') {
  providers.push(
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
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
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        const base64Payload = account.access_token.split('.')[1];
        const decodedPayload = JSON.parse(
          Buffer.from(base64Payload, 'base64').toString()
        );

        console.log('🔍 Decoded Keycloak token payload:', decodedPayload);

        token.accessToken = account.access_token;

        // Handle scope as array or string
        const rawScopes = decodedPayload.scope;
        if (Array.isArray(rawScopes)) {
          token.scopes = rawScopes;
        } else if (typeof rawScopes === 'string') {
          token.scopes = rawScopes.split(' ');
        } else {
          token.scopes = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      const customToken = token as { accessToken?: string; scopes?: string[] };

      session.accessToken = customToken.accessToken;
      session.scopes = customToken.scopes;

      return session;
    },
  },
});
