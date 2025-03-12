import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session, type Account, type Profile } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { getUser, getUserByEmail } from '@/lib/db/queries';
import { DrizzleAdapter } from '@/lib/db/auth-adapter';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(),
  session: {
    // Use JWT strategy instead of database sessions
    strategy: "jwt",
    // 30 days
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          // First, try to find the user by email
          const users = await getUser(email);
          if (users.length === 0) return null;
          
          const user = users[0];
          
          // For regular email/password login, verify the password
          if (password) {
            // biome-ignore lint: Forbidden non-null assertion.
            const passwordsMatch = await compare(password, user.password!);
            if (!passwordsMatch) return null;
            return user as any;
          }
          
          return null;
        } catch (error) {
          console.error('Error in authorize callback:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      try {
        // Log the token and user for debugging
        console.log('JWT Callback - Token:', token);
        console.log('JWT Callback - User:', user);
        console.log('JWT Callback - Account:', account);
        
        // Initial sign in
        if (account && user) {
          // Add user ID to token
          token.id = user.id;
          // Add account info to token
          token.provider = account.provider;
          // Add any additional user info you want to store
          if (profile) {
            token.name = profile.name || user.name;
            token.email = profile.email || user.email;
          }
        }

        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        return token;
      }
    },
    async session({
      session,
      token,
    }) {
      try {
        // Log the session and token for debugging
        console.log('Session Callback - Session:', session);
        console.log('Session Callback - Token:', token);
        
        if (session.user) {
          // Copy information from the token to the session
          session.user.id = token.id as string;
          // Add any other token properties you want in the session
          if (token.name) session.user.name = token.name as string;
          if (token.email) session.user.email = token.email as string;
        }

        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
  },
  debug: true, // Enable debug mode to see more logs
  events: {
    async signIn(message) {
      console.log('User signed in:', message);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    },
    async linkAccount({ user, account, profile }) {
      console.log('Account linked:', { userId: user.id, provider: account.provider, providerAccountId: account.providerAccountId });
    },
  },
});
