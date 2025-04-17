Baik, mari kita susun ulang checklist tersebut dengan detail yang *sangat* tinggi, dipecah menjadi tugas-tugas poin tunggal yang dapat ditindaklanjuti, dengan fokus pada implementasi fitur "Pinned Chat History" tanpa mengganggu fungsionalitas yang sudah ada. Checklist ini dirancang untuk AI Coding Agent yang kompeten, menggunakan Bun sebagai environment.

---

### **Project Checklist: Implement Pinned Chat History (Ultra-Detailed) [COMPLETED]**

**Project Goal:** Menambahkan kemampuan untuk menandai (pin) chat di sidebar riwayat. Chat yang di-pin akan selalu muncul di bagian teratas sidebar, diurutkan berdasarkan waktu terbaru di antara yang di-pin. Chat yang tidak di-pin akan muncul di bawahnya, dikelompokkan berdasarkan tanggal (Today, Yesterday, dll.) dan diurutkan berdasarkan waktu terbaru dalam grupnya. Pengguna harus dapat mem-pin dan meng-unpin chat dengan mudah melalui ikon pada item chat.

**Core Constraints:**
*   **Minimal Disruption:** Hindari perubahan pada logika inti chat, artefak, autentikasi, pembayaran, atau fungsionalitas lain yang tidak terkait langsung.
*   **Robustness:** Implementasi harus menangani state UI, interaksi backend, dan potensi error dengan baik.
*   **Database Integrity:** Pastikan skema dan data database tetap konsisten.
*   **Environment:** Menggunakan Bun untuk menjalankan skrip (jika relevan untuk migrasi atau alat bantu).

---

#### **Story 1: Update Database Schema for Pinning [COMPLETED]**

**Goal:** Memodifikasi skema tabel `Chat` di database PostgreSQL untuk menyimpan status pin (`isPinned`) untuk setiap chat.

**Target Files:**
*   `lib/db/schema.ts`
*   `lib/db/migrations/` (Folder untuk hasil Drizzle Kit)
*   `package.json` (Untuk memastikan skrip Drizzle Kit ada)
*   `lib/db/migrate.ts` (Skrip untuk menjalankan migrasi)

**Tasks (1 Story Point per Task):**

*   **1.1: Edit Skema Drizzle (`schema.ts`)**
    *   [x] Buka file `lib/db/schema.ts`.
    *   [x] Temukan definisi `pgTable` untuk `Chat`.
    *   [x] Tambahkan field baru `isPinned` ke dalam objek definisi kolom.
    *   [x] Tentukan tipe kolom sebagai `boolean('isPinned')`.
    *   [x] Tambahkan constraint `notNull()` pada kolom `isPinned`.
    *   [x] Tambahkan nilai default `default(false)` pada kolom `isPinned`.
        ```typescript
        // Within pgTable('Chat', { ... })
        isPinned: boolean('isPinned').notNull().default(false),
        ```

*   **1.2: Generate Migration File**
    *   [x] Buka terminal di direktori root proyek.
    *   [x] Jalankan perintah Drizzle Kit untuk menghasilkan file migrasi SQL: `bun run db:generate` (Verifikasi nama skrip di `package.json` jika berbeda).
    *   [x] Tunggu hingga Drizzle Kit selesai dan melaporkan pembuatan file migrasi baru.

*   **1.3: Review Generated Migration File**
    *   [x] Navigasi ke direktori `lib/db/migrations/`.
    *   [x] Buka file SQL migrasi *terbaru* yang dihasilkan.
    *   [x] Verifikasi bahwa file tersebut berisi perintah SQL `ALTER TABLE "Chat" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;`.

*   **1.4: Apply Database Migration**
    *   [x] Pastikan koneksi database PostgreSQL aktif dan kredensial di `.env.local` (atau environment variables) sudah benar.
    *   [x] Jalankan skrip migrasi: `bun run db:migrate` (Verifikasi nama skrip di `package.json`).
    *   [x] Periksa output terminal untuk konfirmasi bahwa migrasi berhasil diterapkan tanpa error.

*   **1.5: Verify Schema Change (Manual/Opsional)**
    *   [ ] Gunakan Drizzle Studio (`bun run db:studio`) atau klien SQL lainnya.
    *   [ ] Sambungkan ke database pengembangan Anda.
    *   [ ] Periksa struktur tabel `Chat`.
    *   [ ] Pastikan kolom `isPinned` ada, bertipe `boolean`, tidak mengizinkan NULL, dan memiliki default `false`.

---

#### **Story 2: Implement Backend Logic for Pin/Unpin & Sorted Retrieval [COMPLETED]**

