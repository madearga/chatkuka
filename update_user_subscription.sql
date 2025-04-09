-- SQL untuk memperbarui status user di Supabase

-- 1. Perbarui semua user yang ada menjadi user free
UPDATE "User"
SET 
  "subscriptionStatus" = 'inactive',
  "isPaid" = false,
  "planId" = NULL,
  "currentPeriodEnd" = NULL;

-- 2. Contoh SQL untuk memperbarui user tertentu menjadi user pro
-- Ganti 'user-id-yang-sudah-membayar' dengan ID user yang ingin diubah menjadi pro
UPDATE "User"
SET 
  "subscriptionStatus" = 'active',
  "isPaid" = true,
  "planId" = 'monthly_99k',
  "currentPeriodEnd" = NOW() + INTERVAL '1 month'
WHERE "id" = 'user-id-yang-sudah-membayar';

-- 3. Contoh SQL untuk melihat status langganan semua user
SELECT 
  "id", 
  "email", 
  "subscriptionStatus", 
  "isPaid", 
  "planId", 
  "currentPeriodEnd"
FROM "User";
