// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

// src/app/api/auth/[...nextauth]/route.js
export const authOptions = {
    providers: [
      KeycloakProvider({
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET,
        issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER,
      }),
    ],
    callbacks: {
      async jwt({ token, account }) {
        console.log('JWT Callback - token:', token);
        console.log('JWT Callback - account:', account);
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        console.log('Session Callback - session:', session);
        console.log('Session Callback - token:', token);
        session.accessToken = token.accessToken;
        return session;
      },
    },
  };
  

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };