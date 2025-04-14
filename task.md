Oke, ini adalah *checklist* yang sangat terperinci, dirancang untuk AI Coding Agent, guna mengimplementasikan kemampuan agar *artifact* tetap terlihat pada chat publik meskipun sesi pengguna telah berakhir atau pengguna tidak login, meniru perilaku `chat.vercel.ai`.

**Tujuan Utama:** Memodifikasi *codebase* `madearga-chatkuka.git` sehingga ketika sebuah chat diatur ke 'public', URL chat tersebut (`/chat/[id]`) dapat diakses dan menampilkan riwayat pesan beserta *artifact preview* oleh siapa saja (termasuk pengguna yang tidak login), sementara chat 'private' tetap memerlukan autentikasi.

**Prasyarat:** AI Agent memiliki akses penuh ke *codebase*, dapat menjalankan perintah `bun`, berinteraksi dengan database, dan memahami Next.js App Router, AI SDK, Drizzle, dan NextAuth.

---

### **Project Checklist: Implement Public Chat Artifact Persistence**

---

**Epic 1: Modifikasi Kontrol Akses Level Halaman (Page-Level)**

*   **Goal:** Mengizinkan Server Component halaman chat (`/chat/[id]/page.tsx`) untuk me-render konten chat publik meskipun pengguna tidak terautentikasi.
*   **Rationale:** Halaman ini adalah pertahanan terakhir sebelum rendering. Ia perlu memeriksa visibilitas chat dari database sebelum memutuskan apakah akses diizinkan atau tidak.

    *   #### **Story 1.1: Sesuaikan Logika Pemeriksaan Sesi & Visibilitas di Halaman Chat**
        *   **Kontext:** Saat ini, halaman `/chat/[id]/page.tsx` kemungkinan langsung mengembalikan `notFound()` atau redirect jika `session` tidak ada, tanpa memeriksa visibilitas chat.
        *   **Requirements:** Halaman harus memeriksa `chat.visibility`. Jika 'public', render halaman (dalam mode read-only). Jika 'private', *baru* periksa sesi dan kepemilikan.

        *   **Task 1.1.1:** ✅ Buka file `app/(chat)/chat/[id]/page.tsx`.
        *   **Task 1.1.2:** ✅ Temukan blok kode setelah `const chat = await getChatById({ id });` dan `const session = await auth();` yang melakukan pemeriksaan akses. Blok ini kemungkinan terlihat seperti:
            ```typescript
            if (chat.visibility === 'private') {
              if (!session || !session.user) {
                return notFound(); // Atau redirect('/login')
              }
              if (session.user.id !== chat.userId) {
                return notFound();
              }
            }
            // Mungkin ada check lain di sini yang mengasumsikan session selalu ada
            ```
        *   **Task 1.1.3:** ✅ **Modifikasi** logika pemeriksaan tersebut menjadi seperti berikut:
            ```typescript
            const session = await auth(); // Ambil sesi

            let canView = false;
            let isOwner = false;

            if (chat.visibility === 'public') {
              canView = true; // Chat publik bisa dilihat siapa saja
              if (session?.user?.id === chat.userId) {
                isOwner = true; // Jika ada sesi dan dia pemiliknya
              }
            } else { // chat.visibility === 'private'
              if (session?.user?.id === chat.userId) {
                canView = true; // Hanya pemilik yang bisa lihat chat private
                isOwner = true;
              }
            }

            if (!canView) {
              // Jika tidak bisa lihat (private & bukan pemilik/tidak login),
              // redirect ke login atau tampilkan notFound
              // Pilih salah satu:
              // 1. Redirect (lebih user-friendly jika ingin login):
              //    redirect(`/login?callbackUrl=/chat/${id}`);
              // 2. Not Found (lebih ketat):
                   notFound();
            }

            // Jika bisa lihat, lanjutkan ke rendering
            // Variabel 'isOwner' menentukan apakah chat read-only atau tidak
            const isReadonly = !isOwner;

            // ... (kode untuk mengambil messagesFromDb dan cookieStore tetap sama) ...

            // Pastikan isReadonly diteruskan ke komponen Chat
            return (
              <>
                <Chat
                  id={chat.id}
                  initialMessages={convertToUIMessages(messagesFromDb)}
                  selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
                  selectedVisibilityType={chat.visibility}
                  isReadonly={isReadonly} // <-- Gunakan variabel isReadonly
                />
                <DataStreamHandler id={id} />
              </>
            );
            ```
        *   **Task 1.1.4:** ✅ Pastikan variabel `isReadonly` (yang bernilai `!isOwner`) diteruskan dengan benar ke komponen `<Chat>`.
        *   **Task 1.1.5:** ✅ Hapus blok `if (!session || !session.user)` yang mungkin ada *sebelum* pemeriksaan visibilitas jika itu menghalangi pemeriksaan visibilitas publik.