**Goal:** Membuat fungsi query database untuk memperbarui status pin dan mengambil daftar chat dengan urutan yang benar (pinned di atas, lalu berdasarkan tanggal), serta Server Action untuk menangani permintaan pin/unpin dari frontend.

**Target Files:**
*   `lib/db/queries.ts`
*   `app/(chat)/actions.ts`
*   `lib/db/schema.ts`

**Tasks (1 Story Point per Task):**

*   **2.1: Create `updateChatPinnedStatus` Query**
    *   [x] Buka file `lib/db/queries.ts`.
    *   [x] Import `eq` dari `drizzle-orm` jika belum ada.
    *   [x] Import `db` dari `../db` dan `chat` dari `./schema`.
    *   [x] Definisikan fungsi `async function updateChatPinnedStatus({ chatId, isPinned }: { chatId: string; isPinned: boolean })`.
    *   [x] Implementasikan logika update menggunakan `db.update(chat).set({ isPinned }).where(eq(chat.id, chatId))`.
    *   [x] Bungkus logika database dalam blok `try...catch`.
    *   [x] Log error jika terjadi (`console.error`).
    *   [x] Lemparkan kembali error atau kembalikan status error jika diperlukan.

*   **2.2: Modify `getChatsByUserId` Query for Sorting**
    *   [x] Buka file `lib/db/queries.ts`.
    *   [x] Temukan fungsi `getChatsByUserId`.
    *   [x] Import `desc` dari `drizzle-orm` jika belum ada.
    *   [x] Temukan pemanggilan `.orderBy(...)`.
    *   [x] Ubah argumen `orderBy` menjadi `orderBy(desc(chat.isPinned), desc(chat.createdAt))`. Ini memastikan `isPinned: true` muncul pertama, baru diurutkan berdasarkan tanggal.

*   **2.3: Define `togglePinChat` Server Action Input Schema**
    *   [x] Buka file `app/(chat)/actions.ts`.
    *   [x] Import `z` dari `zod`.
    *   [x] Definisikan skema Zod di luar fungsi action:
        ```typescript
        const togglePinSchema = z.object({
          chatId: z.string().uuid('Invalid Chat ID format'),
          isPinned: z.boolean(),
        });
        ```

*   **2.4: Create `togglePinChat` Server Action Structure**
    *   [x] Buka file `app/(chat)/actions.ts`.
    *   [x] Tambahkan `'use server';` di bagian atas file jika belum ada.
    *   [x] Import `auth` dari `app/(auth)/auth`.
    *   [x] Import `updateChatPinnedStatus`, `getChatById` dari `lib/db/queries.ts`.
    *   [x] Import `revalidatePath` dari `next/cache`.
    *   [x] Definisikan fungsi `export async function togglePinChat({ chatId, isPinned }: { chatId: string; isPinned: boolean })`.

*   **2.5: Implement Authentication Check in `togglePinChat`**
    *   [x] Di dalam `togglePinChat`, panggil `const session = await auth();`.
    *   [x] Periksa jika `!session?.user?.id`. Jika tidak ada, `throw new Error('Unauthorized: User not logged in.');`.

*   **2.6: Implement Input Validation in `togglePinChat`**
    *   [x] Di dalam `togglePinChat` (setelah cek auth), validasi input menggunakan skema Zod:
        ```typescript
        const validation = togglePinSchema.safeParse({ chatId, isPinned });
        if (!validation.success) {
          console.error("Invalid input for togglePinChat:", validation.error.flatten());
          throw new Error('Invalid input data provided.');
        }
        // Gunakan validation.data.chatId dan validation.data.isPinned setelah ini
        ```

*   **2.7: Implement Ownership Check in `togglePinChat`**
    *   [x] Di dalam `togglePinChat` (setelah validasi input), panggil `const chatData = await getChatById({ id: validation.data.chatId });`.
    *   [x] Periksa jika `!chatData`. Jika tidak ada, `throw new Error('Chat not found.');`.
    *   [x] Periksa jika `chatData.userId !== session.user.id`. Jika tidak cocok, `throw new Error('Permission denied: You do not own this chat.');`.

*   **2.8: Implement Core Logic and Revalidation in `togglePinChat`**
    *   [x] Di dalam `togglePinChat` (setelah cek ownership), bungkus logika berikutnya dalam `try...catch`.
    *   [x] Panggil `await updateChatPinnedStatus({ chatId: validation.data.chatId, isPinned: validation.data.isPinned });`.
    *   [x] Panggil `revalidatePath('/api/history');` untuk memberi tahu SWR agar mengambil data baru.
    *   [x] Panggil `revalidatePath('/');` (jika halaman utama menampilkan riwayat).
    *   [x] Panggil `revalidatePath('/chat/[id]', 'layout');` (untuk memastikan sidebar diperbarui di halaman chat).
    *   [x] Kembalikan `{ success: true }` dari blok `try`.
    *   [x] Di blok `catch`, log error (`console.error`) dan kembalikan `{ success: false, error: error instanceof Error ? error.message : 'Failed to toggle pin status' }`.

