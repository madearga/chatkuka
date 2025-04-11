-- Migration: Remove 'paidUntil' column from 'User' table
ALTER TABLE "User" DROP COLUMN IF EXISTS "paidUntil";