---

**Epic 2: Modifikasi Kontrol Akses Middleware**

*   **Goal:** Mengizinkan *request* untuk URL `/chat/[id]` mencapai Server Component halaman (dari Epic 1) meskipun pengguna tidak login, sehingga halaman tersebut dapat melakukan pemeriksaan visibilitas berbasis database.
*   **Rationale:** Middleware berjalan lebih awal. Melakukan query DB di middleware untuk setiap request `/chat/[id]` akan berdampak pada performa. Cara yang lebih umum (dan kemungkinan digunakan oleh `chat.vercel.ai`) adalah membiarkan middleware mengizinkan request ke *pattern* URL chat, dan *page component*-lah yang melakukan validasi akses akhir berdasarkan data chat spesifik.

    *   #### **Story 2.1: Relaksasi Aturan Middleware untuk Rute `/chat/[id]`**
        *   **Kontext:** Middleware saat ini (`middleware.ts`) kemungkinan besar memiliki aturan yang secara eksplisit memblokir akses ke semua rute di bawah `/` (termasuk `/chat/[id]`) jika pengguna tidak login (kecuali untuk `/login`, `/register`, `/api/auth`).
        *   **Requirements:** Middleware harus mengizinkan request ke `/chat/[...]` untuk diteruskan ke *page component* meskipun tidak ada sesi aktif.

        *   **Task 2.1.1:** ✅ Buka file `middleware.ts`.
        *   **Task 2.1.2:** ✅ Temukan logika di dalam *callback* `NextAuth(...).auth(async (req) => { ... })`.
        *   **Task 2.1.3:** ✅ Cari kondisi yang menangani akses ke rute chat saat tidak login. Ini mungkin terlihat seperti:
            ```typescript
            const requiresAuth = !isPublicPath(path); // isPublicPath mungkin tidak menganggap /chat/[id] public
            if (requiresAuth && !isLoggedIn) {
              // ... logika redirect ke /login ...
              return NextResponse.redirect(loginUrl);
            }
            ```
            Atau, jika menggunakan logika `authorized` dari `authConfig` sebelumnya:
            ```typescript
            // Di dalam authorized callback
            if (isOnChat) {
              if (isLoggedIn) return true;
              return false; // <-- INI YANG PERLU DIUBAH
            }
            ```
        *   **Task 2.1.4:** ✅ **Modifikasi** logika tersebut. Secara spesifik, jika path *match* dengan pola `/chat/[id]` (Anda mungkin perlu menambahkan helper atau regex untuk ini, atau perbarui `isPublicPath` jika digunakan) DAN `!isLoggedIn`, **jangan langsung redirect/return false**. Izinkan request tersebut lolos (`return NextResponse.next()` atau `return true` dalam konteks `authorized` callback).
            *   **Pendekatan dengan `NextAuth(...).auth` wrapper (lebih modern):**
                ```typescript
                export default NextAuth(authConfig).auth(async (req) => {
                  const { nextUrl } = req;
                  const session = req.auth;
                  const isLoggedIn = !!session;
                  const path = nextUrl.pathname;
                  const isChatPath = /^\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(path); // Regex untuk /chat/[uuid]

                  // 1. Bypass Midtrans webhook (sudah ada)
                  if (path === '/api/payment/notification') {
                    return NextResponse.next();
                  }

                  // 2. Cek Rute Publik Standar (login, register, api/auth)
                  const isStdPublic = isPublicPath(path); // Pastikan isPublicPath TIDAK mencakup /chat/[id]

                  if (isStdPublic) {
                    // Jika sudah login dan mengakses login/register, redirect ke home
                    if (isLoggedIn && (path === '/login' || path === '/register')) {
                      return NextResponse.redirect(new URL('/', nextUrl.origin));
                    }
                    // Izinkan akses ke rute publik standar lainnya
                    return NextResponse.next();
                  }

                  // 3. Cek Rute Chat Spesifik (/chat/[id])
                  if (isChatPath) {
                    // Izinkan request lolos ke page component, baik login maupun tidak.
                    // Page component akan handle visibilitas.
                    return NextResponse.next();
                  }

                  // 4. Rute Lainnya (membutuhkan login)
                  if (!isLoggedIn) {
                    const loginUrl = new URL('/login', nextUrl.origin);
                    loginUrl.searchParams.set('callbackUrl', path);
                    return NextResponse.redirect(loginUrl);
                  }

                  // 5. Pengguna sudah login dan mengakses rute terproteksi selain chat
                  return NextResponse.next();
                });
                ```
            *   **Pendekatan dengan `authorized` callback (jika masih menggunakan itu):**
                ```typescript
                // Di dalam authConfig callbacks:
                authorized({ auth, request: { nextUrl } }) {
                  const isLoggedIn = !!auth?.user;
                  const path = nextUrl.pathname;
                  const isChatPath = /^\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(path);
                  const isOnRegister = path.startsWith('/register');
                  const isOnLogin = path.startsWith('/login');
                  const isOnAuth = path.startsWith('/api/auth');

                  if (isOnAuth) return true; // Selalu izinkan rute NextAuth

                  // Jika sudah login dan ada di login/register, redirect ke home
                  if (isLoggedIn && (isOnLogin || isOnRegister)) {
                    return Response.redirect(new URL('/', nextUrl));
                  }

                  // Izinkan akses ke login/register jika belum login
                  if (!isLoggedIn && (isOnLogin || isOnRegister)) {
                    return true;
                  }

                  // Jika ini rute chat spesifik, biarkan page component yg memutuskan
                  if (isChatPath) {
                    return true;
                  }

                  // Untuk semua rute lain, perlukan login
                  if (!isLoggedIn) {
                    return false; // Akan redirect ke login page (didefinisikan di authConfig.pages)
                  }

                  // Jika sudah login dan bukan di login/register/chat, izinkan
                  return true;
                },
                ```
        *   **Task 2.1.5:** ✅ Pastikan `matcher` di `config` middleware tidak secara tidak sengaja mengecualikan `/chat/[id]`. Konfigurasi `matcher` yang ada (`'/((?!_next/static|...$).*)'`) seharusnya sudah mencakupnya.

