import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  role: varchar('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  name: varchar('name', { length: 100 }),
  // Subscription fields
  isPaid: boolean('isPaid'),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
  subscriptionStatus: varchar('subscriptionStatus', {
    enum: ['inactive', 'active', 'pending_activation', 'past_due', 'cancelled'],
  }).default('inactive'),
  subscriptionId: varchar('subscriptionId'),
  currentPeriodEnd: timestamp('currentPeriodEnd'),
  // New Midtrans subscription fields
  planId: varchar('planId', { length: 50 }),
  midtransPaymentTokenId: text('midtransPaymentTokenId'),
});

export type User = InferSelectModel<typeof user>;

// Define OAuth providers enum
export const oAuthProviders = ['google'] as const;
export type OAuthProvider = (typeof oAuthProviders)[number];

// Create UserOAuthAccount table
export const UserOAuthAccountTable = pgTable('UserOAuthAccount', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  provider: varchar('provider', { enum: oAuthProviders }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type UserOAuthAccount = InferSelectModel<typeof UserOAuthAccountTable>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  isPinned: boolean('isPinned').notNull().default(false),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  attachments: json('attachments').default('[]').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const payment = pgTable('Payment', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  orderId: varchar('orderId', { length: 64 }).notNull(),
  amount: varchar('amount', { length: 20 }).notNull(),
  status: varchar('status', {
    enum: ['pending', 'success', 'failed', 'expired'],
  })
    .notNull()
    .default('pending'),
  snapToken: text('snapToken'),
  paymentType: varchar('paymentType', { length: 50 }),
  transactionId: varchar('transactionId', { length: 100 }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Payment = InferSelectModel<typeof payment>;
