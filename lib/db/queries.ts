import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  ilike,
  or,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  Chat as DBSchemaChat,
  Document,
  Message as DBSchemaMessage,
  Payment,
  Suggestion,
  User,
  UserOAuthAccountTable as UserOAuthAccount,
  chat,
  document,
  message,
  payment,
  suggestion,
  user,
  UserOAuthAccountTable,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

// Rename imported Message type from schema to avoid conflicts
// import { type Message as DBSchemaMessage } from './schema'; // Removed duplicate import

// Re-export the type for external use
export type { DBSchemaMessage };

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const users = await db.select().from(user).where(eq(user.id, userId));
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Failed to get user by ID from database');
    throw error;
  }
}

// Get user by email, including OAuth account information
export async function getUserByEmail(email: string) {
  try {
    // Find user by email
    const users = await db.select().from(user).where(eq(user.email, email));
    if (users.length === 0) return null;

    // Check if user has OAuth account
    const oauthAccounts = await db
      .select()
      .from(UserOAuthAccountTable)
      .where(eq(UserOAuthAccountTable.userId, users[0].id));

    // Return user with OAuth account info
    return {
      ...users[0],
      oauthAccounts: oauthAccounts,
    };
  } catch (error) {
    console.error('Failed to get user with OAuth info from database', error);
    return null;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    // Explicitly set subscriptionStatus to inactive for new users
    return await db.insert(user).values({
      email,
      password: hash,
      subscriptionStatus: 'inactive',
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.isPinned), desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: { messages: Array<DBSchemaMessage> }) {
  try {
    // Periksa apakah array pesan kosong
    if (!messages || messages.length === 0) {
      console.warn('No messages to save, skipping database insert');
      return { success: false, reason: 'empty_messages' };
    }

    // Directly insert the messages assuming they match the schema
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({
  id,
}: { id: string }): Promise<DBSchemaMessage[]> {
  try {
    return await db
      .select({
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        parts: message.parts,
        createdAt: message.createdAt,
        attachments: message.attachments,
      })
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({
  id,
}: { id: string }): Promise<DBSchemaMessage | undefined> {
  try {
    const [selectedMessage] = await db
      .select({
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        parts: message.parts,
        createdAt: message.createdAt,
        attachments: message.attachments,
      })
      .from(message)
      .where(eq(message.id, id));

    return selectedMessage;
  } catch (error) {
    console.error('Failed to get message by id from database', error);
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function updateChatPinnedStatus({
  chatId,
  isPinned,
}: {
  chatId: string;
  isPinned: boolean;
}) {
  try {
    return await db.update(chat).set({ isPinned }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat pinned status in database');
    throw error;
  }
}

export async function createPayment({
  orderId,
  amount,
  userId,
  snapToken,
}: {
  orderId: string;
  amount: string;
  userId: string;
  snapToken?: string;
}): Promise<Payment> {
  try {
    const [newPayment] = await db
      .insert(payment)
      .values({
        orderId,
        amount,
        userId,
        snapToken: snapToken ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newPayment;
  } catch (error) {
    console.error('Failed to create payment in database', error);
    throw error;
  }
}

export async function updatePaymentStatus({
  orderId,
  status,
  paymentType,
  transactionId,
}: {
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  paymentType?: string;
  transactionId?: string;
}) {
  try {
    const [updatedPayment] = await db
      .update(payment)
      .set({
        status,
        paymentType,
        transactionId,
        updatedAt: new Date(),
      })
      .where(eq(payment.orderId, orderId))
      .returning();
    return updatedPayment;
  } catch (error) {
    console.error('Failed to update payment status in database', error);
    throw error;
  }
}

export async function getPaymentByOrderId(
  orderId: string,
): Promise<Payment | undefined> {
  try {
    const [paymentData] = await db
      .select()
      .from(payment)
      .where(eq(payment.orderId, orderId));
    return paymentData;
  } catch (error) {
    console.error('Failed to get payment from database', error);
    throw error;
  }
}

export async function searchChatsByUserId({
  userId,
  query,
}: {
  userId: string;
  query: string;
}) {
  try {
    // Ignore any leading or trailing whitespace and make case-insensitive
    const sanitizedQuery = `%${query.trim().toLowerCase()}%`;

    // <critical>
    //   The following query uses `message.content::text ILIKE ...`.
    //   The database schema likely uses a JSONB column named `parts` instead of `content` now.
    //   This query *might fail* or return incorrect results on the current schema.
    //   For this automated task, implement the query *exactly* as written below.
    //   However, *manual review and adjustment* might be needed later to correctly query the text within the `parts` JSON structure (e.g., using JSON operators like `->>`).
    // </critical>
    const searchResults = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        userId: chat.userId,
        visibility: chat.visibility, // Include visibility
        // For the preview, take the newest matching message content
        preview: sql<string>`(
              array_agg(${message.parts}::text order by ${message.createdAt} desc)
            )[1]`, // Try targeting 'parts' first as per the latest schema
        role: sql<string>`(
          array_agg(${message.role} order by ${message.createdAt} desc)
        )[1]`,
      })
      .from(chat)
      .leftJoin(message, eq(chat.id, message.chatId))
      .where(
        and(
          eq(chat.userId, userId),
          or(
            sql`LOWER(${chat.title}) LIKE ${sanitizedQuery}`,
            // Attempt to query the text part within the JSONB structure
            // This assumes a structure like [{"type": "text", "text": "..."}]
            // Adjust path '0.text' if your structure differs. Requires appropriate indexing on parts->'0'->>'text' for performance.
            sql`LOWER((${message.parts}->'0'->>'text')) LIKE ${sanitizedQuery}`,
          ),
        ),
      )
      .groupBy(chat.id, chat.title, chat.createdAt, chat.visibility) // Add visibility to GROUP BY
      .orderBy(desc(chat.createdAt));

    console.log(`DB Search: Found ${searchResults.length} results for query "${query}". Sanitized query: "${sanitizedQuery}"`);
    return searchResults;
  } catch (error) {
    console.error(`DB Search: Error searching chats for user ${userId}, query "${query}":`, error);
    throw error; // Re-throw the error to be handled by the API route
  }
}