---

**Epic 3: Penyempurnaan UI untuk Chat Publik**

*   **Goal:** Memberikan indikasi visual dan fungsionalitas yang jelas saat sebuah chat bersifat publik.
*   **Rationale:** Pengguna perlu tahu status visibilitas chat dan cara membagikannya jika publik.

    *   #### **Story 3.1: Tambahkan Fungsionalitas "Copy Link"**
        *   **Kontext:** Saat chat bersifat publik, pengguna mungkin ingin menyalin link untuk dibagikan.
        *   **Requirements:** Muncul opsi "Copy Link" di menu "More" pada item chat di sidebar *hanya jika* chat tersebut publik.

        *   **Task 3.1.1:** ✅ Buka file `components/sidebar-history.tsx` (tidak ada file sidebar-history-item.tsx terpisah).
        *   **Task 3.1.2:** ✅ Temukan komponen `PureChatItem`.
        *   **Task 3.1.3:** ✅ Di dalam `DropdownMenuContent`, *di atas* item "Delete", tambahkan item baru untuk "Copy Link".
        *   **Task 3.1.4:** ✅ Gunakan hook `useChatVisibility` (sudah ada) untuk mendapatkan `visibilityType`.
        *   **Task 3.1.5:** ✅ Tambahkan kondisi `disabled={visibilityType !== 'public'}` pada `DropdownMenuItem` "Copy Link".
        *   **Task 3.1.6:** ✅ Implementasikan `onSelect` untuk `DropdownMenuItem` "Copy Link":
            ```typescript
            onSelect={() => {
              if (visibilityType === 'public') {
                const url = `${window.location.origin}/chat/${chat.id}`;
                navigator.clipboard.writeText(url)
                  .then(() => {
                    toast.success('Public link copied!');
                  })
                  .catch(err => {
                    toast.error('Failed to copy link.');
                    console.error('Failed to copy link: ', err);
                  });
              } else {
                toast.info('Set chat to public to copy link.');
              }
            }}
            ```
        *   **Task 3.1.7 (Optional):** ✅ Tambahkan ikon `LinkIcon` (atau yang sesuai) di sebelah teks "Copy Link".

    *   #### **Story 3.2: Indikator Visual untuk Chat Publik (Opsional)**
        *   **Kontext:** Memberi tanda visual cepat pada item chat di sidebar jika bersifat publik.
        *   **Requirements:** Ikon (misalnya GlobeIcon) muncul di sebelah judul chat publik.

        *   **Task 3.2.1:** ✅ Buka file `components/sidebar-history.tsx` (tidak ada file sidebar-history-item.tsx terpisah).
        *   **Task 3.2.2:** ✅ Di dalam `SidebarMenuButton` (sebelum `<span>{chat.title}</span>`), tambahkan ikon secara kondisional:
            ```typescript
            <SidebarMenuButton asChild isActive={isActive} className={`flex-grow ${isActive ? 'active-gold' : ''}`}>
              <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)} className="flex items-center gap-2"> {/* Tambah flex & gap */}
                {visibilityType === 'public' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                       {/* Cegah event click menyebar ke Link */}
                       <span onClick={(e) => e.stopPropagation()} aria-label="Public chat">
                         <GlobeIcon size={12} className="text-muted-foreground flex-shrink-0" />
                       </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                       Public Chat
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className="truncate">{chat.title}</span>
              </Link>
            </SidebarMenuButton>
            ```
        *   **Task 3.2.3:** ✅ Pastikan `Tooltip` dan komponen terkait diimpor jika belum.

