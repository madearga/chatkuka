import { cookies } from 'next/headers';
import { db } from '@/lib/db/db';
import { OAuthProvider, UserOAuthAccountTable, user as UserTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Connect user to OAuth account
export async function connectUserToAccount(
  { id, email, name }: { id: string; email: string; name: string },
  provider: OAuthProvider
) {
  console.log(`Connecting OAuth account: ${provider} - ${id} - ${email}`);
  
  return db.transaction(async (trx: any) => {
    // Find existing user by email
    let user = await trx.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
      columns: { id: true, role: true, email: true, name: true },
    });

    console.log('Existing user found:', user);

    // Create new user if not exists
    if (user == null) {
      console.log('Creating new user for OAuth account');
      const [newUser] = await trx
        .insert(UserTable)
        .values({
          email: email,
          name: name,
        })
        .returning({ id: UserTable.id, role: UserTable.role, email: UserTable.email, name: UserTable.name });
      user = newUser;
      console.log('New user created:', user);
    }

    // Check if OAuth account already exists
    const existingAccount = await trx.query.UserOAuthAccountTable.findFirst({
      where: eq(UserOAuthAccountTable.providerAccountId, id),
    });

    // Link OAuth account to user if not already linked
    if (!existingAccount) {
      console.log('Linking OAuth account to user');
      await trx
        .insert(UserOAuthAccountTable)
        .values({
          provider,
          providerAccountId: id,
          userId: user.id,
        })
        .onConflictDoNothing();
      console.log('OAuth account linked successfully');
    } else {
      console.log('OAuth account already linked');
    }

    return user;
  });
}

// Create user session
export async function createUserSession(
  user: { id: string; role: string },
  cookieStore: ReturnType<typeof cookies>
) {
  // Set session cookie
  const cookieList = await cookieStore;
  cookieList.set('user_session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}