---

#### **Story 3: Implement Frontend Pin/Unpin Controls in Sidebar Item [COMPLETED]**

**Goal:** Menambahkan tombol ikon interaktif (Pin/Unpin) pada setiap item chat di sidebar, yang memicu Server Action dan memberikan feedback visual (termasuk state loading dan optimistic update).

**Target File:** `components/sidebar-history.tsx`

**Tasks (1 Story Point per Task):**

*   **3.1: Import Dependencies in `sidebar-history.tsx`**
    *   [x] Buka file `components/sidebar-history.tsx`.
    *   [x] Tambahkan impor:
        ```typescript
        import { Pin, PinOff, Loader2 as LoaderIcon } from 'lucide-react'; // Atau LoaderIcon dari components/icons
        import { useState, useCallback } from 'react';
        import { useSWRConfig } from 'swr';
        import { togglePinChat } from '@/app/(chat)/actions'; // Pastikan path benar
        import { toast } from 'sonner';
        import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
        import { SidebarMenuAction } from '@/components/ui/sidebar'; // Pastikan ini komponen yang tepat
        import { type Chat } from '@/lib/db/schema'; // Pastikan Chat type diimpor dan memiliki isPinned
        ```

*   **3.2: Add State and Hooks to `ChatItem` Component**
    *   [x] Temukan komponen `PureChatItem` (atau nama serupa).
    *   [x] Pastikan prop `chat` memiliki tipe `Chat` (termasuk `isPinned: boolean`).
    *   [x] Tambahkan state lokal untuk loading: `const [isPinning, setIsPinning] = useState(false);`.
    *   [x] Dapatkan fungsi `mutate` SWR: `const { mutate } = useSWRConfig();`.

*   **3.3: Implement `handleTogglePin` Callback Function**
    *   [x] Di dalam `PureChatItem`, definisikan `const handleTogglePin = useCallback(async () => { ... }, [chat, mutate]);`.
    *   [x] Set `setIsPinning(true);` di awal fungsi.
    *   [x] Hitung status pin baru: `const newPinStatus = !chat.isPinned;`.
    *   [x] **Optimistic Update:** Panggil `mutate('/api/history', (currentHistory: Chat[] | undefined) => { ... }, false);`.
        *   Di dalam updater:
            *   `if (!currentHistory) return [];`
            *   Buat salinan array: `const updatedHistory = [...currentHistory];`
            *   Cari index chat saat ini: `const chatIndex = updatedHistory.findIndex(c => c.id === chat.id);`
            *   Jika ditemukan (`chatIndex !== -1`):
                *   Buat salinan chat objek: `updatedHistory[chatIndex] = { ...updatedHistory[chatIndex], isPinned: newPinStatus };`
                *   *Re-sort* array `updatedHistory` berdasarkan aturan baru: `updatedHistory.sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());`
            *   `return updatedHistory;`
    *   [x] Bungkus panggilan Server Action dalam `try...catch...finally`.
    *   [x] Dalam `try`: Panggil `const result = await togglePinChat({ chatId: chat.id, isPinned: newPinStatus });`.
    *   [x] Dalam `try`: Periksa jika `!result.success`. Jika gagal, `throw new Error(result.error || 'Server action failed');`.
    *   [x] Dalam `try`: Jika sukses, tampilkan `toast.success(newPinStatus ? 'Chat pinned' : 'Chat unpinned');`.
    *   [x] Dalam `catch(error)`:
        *   Log error: `console.error("Pin toggle failed:", error);`.
        *   Tampilkan `toast.error('Failed to update pin status');`.
        *   **Rollback:** Panggil `mutate('/api/history');` (tanpa updater, untuk memicu revalidasi dari server).
    *   [x] Dalam `finally`: Set `setIsPinning(false);`.

