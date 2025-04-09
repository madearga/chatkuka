import { and, eq } from 'drizzle-orm';
import { Adapter } from 'next-auth/adapters';
import { db } from './db';
import { user, UserOAuthAccountTable } from './schema';

/**
 * Drizzle adapter for NextAuth
 * This adapter connects NextAuth directly to our database schema
 *
 * Since we're using JWT sessions, we don't need to implement all session-related methods,
 * but we still need to provide them to satisfy the Adapter interface.
 */
export function DrizzleAdapter(): Adapter {
  return {
    // Create a user
    async createUser(data) {
      console.log('DrizzleAdapter.createUser', data);
      try {
        const [newUser] = await db
          .insert(user)
          .values({
            email: data.email,
            name: data.name || null,
            // Set default subscription status to inactive for new users
            subscriptionStatus: 'inactive',
            // Note: emailVerified is not in our schema, so we don't include it
          })
          .returning();

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name || null,
          emailVerified: null,
        };
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    // Get a user by their ID
    async getUser(id) {
      console.log('DrizzleAdapter.getUser', id);
      try {
        const [foundUser] = await db
          .select()
          .from(user)
          .where(eq(user.id, id));

        if (!foundUser) return null;

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name || null,
          emailVerified: null,
        };
      } catch (error) {
        console.error('Error getting user:', error);
        return null;
      }
    },

    // Get a user by their email
    async getUserByEmail(email) {
      console.log('DrizzleAdapter.getUserByEmail', email);
      try {
        const [foundUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, email));

        if (!foundUser) return null;

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name || null,
          emailVerified: null,
        };
      } catch (error) {
        console.error('Error getting user by email:', error);
        return null;
      }
    },

    // Get a user by their account
    async getUserByAccount({ provider, providerAccountId }) {
      console.log('DrizzleAdapter.getUserByAccount', provider, providerAccountId);
      try {
        const [result] = await db
          .select({
            user: user,
          })
          .from(UserOAuthAccountTable)
          .innerJoin(user, eq(UserOAuthAccountTable.userId, user.id))
          .where(
            and(
              eq(UserOAuthAccountTable.provider, provider as any),
              eq(UserOAuthAccountTable.providerAccountId, providerAccountId)
            )
          );

        if (!result) return null;

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || null,
          emailVerified: null,
        };
      } catch (error) {
        console.error('Error getting user by account:', error);
        return null;
      }
    },

    // Update a user
    async updateUser(userData) {
      console.log('DrizzleAdapter.updateUser', userData);
      try {
        const [updatedUser] = await db
          .update(user)
          .set({
            name: userData.name || null,
            email: userData.email,
            // Note: emailVerified is not in our schema, so we don't include it
          })
          .where(eq(user.id, userData.id))
          .returning();

        return {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || null,
          emailVerified: null,
        };
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    // Link an account to a user
    async linkAccount(account) {
      console.log('DrizzleAdapter.linkAccount', account);
      try {
        // Check if account already exists
        const existingAccount = await db
          .select()
          .from(UserOAuthAccountTable)
          .where(
            and(
              eq(UserOAuthAccountTable.provider, account.provider as any),
              eq(UserOAuthAccountTable.providerAccountId, account.providerAccountId)
            )
          );

        if (existingAccount.length > 0) {
          console.log('Account already exists, returning existing account');
          return account;
        }

        await db.insert(UserOAuthAccountTable).values({
          provider: account.provider as any,
          providerAccountId: account.providerAccountId,
          userId: account.userId,
        });

        return account;
      } catch (error) {
        console.error('Error linking account:', error);
        throw error;
      }
    },

    // The following methods are stubs since we're using JWT sessions
    // but they're required by the Adapter interface

    async createSession({ sessionToken, userId, expires }) {
      console.log('DrizzleAdapter.createSession - Using JWT sessions instead');
      return {
        sessionToken,
        userId,
        expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      console.log('DrizzleAdapter.getSessionAndUser - Using JWT sessions instead');
      // Return null to force NextAuth to use JWT sessions
      return null;
    },

    async updateSession(session) {
      console.log('DrizzleAdapter.updateSession - Using JWT sessions instead');
      // Return null since we're using JWT sessions
      return null;
    },

    async deleteSession(sessionToken) {
      console.log('DrizzleAdapter.deleteSession - Using JWT sessions instead');
      // No-op since we're using JWT sessions
    },

    async createVerificationToken(verificationToken) {
      console.log('DrizzleAdapter.createVerificationToken');
      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      console.log('DrizzleAdapter.useVerificationToken');
      return null;
    },

    async deleteUser(userId) {
      console.log('DrizzleAdapter.deleteUser');
      try {
        await db.delete(user).where(eq(user.id, userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },

    async unlinkAccount({ provider, providerAccountId }) {
      console.log('DrizzleAdapter.unlinkAccount');
      try {
        await db
          .delete(UserOAuthAccountTable)
          .where(
            and(
              eq(UserOAuthAccountTable.provider, provider as any),
              eq(UserOAuthAccountTable.providerAccountId, providerAccountId)
            )
          );
      } catch (error) {
        console.error('Error unlinking account:', error);
        throw error;
      }
    },
  };
}