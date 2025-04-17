import { compare } from 'bcrypt-ts';
import NextAuth, {
  type User,
  type Session,
  type Account,
  type Profile,
} from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { getUser, getUserByEmail, getUserById } from '@/lib/db/queries';
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
    strategy: 'jwt',
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
        // console.log('JWT Callback - Token:', token);
        // console.log('JWT Callback - User:', user);
        // console.log('JWT Callback - Account:', account);

        // Initial sign in or account linking
        if (account && user) {
          token.id = user.id;
          token.provider = account.provider;
          if (profile) {
            token.name = profile.name || user.name;
            token.email = profile.email || user.email;
          }
          // Set initial status from the user object provided during sign-in/linking
          token.subscriptionStatus =
            (user as any).subscriptionStatus || 'inactive';
        }

        // Always try to refresh user data from DB if token.id exists
        if (token.id) {
          // console.log(`JWT Callback: Refreshing DB data for user ID: ${token.id}`);
          const dbUser = await getUserById(token.id as string);
          if (dbUser) {
            // Always update the token with the latest status from the database
            token.subscriptionStatus = dbUser.subscriptionStatus || 'inactive';
            // Optionally update other fields like name/email if they can change
            token.name = dbUser.name || token.name;
            token.email = dbUser.email || token.email;
            // console.log(`JWT Callback: Updated token subscriptionStatus to: ${token.subscriptionStatus}`);
          } else {
            // Handle case where user might have been deleted?
            // console.log(`JWT Callback: User with ID ${token.id} not found in DB during refresh.`);
            // Optionally clear parts of the token or return null to force re-auth
            token.subscriptionStatus = 'inactive'; // Default if user not found
          }
        }

        // Removed the old conditional fetch block:
        // if (token.id && !token.subscriptionStatus) { ... }

        // console.log('JWT Callback - Returning Token:', token);
        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        // Return original token on error to avoid breaking session completely
        return token;
      }
    },
    async session({ session, token }) {
      try {
        // console.log('Session Callback - Session:', session);
        // console.log('Session Callback - Token:', token);

        if (session.user && token.id) {
          // Ensure token.id exists
          session.user.id = token.id as string;
          if (token.name) session.user.name = token.name as string;
          if (token.email) session.user.email = token.email as string;

          // Use the (now hopefully up-to-date) status from the token
          (session.user as any).subscriptionStatus =
            token.subscriptionStatus || 'inactive';
        } else {
          // Handle cases where token might be incomplete
          console.warn(
            'Session Callback: Token ID missing or session.user missing.',
            { token, session },
          );
        }

        // console.log('Session Callback - Returning Session:', session);
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
      console.log('Account linked:', {
        userId: user.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });
    },
  },
});