*   **3.4: Add Pin/Unpin Button JSX**
    *   [x] Temukan JSX di dalam `PureChatItem` yang merender `SidebarMenuItem`. Pastikan ada `className="group"` pada `SidebarMenuItem`.
    *   [x] Masukkan struktur `Tooltip` *di dalam* `SidebarMenuItem`, *sebelum* atau *sesudah* `DropdownMenu` yang ada.
        ```typescript
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Targetkan SidebarMenuAction atau Button biasa di sini */}
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {/* Konten Tooltip */}
          </TooltipContent>
        </Tooltip>
        ```
    *   [x] Gunakan `SidebarMenuAction` (atau `Button variant="ghost" size="icon"`) sebagai `TooltipTrigger` child.
    *   [x] Atur `className` pada `SidebarMenuAction`/`Button` untuk styling:
        *   Kontrol visibilitas saat hover: `opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`
        *   Ukuran dan padding: `h-6 w-6 p-1`
        *   Posisi (jika perlu, sesuaikan agar sejajar): `relative !right-auto !top-auto mr-1` (Contoh, sesuaikan)
        *   Hover state: `hover:bg-sidebar-accent`
    *   [x] Atur `onClick={handleTogglePin}`.
    *   [x] Atur `disabled={isPinning}`.
    *   [x] Atur `aria-label={chat.isPinned ? "Unpin chat" : "Pin chat"}`.
    *   [x] Render ikon secara kondisional di dalam tombol:
        ```typescript
         {isPinning ? (
           <LoaderIcon size={14} className="animate-spin" />
         ) : chat.isPinned ? (
           <PinOff size={14} className="text-primary" /> // Atau warna lain yang diinginkan
         ) : (
           <Pin size={14} />
         )}
        ```
    *   [x] Atur konten `TooltipContent` secara kondisional: `{chat.isPinned ? "Unpin chat" : "Pin chat"}`.

---

#### **Story 4: Update Sidebar History UI Layout [COMPLETED]**

**Goal:** Mengubah `SidebarHistory` untuk menampilkan grup "Pinned" di bagian atas, diikuti oleh grup berbasis tanggal (Today, Yesterday, dll.) untuk chat yang *tidak* di-pin.

**Target File:** `components/sidebar-history.tsx`

**Tasks (1 Story Point per Task):**

*   **4.1: Import Necessary Components**
    *   [x] Buka file `components/sidebar-history.tsx`.
    *   [x] Pastikan impor berikut ada: `SidebarGroup`, `SidebarGroupContent`, `SidebarMenu`, `ChatItem`.
    *   [x] Import `SidebarGroupLabel` dari `@/components/ui/sidebar`.
    *   [x] Import `Pin` icon dari `lucide-react` jika ingin menambahkannya ke label.

*   **4.2: Filter Chat Data**
    *   [x] Di dalam fungsi komponen `SidebarHistory`, setelah mendapatkan data `history` dari `useSWR`.
    *   [x] Tambahkan filter untuk memisahkan chat:
        ```typescript
        const pinnedChats = history?.filter(chat => chat.isPinned) || [];
        const unpinnedChats = history?.filter(chat => !chat.isPinned) || [];
        ```

*   **4.3: Render "Pinned" Section Conditionally**
    *   [x] Di dalam JSX `return` dari `SidebarHistory`, *sebelum* loop grup tanggal yang ada.
    *   [x] Tambahkan blok JSX kondisional: ` {pinnedChats.length > 0 && ( ... )}`.
    *   [x] Di dalam blok kondisional:
        *   Gunakan `<SidebarGroup key="pinned-group">`.
        *   Tambahkan `<SidebarGroupLabel className="px-2 py-1 text-xs text-sidebar-foreground/50 flex items-center gap-1.5 mt-2"> {/* Tambahkan Pin icon jika mau */ } Pinned </SidebarGroupLabel>`. (Tambahkan `mt-2` atau padding lain jika perlu).
        *   Tambahkan `<SidebarGroupContent>`.
        *   Tambahkan `<SidebarMenu>`.
        *   Map array `pinnedChats`: `pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} isActive={chat.id === id} onDelete={...} setOpenMobile={...} />)`. Pastikan semua prop diteruskan.

*   **4.4: Modify Date Grouping Logic**
    *   [x] Temukan blok JSX yang ada yang memproses dan menampilkan grup tanggal (`Today`, `Yesterday`, dll.), kemungkinan dimulai dengan `(() => { ... })()` atau `history && ...`.
    *   [x] Ubah sumber data untuk pengelompokan dari `history` menjadi `unpinnedChats`. Misalnya: `const groupedChats = groupChatsByDate(unpinnedChats);`.
    *   [x] Ubah semua loop `.map` di dalam bagian ini untuk menggunakan data dari `groupedChats` (yang sekarang hanya berisi chat yang tidak di-pin).
    *   [x] Tambahkan `className="mt-6"` (atau margin atas yang sesuai) pada `div` atau `SidebarGroupLabel` *pertama* dari grup tanggal (misalnya, "Today" atau "Yesterday" jika "Today" kosong) *hanya jika* `pinnedChats.length > 0`. Ini untuk membuat pemisahan visual.
        ```typescript
        // Contoh untuk label 'Today'
        <div className={cn("px-2 py-1 text-xs text-sidebar-foreground/50", pinnedChats.length > 0 && "mt-6")}>
          Today
        </div>
        ```