---

**Epic 4: Verifikasi Akhir & Pengujian**

*   **Goal:** Memastikan semua perubahan berfungsi sesuai harapan dan tidak menimbulkan masalah baru.

    *   #### **Story 4.1: Pengujian Skenario Chat Publik**
        *   **Task 4.1.1:** Login ke aplikasi.
        *   **Task 4.1.2:** Buat chat baru (misalnya tentang "Essay Silicon Valley") dan pastikan artifact teks terbuat.
        *   **Task 4.1.3:** Klik ikon "More" (...) pada item chat "Essay Silicon Valley" di sidebar.
        *   **Task 4.1.4:** Pilih "Share" -> "Public". Verifikasi ikon globe kecil mungkin muncul di sebelah judul chat.
        *   **Task 4.1.5:** Klik lagi ikon "More", pilih "Copy Link". Verifikasi toast sukses muncul.
        *   **Task 4.1.6:** Buka *incognito window* atau browser lain (tanpa login).
        *   **Task 4.1.7:** Paste URL yang disalin ke address bar.
        *   **Task 4.1.8:** **Verifikasi:** Halaman chat "Essay Silicon Valley" berhasil dimuat. Pesan-pesan terlihat. *Preview artifact* teks juga terlihat. Input chat di bagian bawah seharusnya *disabled* atau tidak ada.
        *   **Task 4.1.9:** Kembali ke browser tempat Anda login. Klik "More" -> "Share" -> "Private".
        *   **Task 4.1.10:** Refresh halaman di *incognito window*.
        *   **Task 4.1.11:** **Verifikasi:** Anda seharusnya dialihkan ke halaman login, atau halaman chat menampilkan error "Not Found".

    *   #### **Story 4.2: Pengujian Skenario Chat Privat**
        *   **Task 4.2.1:** Login ke aplikasi.
        *   **Task 4.2.2:** Buat chat baru (pastikan statusnya private by default atau atur ke private).
        *   **Task 4.2.3:** Salin URL chat tersebut.
        *   **Task 4.2.4:** Logout.
        *   **Task 4.2.5:** Coba akses URL chat privat yang disalin.
        *   **Task 4.2.6:** **Verifikasi:** Anda dialihkan ke halaman login.

    *   #### **Story 4.3: Pengujian Regresi**
        *   **Task 4.3.1:** Login. Pastikan Anda dapat membuat dan berinteraksi dengan chat privat seperti biasa.
        *   **Task 4.3.2:** Pastikan artifact (teks, kode, gambar) dibuat dan ditampilkan dengan benar dalam chat privat.
        *   **Task 4.3.3:** Pastikan fitur lain (voting, edit pesan, model selector, dll.) masih berfungsi normal di chat privat.
        *   **Task 4.3.4:** Pastikan middleware masih melindungi rute lain yang memerlukan autentikasi (misalnya, halaman `/subscription` jika ada).

---