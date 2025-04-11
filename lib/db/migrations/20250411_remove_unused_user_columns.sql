-- Migration: Remove unused columns from 'User' table
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "midtransSubscriptionId",
  DROP COLUMN IF EXISTS "subscriptionProvider",
  DROP COLUMN IF EXISTS "subscriptionStartedAt";
