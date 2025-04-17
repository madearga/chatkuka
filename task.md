Okay, mari kita susun checklist ultra-detail untuk memindahkan `ModelSelector` ke area input (`MultimodalInput`) tanpa mengganggu fungsionalitas yang ada dan memastikan responsivitas di semua perangkat, dirancang untuk AI Coding Agent yang kompeten menggunakan Bun.

---

### **Project Checklist: Relokasi ModelSelector ke Area Input [Target: Ultra-Detailed]**

**Goal:** Memindahkan komponen `ModelSelector` dari `ChatHeader` ke dalam area komponen `MultimodalInput`, tepatnya di bawah area teks input utama dan sejajar dengan tombol aksi lainnya (Upload, Search Toggle, Send). Perubahan ini harus mempertahankan semua fungsionalitas yang ada (pemilihan model, penyimpanan state, autentikasi, dll.) dan harus sepenuhnya responsif di desktop dan perangkat mobile.

**Core Constraints:**
*   **Zero Functional Regression:** Tidak boleh ada perubahan pada cara kerja pemilihan model, pengiriman pesan, upload file, autentikasi, atau fitur lainnya.
*   **Full Responsiveness:** Layout harus terlihat baik dan berfungsi di semua ukuran layar, dari mobile kecil hingga desktop besar.
*   **Visual Consistency:** Tampilan baru harus terasa menyatu dengan desain yang ada.
*   **Maintainability:** Kode harus tetap bersih dan mudah dipahami.
*   **Environment:** Menggunakan `bun run dev` untuk menjalankan aplikasi secara lokal.

---

#### **Story 1: Hapus `ModelSelector` dari Lokasi Saat Ini (`ChatHeader`) ✅**

**Goal:** Menghapus instance komponen `ModelSelector` dan dependensinya dari komponen `ChatHeader`.

**Target File:** `components/chat-header.tsx`

**Tasks:**

*   [x] **1.1: Buka File:** Buka file `components/chat-header.tsx` di editor.
*   [x] **1.2: Temukan JSX Element:** Cari elemen JSX `<ModelSelector ... />` di dalam fungsi `PureChatHeader`. Kemungkinan berada di dalam `div` pertama dengan `className="flex items-center gap-1 sm:gap-2..."` dan dikelilingi oleh kondisi `{!isReadonly && (...) }`.
*   [x] **1.3: Hapus JSX Element:** Hapus seluruh blok JSX yang merender `ModelSelector`, termasuk logika kondisional `{!isReadonly && (...) }` yang membungkusnya.
    ```diff
    -       {!isReadonly && (
    -         <ModelSelector
    -           selectedModelId={selectedModelId}
    -           className="shrink-0 max-w-[140px] sm:max-w-none"
    -         />
    -       )}
    ```
*   [x] **1.4: Hapus Import:** Cari baris `import { ModelSelector } from '@/components/model-selector';` di bagian atas file dan hapus.
*   [x] **1.5: Update Memo Comparison:** Temukan fungsi `memo(PureChatHeader, (prevProps, nextProps) => { ... });`. Hapus perbandingan `prevProps.selectedModelId === nextProps.selectedModelId` dari logika perbandingan karena prop tersebut tidak lagi diterima.
    ```diff
      export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
    -   return prevProps.selectedModelId === nextProps.selectedModelId &&
    -          prevProps.setIsSearchOpen === nextProps.setIsSearchOpen;
    +   return prevProps.setIsSearchOpen === nextProps.setIsSearchOpen;
      });
    ```
*   [x] **1.6: Hapus Prop (jika ada):** Pastikan prop `selectedModelId` juga dihapus dari definisi tipe/interface props `PureChatHeader` jika tidak lagi digunakan untuk hal lain di header (kemungkinan tidak).
*   [x] **1.7: Simpan File:** Simpan perubahan pada file `components/chat-header.tsx`.

---

#### **Story 2: Teruskan Data Model ke Lokasi Baru (`MultimodalInput`) ✅**

**Goal:** Memastikan komponen `MultimodalInput` menerima ID model yang sedang dipilih agar dapat meneruskannya ke `ModelSelector`.

**Target File:** `components/chat.tsx`

**Tasks:**

*   [x] **2.1: Buka File:** Buka file `components/chat.tsx`.
*   [x] **2.2: Temukan Instance Komponen:** Cari tempat komponen `<MultimodalInput ... />` dirender di dalam fungsi `Chat`.
*   [x] **2.3: Tambahkan Prop:** Tambahkan prop `selectedChatModel` ke komponen `<MultimodalInput />`, meneruskan nilai `selectedChatModel` yang sudah diterima oleh komponen `Chat`.
    ```diff
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
    +             selectedChatModel={selectedChatModel} // TAMBAHKAN PROP INI
                  handleSubmit={(e, chatRequestOptions) => {
                    // ... existing code ...
                  }}
                  isLoading={isLoading}
                  // ... rest of the props ...
                />
    ```
*   [x] **2.4: Simpan File:** Simpan perubahan pada file `components/chat.tsx`.

---

#### **Story 3: Integrasikan Struktur `ModelSelector` ke dalam `MultimodalInput` ✅**

**Goal:** Menambahkan `ModelSelector` ke dalam struktur JSX `MultimodalInput` dan menata ulang layout tombol aksi.

**Target File:** `components/multimodal-input.tsx`

**Tasks:**

*   [x] **3.1: Buka File:** Buka file `components/multimodal-input.tsx`.
*   [x] **3.2: Import Komponen:** Tambahkan `import { ModelSelector } from '@/components/model-selector';` di bagian atas file.
*   [x] **3.3: Update Props Interface:** Temukan definisi tipe/interface untuk props `PureMultimodalInput` (atau nama serupa). Tambahkan properti `selectedChatModel: string;`.
    ```typescript
    // Contoh (sesuaikan dengan struktur Anda):
    interface PureMultimodalInputProps {
      // ... props yang sudah ada
      selectedChatModel: string;
      className?: string;
    }
    ```
