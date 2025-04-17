ALTER TABLE "Chat" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "paidUntil";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionProvider";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionStartedAt";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "midtransSubscriptionId";