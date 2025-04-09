# Midtrans Subscription Payment Integration Checklist

## Story: Initial Setup & Configuration

-   [ ] **Midtrans:** Buat akun Midtrans Sandbox.
-   [ ] **Midtrans:** Catat *Client Key* Sandbox dari Dashboard Midtrans (Settings > Access Keys).
-   [ ] **Midtrans:** Catat *Server Key* Sandbox dari Dashboard Midtrans (Settings > Access Keys).
-   [ ] **Supabase:** Buat proyek baru di Supabase.
-   [ ] **Supabase:** Catat *Project URL* dari Supabase Dashboard (Project Settings > API).
-   [ ] **Supabase:** Catat *Service Role Key* (API Key `service_role`) dari Supabase Dashboard (Project Settings > API). **PERINGATAN:** Jaga kerahasiaan kunci ini.
-   [ ] **Project:** Tentukan nama environment variable yang akan digunakan (contoh: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_SNAP_URL`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_ENV`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
-   [ ] **Project:** Buat file `.env.local` (atau `.env` sesuai preferensi).
-   [ ] **Project:** Isi file `.env.local` dengan nilai-nilai kunci API dan URL yang sesuai:
    -   `MIDTRANS_SERVER_KEY`: Server Key Midtrans Sandbox.
    -   `MIDTRANS_CLIENT_KEY`: Client Key Midtrans Sandbox.
    -   `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: Client Key Midtrans Sandbox (prefix `NEXT_PUBLIC_` agar bisa diakses di frontend).
    -   `NEXT_PUBLIC_MIDTRANS_SNAP_URL`: URL Snap.js Sandbox (`https://app.sandbox.midtrans.com/snap/snap.js`).
    -   `MIDTRANS_ENV`: Set ke `sandbox`.
    -   `DATABASE_URL`: Connection string PostgreSQL dari Supabase (Project Settings > Database > Connection string).
    -   `SUPABASE_SERVICE_ROLE_KEY`: Kunci `service_role` Supabase.
-   [ ] **Project:** Instal dependensi yang diperlukan: `midtrans-client`, `drizzle-orm`, `postgres` (jika menggunakan `node-postgres` dengan Drizzle), `zod`.

## Story: Database Schema Definition (Supabase & Drizzle)

-   [ ] **Schema:** Definisikan skema untuk tabel `User` di `lib/db/schema.ts` menggunakan Drizzle ORM.
    -   [ ] Pastikan tabel `User` memiliki kolom `id` (uuid, primary key).
    -   [ ] Pastikan tabel `User` memiliki kolom `email` (varchar).
    -   [ ] Tambahkan kolom `subscriptionStatus` (varchar, enum: 'active', 'inactive', 'pending_activation', 'past_due', 'none', default: 'none').
    -   [ ] Tambahkan kolom `currentPeriodEnd` (timestamp, nullable).
    -   [ ] Tambahkan kolom `midtransPaymentTokenId` (varchar, nullable, untuk menyimpan ID token kartu kredit jika menggunakan simpan kartu).
-   [ ] **Schema:** Definisikan skema untuk tabel `Payment` di `lib/db/schema.ts`.
    -   [ ] Tambahkan kolom `id` (uuid, primary key, default random).
    -   [ ] Tambahkan kolom `orderId` (varchar, not null, unique).
    -   [ ] Tambahkan kolom `amount` (varchar, not null).
    -   [ ] Tambahkan kolom `status` (varchar, enum: 'pending', 'success', 'failed', 'expired', not null, default: 'pending').
    -   [ ] Tambahkan kolom `snapToken` (text, nullable).
    -   [ ] Tambahkan kolom `paymentType` (varchar, nullable).
    -   [ ] Tambahkan kolom `transactionId` (varchar, nullable, unique).
    -   [ ] Tambahkan kolom `userId` (uuid, not null, foreign key ke `User.id`).
    -   [ ] Tambahkan kolom `createdAt` (timestamp, not null, default now).
    -   [ ] Tambahkan kolom `updatedAt` (timestamp, not null, default now).
-   [ ] **Migration:** Buat konfigurasi Drizzle Kit (`drizzle.config.ts`).
-   [ ] **Migration:** Jalankan perintah Drizzle Kit untuk menghasilkan file migrasi SQL (`npx drizzle-kit generate:pg`).
-   [ ] **Migration:** Jalankan perintah Drizzle Kit untuk menerapkan migrasi ke database Supabase (`npx drizzle-kit push:pg`).
-   [ ] **Migration:** Verifikasi bahwa tabel `User` dan `Payment` berhasil dibuat di Supabase Dashboard.

## Story: Backend Utilities (`lib/`)

-   [ ] **Midtrans Client:** Buat file `lib/midtrans.ts`.
    -   [ ] Inisialisasi `midtransClient.Snap` menggunakan `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan `MIDTRANS_ENV`.
    -   [ ] Inisialisasi `midtransClient.CoreApi` (opsional, jika diperlukan untuk fitur lain seperti direct charge).
    -   [ ] Handle error saat inisialisasi (misalnya jika key tidak ada, log warning).
    -   [ ] Ekspor instance `snap` (dan `coreApi` jika ada).
-   [ ] **Create Transaction:** Implementasikan fungsi `async function createSnapTransaction(params)` di `lib/midtrans.ts`.
    -   [ ] Terima parameter seperti `orderId`, `amount`, `customer`, `items`.
    -   [ ] Format parameter sesuai struktur yang dibutuhkan oleh `snap.createTransaction()`.
    -   [ ] Panggil `snap.createTransaction()` dengan parameter yang sudah diformat.
    -   [ ] Kembalikan `{ token, redirectUrl }` dari respons Midtrans.
    -   [ ] Tangani error (misalnya log error, throw error).
-   [ ] **Verify Signature:** Implementasikan fungsi `async function verifyWebhookSignature(params)` di `lib/midtrans.ts`.
    -   [ ] Terima parameter: `orderId` (string), `statusCode` (string), `grossAmount` (string, format 'XXX.00'), `receivedSignature` (string, dari body JSON).
    -   [ ] Ambil `MIDTRANS_SERVER_KEY` dari environment variable. **Pastikan menggunakan kunci yang benar**.
    -   [ ] Bentuk string komponen: `orderId + statusCode + grossAmount + serverKey`. **Pastikan urutan dan formatnya benar**.
    -   [ ] Tambahkan logging detail untuk `signatureComponent`, `serverKey`, `receivedSignature` untuk debugging.
    -   [ ] Hitung hash SHA-512 dari `signatureComponent`.
    -   [ ] Tambahkan logging detail untuk `calculatedSignature`.
    -   [ ] Bandingkan `calculatedSignature` dengan `receivedSignature`.
    -   [ ] Tambahkan logging detail untuk hasil perbandingan (`isValid`).
    -   [ ] Kembalikan `boolean` hasil perbandingan.
    -   [ ] Tangani error (misalnya log error, return `false`).
-   [ ] **Database Queries:** Buat file `lib/db/queries.ts`.
    -   [ ] Implementasikan `async function createPayment(data)` untuk menyimpan record ke tabel `Payment` dengan status `pending`.
    -   [ ] Implementasikan `async function updatePaymentStatus(data)` untuk memperbarui `status`, `paymentType`, `transactionId`, `updatedAt` di tabel `Payment` berdasarkan `orderId`. Pastikan fungsi ini mengembalikan data yang cukup (minimal `userId`) jika diperlukan oleh pemanggil.
    -   [ ] Implementasikan `async function updateUserSubscription(data)` untuk memperbarui `subscriptionStatus`, `currentPeriodEnd`, `updatedAt` (dan `midtransPaymentTokenId` jika relevan) di tabel `User` berdasarkan `userId`.
    -   [ ] Implementasikan `async function handleFailedSubscription(data)` untuk memperbarui `subscriptionStatus` (misal ke 'past_due' atau 'inactive') di tabel `User` berdasarkan `userId` jika pembayaran gagal/kadaluarsa.
-   [ ] **Order ID:** Implementasikan fungsi `generateOrderId(prefix)` di `lib/midtrans.ts` atau file utility lain.
    -   [ ] Pastikan menghasilkan ID unik (kombinasi prefix, timestamp, random).
    -   [ ] Gunakan prefix berbeda untuk jenis transaksi (misal `SUB_INIT_` untuk langganan awal).

## Story: Backend API Route - Subscription Initiation

-   [ ] **API Route:** Buat file API route (misalnya `app/api/subscriptions/initiate/route.ts`).
-   [ ] **Authentication:** Gunakan helper `auth()` dari NextAuth untuk memastikan hanya pengguna yang login yang bisa mengakses endpoint ini. Kembalikan 401 jika tidak login.
-   [ ] **Request Handling:** Definisikan fungsi `export async function POST(request: Request)`.
-   [ ] **Order ID:** Panggil `generateOrderId('SUB_INIT_')` untuk membuat ID pesanan langganan.
-   [ ] **Data:** Siapkan data transaksi (misalnya, ambil harga dari database atau konstanta, detail item).
-   [ ] **DB Log (Initial):** Panggil `createPayment` untuk mencatat transaksi awal di tabel `Payment` dengan status `pending`. Tangani potensi error DB (mungkin log saja tanpa menghentikan proses).
-   [ ] **Midtrans Call:** Panggil `createSnapTransaction` dengan data transaksi yang sesuai.
-   [ ] **Response:** Jika `createSnapTransaction` berhasil, kembalikan `{ token }` Midtrans ke frontend dalam respons JSON (status 200).
-   [ ] **Error Handling:** Tangani error dari `createSnapTransaction` atau proses lainnya, kembalikan respons error JSON yang sesuai (misal status 500).

## Story: Backend API Route - Webhook Notification Handling

-   [ ] **API Route:** Buat file API route `app/api/payment/notification/route.ts`. **Pastikan route ini publik dan tidak diblokir middleware otentikasi.**
-   [ ] **Request Handling:** Definisikan fungsi `export async function POST(request: Request)`.
-   [ ] **Logging:** Tambahkan log di awal fungsi untuk menandakan request diterima.
-   [ ] **Read Body:** Baca *raw body* dari request (`await request.text()`).
-   [ ] **Parse JSON:** Parse *raw body* menjadi objek `notification` (`JSON.parse`). Tangani error parsing (return 400). Log body yang diparsing.
-   [ ] **Extract Data:** Ekstrak field yang diperlukan dari `notification`: `order_id`, `transaction_status`, `status_code`, `gross_amount`, `signature_key`, `payment_type`, `transaction_id`, `fraud_status`.
-   [ ] **Extract Signature:** Ambil `signature_key` dari *body JSON*. Return 400 jika tidak ada.
-   [ ] **Validate Data:** Pastikan field penting (`orderId`, `statusCode`, `grossAmount`, `signature_key`) ada. Return 400 jika kurang.
-   [ ] **Verify Signature:** Panggil `verifyWebhookSignature` dengan data yang diekstrak (`orderId`, `statusCode`, `grossAmount`, `signatureFromBody`). **Pastikan menggunakan `MIDTRANS_SERVER_KEY` untuk verifikasi**. Return 403 jika verifikasi gagal. Log hasil verifikasi.
-   [ ] **Fraud Check:** Periksa `fraud_status`.
    -   [ ] Jika `deny`, log, update status payment ke `failed` (opsional), return 200 OK.
    -   [ ] Jika `challenge`, log, return 200 OK (anggap pending/review manual).
    -   [ ] Jika **bukan** `accept`, log, return 200 OK.
    -   [ ] Hanya lanjutkan jika `fraud_status` adalah `accept`. Log status fraud.
-   [ ] **Determine Status:** Tentukan status internal (`success`, `failed`, `expired`, `pending`) berdasarkan `transaction_status` Midtrans. Log status internal.
-   [ ] **Update Payment DB:** Panggil `updatePaymentStatus` untuk memperbarui record di tabel `Payment` dengan status internal, `paymentType`, `transactionId`. Log sebelum dan sesudah update.
-   [ ] **Subscription Check:** Periksa apakah `orderId` dimulai dengan `SUB_INIT_` atau `SUB_RENEW_`.
-   [ ] **Update User DB (Success):** Jika prefix cocok DAN status internal adalah `success`:
    -   [ ] Panggil `updateUserSubscription` untuk mengaktifkan langganan pengguna (set `subscriptionStatus = 'active'`, hitung dan set `currentPeriodEnd`, simpan `midtransPaymentTokenId` jika ada). Pastikan `userId` didapat dari hasil `updatePaymentStatus` atau query ulang. Log sebelum dan sesudah update user.
-   [ ] **Update User DB (Failed/Expired):** Jika prefix cocok DAN status internal adalah `failed` atau `expired`:
    -   [ ] Panggil `handleFailedSubscription` untuk menonaktifkan langganan pengguna (set `subscriptionStatus = 'inactive'` atau `'past_due'`). Log tindakan.
-   [ ] **Final Response:** Kembalikan `NextResponse.json({ success: true })` dengan status **200 OK** ke Midtrans jika proses sampai akhir (meskipun ada error *internal* saat update DB, agar Midtrans tidak retry). Log respons sukses.
-   [ ] **Global Error Handling:** Gunakan `try...catch` di sekitar seluruh logika fungsi `POST`. Jika ada error tak terduga, log error tersebut dan kembalikan respons JSON error dengan status 500.

## Story: Frontend Implementation

-   [ ] **UI Component:** Buat komponen React (misal `SubscriptionStatus` di `components/subscription-status.tsx` atau tombol di `app/subscription/page.tsx`).
    -   [ ] Tampilkan status langganan pengguna saat ini (ambil dari sesi atau fetch API).
    -   [ ] Tampilkan tombol "Upgrade to Pro" atau "Subscribe" jika pengguna belum berlangganan.
    -   [ ] Tampilkan info status aktif dan tanggal perpanjangan jika sudah berlangganan.
    -   [ ] Tampilkan tombol "Cancel Subscription" (jika implementasi pembatalan ada).
-   [ ] **Load Snap.js:** Gunakan `useEffect` untuk memuat skrip Midtrans Snap.js (`NEXT_PUBLIC_MIDTRANS_SNAP_URL`) secara dinamis saat komponen dimuat.
    -   [ ] Set atribut `data-client-key` dengan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
    -   [ ] Gunakan state (`snapScriptLoaded`) untuk melacak status pemuatan.
    -   [ ] Nonaktifkan tombol bayar sampai skrip selesai dimuat.
    -   [ ] Tangani error saat memuat skrip (tampilkan pesan error).
-   [ ] **Handle Payment Initiation:** Buat fungsi `async function handleSubscribe()` yang dipicu oleh tombol "Upgrade".
    -   [ ] Set state `isLoading` atau `isInitiating`.
    -   [ ] Pastikan `window.snap` sudah tersedia.
    -   [ ] Panggil endpoint backend `/api/subscriptions/initiate` menggunakan `fetch` (method `POST`).
    -   [ ] Tangani respons: Jika error, tampilkan pesan error (toast).
    -   [ ] Jika sukses, dapatkan `token` dari respons JSON.
-   [ ] **Embed Snap Popup:** Jika token diterima:
    -   [ ] Panggil `window.snap.embed(token, { embedId: 'snap-container', ...callbacks })`.
    -   [ ] Definisikan callback `onSuccess`: Tampilkan pesan sukses (toast), mungkin refresh data/halaman setelah beberapa detik.
    -   [ ] Definisikan callback `onPending`: Tampilkan pesan pending (toast). Reset state `isLoading`.
    -   [ ] Definisikan callback `onError`: Tampilkan pesan error (toast). Reset state `isLoading`.
    -   [ ] Definisikan callback `onClose`: Reset state `isLoading`.
-   [ ] **UI State:** Kelola state `isLoading`/`isInitiating` untuk menampilkan status proses dan menonaktifkan tombol saat diperlukan.

## Story: Middleware Configuration

-   [ ] **Middleware File:** Buka file `middleware.ts` di root proyek.
-   [ ] **Auth Wrapper:** Gunakan pola `export default NextAuth(authConfig).auth(async (req) => { ... });`.
-   [ ] **Webhook Bypass:** Di *awal* fungsi middleware, tambahkan kondisi `if (req.nextUrl.pathname === '/api/payment/notification') { return NextResponse.next(); }` untuk mengizinkan webhook lewat tanpa pemeriksaan apapun.
-   [ ] **Premium Check:** Implementasikan kembali logika pemeriksaan `subscriptionStatus === 'active'` untuk route `/premium/*` *setelah* memastikan `req.auth` (sesi) ada. Redirect ke `/subscription` jika status tidak aktif.
-   [ ] **Matcher:** Konfigurasikan `export const config = { matcher: [...] }`.
    -   [ ] Pastikan matcher *tidak* secara eksplisit mengecualikan `/premium/*` atau `/api/premium/*` jika Anda ingin middleware memprosesnya.
    -   [ ] Gunakan negative lookahead untuk mengecualikan file statis (`_next/static`, `_next/image`, `favicon.ico`).
    -   [ ] Secara opsional (tapi direkomendasikan untuk kejelasan), kecualikan juga `/api/payment/notification` di matcher, meskipun logika fungsi sudah menanganinya.

## Story: Deployment & Testing

-   [ ] **Environment (Prod):** Siapkan environment variable untuk produksi:
    -   Gunakan kunci API Midtrans **Produksi**.
    -   Set `MIDTRANS_ENV=production`.
    -   Set `NEXT_PUBLIC_MIDTRANS_SNAP_URL` ke URL Snap.js Produksi (`https://app.midtrans.com/snap/snap.js`).
    -   Gunakan kunci dan URL Supabase produksi.
-   [ ] **Midtrans Config (Prod):** Di dashboard Midtrans Produksi:
    -   Masukkan URL Notifikasi (Webhook) yang benar menunjuk ke endpoint `/api/payment/notification` di server produksi Anda.
-   [ ] **Testing (Sandbox):** Lakukan pengujian menyeluruh di Sandbox:
    -   [ ] Pembayaran berhasil (Bank Transfer, Kartu Kredit jika diaktifkan). Verifikasi status DB (`Payment` & `User`).
    -   [ ] Pembayaran pending. Verifikasi status DB.
    -   [ ] Pembayaran gagal. Verifikasi status DB.
    -   [ ] Pembayaran kadaluarsa. Verifikasi status DB.
    -   [ ] Verifikasi signature (coba dengan server key salah sementara).
    -   [ ] Akses halaman premium (login/logout, status aktif/tidak).
    -   [ ] Akses webhook endpoint langsung (harus bisa tanpa login, mungkin return error jika tanpa body/signature).
-   [ ] **Testing (Production):** Lakukan tes minimal di produksi setelah deploy. 