*   [x] **3.4: Terima Prop:** Dalam definisi fungsi `PureMultimodalInput`, tambahkan `selectedChatModel` ke dalam daftar props yang di-destructure.
*   [x] **3.5: Identifikasi Container Utama:** Cari `div` terluar yang membungkus `Textarea` dan tombol-tombol aksi. Div ini kemungkinan memiliki `className` yang mengandung `relative`, `border`, `rounded-xl`.
*   [x] **3.6: Buat Baris Bawah Baru:** *Tepat di bawah* elemen `<Textarea ... />`, buat `div` baru. Ini akan menjadi container untuk `ModelSelector` dan tombol aksi.
    ```typescript
        <Textarea
          // ... props textarea ...
        />
        {/* BARIS BAWAH BARU */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 border-t dark:border-zinc-700 bg-transparent">
          {/* ModelSelector akan masuk di sini */}
          {/* Tombol Aksi akan masuk di sini */}
        </div>
    ```
*   [x] **3.7: Render `ModelSelector`:** Di dalam `div` baru yang dibuat pada langkah 3.6, tempatkan komponen `ModelSelector` sebagai elemen *pertama*. Teruskan prop `selectedChatModel` padanya.
    ```typescript
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 border-t dark:border-zinc-700 bg-transparent">
          <ModelSelector selectedChatModel={selectedChatModel} className="ISI STYLING NANTI" />
          {/* Tombol Aksi akan masuk di sini */}
        </div>
    ```
*   [x] **3.8: Pindahkan Tombol Aksi:**
    *   Cari `div` yang *sebelumnya* berisi tombol-tombol aksi (Upload, Search Toggle, Send/Stop). Kemungkinan besar `div` ini memiliki `position: absolute`.
    *   Pindahkan *seluruh konten* dari `div` absolut ini (yaitu, semua `button` di dalamnya) ke dalam `div` baris bawah baru yang dibuat pada langkah 3.6, *setelah* `<ModelSelector />`.
    *   Bungkus tombol-tombol aksi yang dipindahkan dalam `div` baru dengan class `flex items-center gap-1 sm:gap-2`.
    ```typescript
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 border-t dark:border-zinc-700 bg-transparent">
          <ModelSelector selectedChatModel={selectedChatModel} className="ISI STYLING NANTI" />
          {/* Container baru untuk tombol aksi */}
          <div className="flex items-center gap-1 sm:gap-2 chat-input-buttons">
            {/* Tombol Search Toggle */}
            <button type="button" aria-label={...} onClick={() => setIsSearchEnabled(!isSearchEnabled)} /* ... */>
              <Globe size={18} />
            </button>
            {/* Tombol Upload */}
            <button type="button" aria-label="Upload file" /* ... */>
              {/* ... icon ... */}
            </button>
            {/* Tombol Send/Stop */}
            {isLoading ? (
              <button type="button" aria-label="Stop generating" /* ... */>
                <X size={18} />
              </button>
            ) : (
              <button type="button" aria-label={isSearchEnabled ? 'Search web' : 'Send message'} /* ... */>
                <ArrowUp size={16} className="sm:size-[18px]" />
              </button>
            )}
          </div>
        </div>
    ```
*   [x] **3.9: Hapus Container Tombol Absolut Lama:** Hapus `div` kosong yang *sebelumnya* berisi tombol-tombol aksi (yang memiliki `position: absolute`).
*   [x] **3.10: Simpan File:** Simpan perubahan pada file `components/multimodal-input.tsx`.

---

#### **Story 4: Styling dan Responsivitas `ModelSelector` di `MultimodalInput` ✅**

**Goal:** Menyesuaikan styling CSS (menggunakan Tailwind dan `cn`) agar `ModelSelector` dan tombol aksi lainnya terlihat rapi dan berfungsi baik di semua ukuran layar.

**Target File:** `components/multimodal-input.tsx`

**Tasks:**

*   [x] **4.1: Buka File:** Buka file `components/multimodal-input.tsx`.
*   [x] **4.2: Styling `ModelSelector`:**
    *   Temukan elemen `<ModelSelector ... />` yang dirender.
    *   Gunakan prop `className` dengan `cn` untuk menerapkan styling agar lebih kecil dan menyatu dengan baris bawah: `className={cn('h-7 text-xs px-1 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 ring-offset-0 focus-visible:ring-0')}`.
*   [x] **4.3: Styling Container Utama:**
    *   Temukan `div` terluar yang membungkus `Textarea` dan baris bawah (yang memiliki `rounded-xl border`).
    *   Tambahkan `flex flex-col` ke kelasnya jika belum ada.
    *   Tambahkan `focus-within:ring-1 focus-within:ring-ring focus-within:border-input` untuk memindahkan indikator fokus ke container utama.
*   [x] **4.4: Styling `Textarea`:**
    *   Temukan elemen `<Textarea ... />`.
    *   Pastikan `className` menggunakan `cn`.
    *   **Hapus** `rounded-b-xl` (jika ada).
    *   **Tambahkan** `rounded-t-xl`.
    *   **Hapus** padding kanan yang sebelumnya ditambahkan untuk tombol absolut (e.g., `pr-14 sm:pr-20`). Padding kiri/kanan umum (`px-3 sm:px-4`) harus tetap ada.
    *   **Hapus** `focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-ring` atau serupa (fokus dipindahkan ke container). Tambahkan `focus-visible:ring-0`.
    *   **Pastikan** `min-h-[48px]` (atau nilai serupa) masih ada untuk tinggi