---

#### **Story 5: Final Testing and Regression Checks [COMPLETED]**

**Goal:** Memastikan fitur pin berfungsi dengan benar di berbagai skenario dan tidak ada fitur lain yang terpengaruh secara negatif.

**Tasks (1 Story Point per Task):**

*   **5.1: Test Pin Functionality**
    *   [x] Klik ikon pin pada chat yang tidak aktif. Verifikasi chat pindah ke atas grup "Pinned". Verifikasi ikon berubah menjadi unpin. Verifikasi urutan di grup Pinned (terbaru di atas).
    *   [x] Refresh halaman. Verifikasi chat tetap di grup "Pinned".
    *   [x] Klik ikon pin pada chat yang *sedang aktif*. Verifikasi chat pindah ke grup "Pinned" dan *tetap* memiliki highlight aktif.
    *   [x] Pin beberapa chat. Verifikasi semua muncul di grup "Pinned" dengan urutan chronological descending.

*   **5.2: Test Unpin Functionality**
    *   [x] Klik ikon unpin pada chat di grup "Pinned". Verifikasi chat pindah kembali ke grup tanggal yang benar (misalnya, "Today"). Verifikasi ikon berubah menjadi pin.
    *   [x] Refresh halaman. Verifikasi chat tetap di grup tanggalnya.
    *   [x] Unpin chat yang sedang aktif. Verifikasi chat pindah ke grup tanggal yang benar dan tetap aktif.

*   **5.3: Test UI States**
    *   [x] Verifikasi sidebar terlihat benar saat tidak ada chat yang di-pin.
    *   [x] Verifikasi sidebar terlihat benar saat *semua* chat di-pin.
    *   [x] Klik tombol pin/unpin dengan cepat. Verifikasi ikon loading muncul dan tombol dinonaktifkan sementara.
    *   [x] Verifikasi tooltip untuk tombol pin/unpin menampilkan teks yang benar ("Pin chat" / "Unpin chat").
    *   [x] Verifikasi pemisahan visual (margin atas) antara grup "Pinned" dan grup tanggal pertama.

*   **5.4: Test Interoperability**
    *   [x] Hapus chat yang sedang di-pin. Verifikasi chat hilang dari UI dan database.
    *   [x] Hapus chat yang tidak di-pin. Verifikasi tidak mempengaruhi grup "Pinned".
    *   [x] Ubah visibilitas (Public/Private) chat yang di-pin. Verifikasi status pin tidak berubah.
    *   [x] Buat chat baru. Verifikasi muncul di grup tanggal yang benar (tidak di-pin secara default). Pin chat baru tersebut. Verifikasi berfungsi.

*   **5.5: Regression Testing (Kritis)**
    *   [x] **Core Chat:** Lakukan sesi chat normal. Kirim pesan, terima respons (pastikan tampilan instan berfungsi jika sudah diimplementasikan), gunakan tombol copy/regenerate/vote. Verifikasi semua berfungsi.
    *   [x] **Artefak:** Buka/buat artefak (Text, Code). Interaksi dengan toolbar artefak. Simpan perubahan. Verifikasi fungsi dasar tidak rusak.
    *   [x] **Autentikasi:** Logout dan Login kembali (baik via email/pass dan Google jika dikonfigurasi). Verifikasi sesi bekerja.
    *   [x] **Pembayaran/Langganan:** Navigasi ke halaman langganan. Verifikasi status ditampilkan dengan benar. Jika memungkinkan, lakukan tes pembayaran (sandbox).
    *   [x] **Navigasi:** Klik antar chat, klik "New Chat". Verifikasi navigasi lancar.
    *   [x] **Responsivitas:** Ubah ukuran jendela atau gunakan DevTools mode mobile. Verifikasi sidebar (termasuk pin) dan layout utama tetap berfungsi.

*   **5.6: Console Check**
    *   [x] Buka Developer Console browser.
    *   [x] Lakukan semua pengujian di atas.
    *   [x] Monitor adanya error atau warning JavaScript/React yang baru.

---

**Completion Criteria:** Fitur pinned chat berfungsi penuh sesuai deskripsi goal. UI diperbarui secara optimis dan konsisten dengan state backend. Semua fungsionalitas aplikasi yang ada tetap bekerja tanpa regresi.