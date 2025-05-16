import NextAuth, { type NextAuthConfig } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

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

const authOptions: NextAuthConfig = {
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

        (token as JWT).accessToken = account.access_token;

        const rawScopes = decodedPayload.scope;
        if (Array.isArray(rawScopes)) {
          (token as JWT).scopes = rawScopes;
        } else if (typeof rawScopes === 'string') {
          (token as JWT).scopes = rawScopes.split(' ');
        } else {
          (token as JWT).scopes = [];
        }
      }
      return token;
    },

    async session({ session, token }) {
      const customToken = token as JWT;
      const customSession = session as Session & {
        accessToken?: string;
        scopes?: string[];
      };

      customSession.accessToken = customToken.accessToken;
      customSession.scopes = customToken.scopes;

      return customSession;
    },
  },
};

console.log('✅ NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('✅ NEXTAUTH_TRUST_HOST:', process.env.NEXTAUTH_TRUST_HOST);
console.log('✅ KEYCLOAK_CLIENT_ID:', process.env.KEYCLOAK_CLIENT_ID);
console.log(
  '✅ NEXT_PUBLIC_KEYCLOAK_ISSUER:',
  process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER
);

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export { auth, signIn, signOut, authOptions };
export const { GET, POST } = handlers;
