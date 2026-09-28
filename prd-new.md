# Solulu Platform: Master Technical Product Requirement Document (PRD)
**Nomor Dokumen:** 008/PRD-MASTER/SOLULU/IX/2026  
**Versi:** 8.2 (Unified Master Specification - Hardened Asynchronous Fulfillment & Complete Operational Contracts)  
**Estimasi Biaya Server:** Rp 0 / bulan (*Zero-Cost Baseline*)  
**Status Dokumen:** Approved Architecture Benchmark

---

## 1. Ringkasan Eksekutif & Value Proposition
* **Problem Statement:** Calon klien membutuhkan layanan konseling mental yang terjangkau, cepat (*frictionless*), dan aman secara privasi. Di sisi lain, platform harus beroperasi secara *zero-cost* dengan memanfaatkan akun Zoom Pro pribadi yang terbatas (2 akun) tanpa risiko *double booking* atau kekacauan jadwal.
* **Core Value Proposition:** 
  1. **Zero-Cost Teleconsultation Engine:** Berjalan penuh di atas tier gratis (Vercel, Supabase, Cloudflare R2, Upstash QStash, Resend, Xendit).
  2. **Dynamic Zoom Host Dispatcher with App-Managed Locking:** Mengelola 2 akun Zoom independen langsung dari dashboard admin dengan mekanisme penguncian (*safety lock*) otomatis.
  3. **Automated Clinical Triage & Risk Mitigation:** Skrining SRQ-20 mandiri dengan deteksi risiko bunuh diri (*suicidal ideation*) dan *Emergency Clinical Waiver Modal*.
  4. **Frictionless Guest Checkout & Session Recovery:** Pasien tidak wajib mendaftar akun; akses sesi dikirim via tautan aman `/session/[token]`, email, dan dapat dipulihkan mandiri di `/cek-sesi`.
  5. **Privacy-First Public Gallery & Dual-Bucket Storage:** Pemisahan mutlak aset publik dan berkas medis/legal privat.

---

## 2. Matriks Guardrails & Kepatuhan Kuota Free-Tier

| Penyedia & Layanan | Batasan Keras (*Hard Limit*) | Risiko pada Solulu | Solusi Teknis & Mitigasi Arsitektur |
| :--- | :--- | :--- | :--- |
| **Vercel Hobby** | Serverless Execution Timeout: **10 detik** | Webhook Xendit timeout saat mengeksekusi Zoom API + Resend Email secara berantai. | **Decoupled Asynchronous Worker:** Webhook `/api/webhooks/xendit` memvalidasi token, menandai DB, dan mengembalikan `HTTP 200` dalam $< 1$ detik. Pembuatan Zoom dan pengiriman email didelegasikan ke Upstash QStash yang memicu worker `/api/jobs/fulfill-booking`. |
| **Vercel Hobby** | Request Payload Body: **4.5 MB** | Gagal unggah dokumen ijazah/STR konselor atau foto galeri. | **Direct-to-Storage Upload** via Presigned PUT URL Cloudflare R2 (Bypass Vercel sepenuhnya). |
| **Vercel Hobby** | Image Optimization: **1.000 foto/bulan** | Kuota optimasi langsung habis akibat galeri publik diakses banyak orang. | Seluruh tag `<Image />` Next.js untuk media R2 **WAJIB** memakai atribut `unoptimized={true}`. |
| **Vercel Hobby** | Cron Job: **Hanya 1x / hari** | Slot tertahan (*reserved*) tidak bisa dibersihkan tepat waktu (15 menit). | Cron dijalankan oleh **Upstash QStash Scheduler** setiap 2 menit menembak endpoint `/api/cron/cleanup-slots`. |
| **Supabase Free** | Max Direct Connection: **~60 pool** | Error `too many clients already` akibat serverless Next.js membuka koneksi baru. | Drizzle ORM **WAJIB** menggunakan connection string **Supavisor Transaction Pooler (Port 6543)** dengan flag `pgbouncer=true`. |
| **Supabase Free** | Inaktivitas 7 Hari (*Project Sleep*) | Database tertidur jika dalam 7 hari tidak ada sesi. | Cron QStash setiap 2 menit otomatis menjaga database tetap aktif (*keep-alive*). |
| **Cloudflare R2** | Public Exposure Risk | Dokumen identitas konselor dan rekam medis pasien rawan bocor. | **Dual-Bucket:** Bucket Publik untuk Galeri/Avatar; Bucket Privat untuk KTP/STR/Rekam Medis (akses via Presigned GET 15 menit). |

---

## 3. Arsitektur Data Storage (Cloudflare R2 Dual-Bucket)

Sistem menggunakan **dua bucket R2 terpisah secara fisik** untuk menegakkan batas privasi:

1. **Bucket `solulu-public`**:
   - **Akses:** Terbuka publik via Custom Domain CDN Cloudflare (contoh: `cdn.solulu.id`).
   - **Isi Berkas:** Foto profil konselor terverifikasi (`/avatars/*`), gambar galeri dokumentasi kegiatan (`/gallery/*`).
   - **Delivery:** Di-load langsung oleh browser klien dengan caching Edge CDN.
2. **Bucket `solulu-private`**:
   - **Akses:** Akses publik **DINONAKTIFKAN (Private)**. Akses hanya melalui S3 SDK Server Action.
   - **Isi Berkas:** Berkas pendaftaran mitra (KTP, Ijazah, STR) di `/applications/*`, lampiran rekam medis sesi di `/clinical-notes/*`.
   - **Delivery:** Hanya dapat diunduh/dilihat oleh Admin atau Konselor berwenang menggunakan **Presigned GET URL** dengan masa kedaluwarsa maksimal **15 menit**.

---

## 4. Alur Kerja & Logika Bisnis Utama (System Event Flows)

### A. Alur Pemesanan & Pencegahan Race Condition (*Slot Holding*)
```mermaid
sequenceDiagram
    participant P as Pasien (Guest)
    participant UI as Next.js Web
    participant DB as Supabase (Postgres)
    participant X as Xendit Gateway

    P->>UI: Pilih Konselor & Slot Waktu
    P->>UI: Isi Skrining SRQ-20, Nama, Email (2x), No WA
    UI->>DB: Atomic Transaction: Cek status slot & Kuota 2 Zoom
    alt Slot Tersedia & Kuota Zoom < 2
        DB->>DB: UPDATE schedules SET status='reserved', reserved_until=NOW()+15m
        UI->>X: Create Invoice (Expired 15m)
        X-->>UI: Return Checkout URL
        UI-->>P: Redirect ke Pembayaran Xendit
    else Slot Sudah Terisi atau Kuota 2 Zoom Penuh
        DB-->>UI: Rollback & Error
        UI-->>P: Tampilkan "Slot baru saja diambil, silakan pilih jam lain"
    end
```

### B. Aturan Penjadwalan & Batas 2 Akun Zoom (*Concurrency Guard*)
1. **Kebebasan Mitra:** Konselor dan psikolog bebas membuat slot jadwal kapan pun.
2. **Aturan Penampilan Publik:** Sebuah slot hanya ditampilkan sebagai *Tersedia* di katalog publik jika:
   - Status slot adalah `available`.
   - Total sesi aktif (`reserved` atau `confirmed`) di seluruh platform pada jam tersebut **kurang dari 2 (< 2)**.
   - Jika sudah ada 2 sesi berjalan di jam yang sama (meskipun konselor lain masih membuka slot), seluruh slot lain pada jam tersebut **otomatis disembunyikan/dinonaktifkan**.
3. **Pembersihan Slot Berkala (*Slot Expiry Cleanup*):**
   - Upstash QStash memanggil `/api/cron/cleanup-slots` setiap 2 menit dengan validasi `Authorization: Bearer CRON_SECRET`.
   - Menjalankan transaksi pembersihan atomic pada 3 entitas (jadwal, booking, dan transaksi):
     ```sql
     -- 1. Kembalikan status jadwal menjadi available
     UPDATE schedules 
     SET status = 'available', reserved_until = NULL 
     WHERE status = 'reserved' AND reserved_until < NOW();

     -- 2. Batalkan booking yang melewati batas hold 15 menit
     UPDATE bookings
     SET status = 'cancelled'
     WHERE status = 'pending_payment' 
       AND schedule_id IN (
         SELECT id FROM schedules WHERE status = 'available' AND reserved_until IS NULL
       )
       AND created_at < NOW() - INTERVAL '15 minutes';

     -- 3. Tandai invoice transaksi yang tertahan menjadi EXPIRED
     UPDATE transactions
     SET status = 'EXPIRED'
     WHERE status = 'PENDING'
       AND booking_id IN (
         SELECT id FROM bookings WHERE status = 'cancelled'
       );
     ```

### C. Alur Webhook Xendit & Worker Asinkron Pemenuhan Sesi (*Decoupled Fulfillment*)
Untuk menghindari batasan *Serverless Execution Timeout* 10 detik Vercel Hobby, proses dibagi menjadi dua tahapan independen yang andal:

#### Tahap 1: Webhook Ingestion (`/api/webhooks/xendit`) — Eksekusi Cepat (< 1 Detik)
1. Klien menyelesaikan pembayaran di Xendit.
2. Xendit mengirim HTTP POST webhook ke `/api/webhooks/xendit`.
3. Handler webhook memvalidasi header `x-callback-token`.
4. **Idempotency Guard:** Cek status `transactions` dengan `xendit_invoice_id`. Jika status sudah `PAID`, segera kembalikan `HTTP 200 { received: true }` tanpa memicu ulang pemenuhan untuk mencegah duplikasi sesi akibat retry webhook.
5. Jika status transaksi masih `PENDING` (berhasil dibayar):
   - Ubah `transactions.status = 'PAID'` dan catat `paid_at = NOW()`.
   - Ubah `schedules.status = 'booked'`.
   - Ubah `bookings.status = 'confirmed'`.
   - Dispatch pesan asinkron ke **Upstash QStash** menuju worker `/api/jobs/fulfill-booking` dengan payload `{ bookingId: booking.id }`.
   - Segera kembalikan respons `HTTP 200 { received: true, queued: true }` ke Xendit.

#### Tahap 2: Fulfillment Worker (`/api/jobs/fulfill-booking`) — Background Execution
1. Endpoint dipanggil oleh Upstash QStash dengan verifikasi header `Upstash-Signature`.
2. Ambil data booking, konselor, dan waktu jadwal terkait.
3. **Dynamic Host Allocation:** Cari akun Zoom (Akun 1 atau Akun 2) yang tidak memiliki sesi `confirmed` pada jam tersebut.
4. **Zoom Meeting Creation:** Mengambil token OAuth (dengan mekanisme cache, lihat Seksi 5A) dan membuat room meeting baru via Zoom Server-to-Server OAuth API.
5. Simpan `zoom_meeting_id`, `zoom_join_url` (untuk pasien), `zoom_start_url` (untuk konselor), dan kaitkan `zoom_account_id` pada tabel `bookings`.
6. **Email Dispatcher via Resend API:** Kirim email resmi ke pasien berisi konfirmasi pembayaran dan tautan sesi unik `/session/[token]`.
7. Di halaman web sukses checkout, pasien langsung disajikan tombol utama: **"Buka Halaman Sesi Saya Sekarang"** menuju `/session/[token]`.

---

## 5. Modul Khusus & Kebijakan Keamanan

### A. Pengelolaan Kredensial Zoom dalam Aplikasi & *Safety Lock*
* **Penyimpanan:** Kredensial kedua akun Zoom disimpan pada tabel database `zoom_accounts` (bukan di `.env`).
* **Enkripsi Kredensial:** Kolom `client_secret` dienkripsi secara simetris (AES-256-GCM) menggunakan *master key* `APP_ENCRYPTION_KEY` sebelum disimpan ke database.
* **Mekanisme Kunci Pengaman (*Safety Lock*):**
  - Admin **TIDAK DAPAT** menyunting kredensial, menghapus, atau menonaktifkan akun Zoom jika akun tersebut masih memiliki jadwal sesi mendatang yang berstatus `confirmed` atau `reserved`:
    ```sql
    SELECT COUNT(*) FROM bookings b 
    JOIN schedules s ON b.schedule_id = s.id 
    WHERE b.zoom_account_id = :accountId 
      AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.end_time >= CURRENT_TIME))
      AND b.status IN ('confirmed', 'pending_payment');
    ```
  - Jika `COUNT > 0`, tombol Edit/Hapus dikunci dan memunculkan notifikasi: *"Akun Zoom ini sedang digunakan untuk [N] sesi mendatang. Modifikasi hanya diizinkan jika seluruh sesi selesai."*
* **OAuth Token Caching & Rate-Limit Mitigation:**
  - Token Zoom S2S OAuth memiliki masa aktif 3.600 detik (1 jam).
  - Untuk mencegah *rate-limiting* Zoom API (HTTP 429) akibat permintaan token di setiap transaksi, sistem meng-cache access token di tabel `zoom_accounts` (`cached_access_token` dan `token_expires_at`) dengan toleransi waktu kadaluarsa 3.500 detik. Permintaan token baru hanya dilakukan jika `NOW() >= token_expires_at`.

### B. Skrining SRQ-20 & *Emergency Clinical Waiver Modal*
* Pasien menjawab 20 pertanyaan standar SRQ-20 sebelum memilih jadwal.
* **Kondisi Berisiko Tinggi:**
  - Skor $\ge 8$, ATAU
  - Pertanyaan No. 17 bernilai `Ya` (Pikiran mengakhiri hidup / `has_suicidal_thoughts = true`).
* **Intervensi Klinis:**
  1. Rekomendasi otomatis diarahkan ke **Psikolog Klinis**.
  2. Jika pasien tetap memilih **Konselor Sebaya (Peer Counselor)**, sistem **WAJIB** menampilkan **Emergency Clinical Waiver Modal**:
     - *Banner Darurat:* Menampilkan nomor darurat krisis nasional: **Hotline Kemenkes 119 Ext 8** dan layanan konseling krisis SEJIWA.
     - *Persetujuan Mandiri:* Checkbox wajib: *"Saya memahami bahwa konselor sebaya bukan pengganti pertolongan klinis/medis darurat, dan saya memilih untuk tetap melanjutkan atas keputusan pribadi saya."*
     - *Audit Logging:* Kolom `bypassed_recommendation = true` dan `waiver_accepted_at = NOW()` dicatat dalam database.

### C. Alur Rekrutmen Konselor & Aktivasi Akun
1. Calon konselor mengisi formulir di `/apply`.
2. Unggah CV, KTP, dan Ijazah/STR langsung ke bucket `solulu-private` via Presigned PUT URL.
3. Calon konselor mencentang klausul legal persetujuan kerja sama (tercatat di `agreed_to_terms_at`).
4. Admin meninjau berkas di `/admin/counselors/applications`.
5. Saat Admin menekan **"Approve"**:
   - Sistem memanggil Supabase Admin API (`auth.admin.inviteUserByEmail`).
   - Sistem membuat rekaman di tabel `counselors` terhubung ke User UID baru.
   - Calon mitra menerima email resmi untuk mengatur password dan langsung dapat mengakses `/counselor/dashboard`.

### D. Galeri Dokumentasi Sesi (*Social Proof Privacy-First*)
1. Admin mengunggah dokumentasi sesi di `/admin/gallery`.
2. Gambar diunggah langsung ke bucket `solulu-public` via Presigned PUT URL.
3. Tombol Submit dikunci (*disabled*) hingga Admin mencentang:
   - *"Saya menyatakan bahwa wajah/identitas klien pada gambar ini telah disensor dan klien telah memberikan izin untuk ditampilkan di publik."*
4. Disimpan di tabel `public_documentations` dengan `is_censored_and_consented = true` dan `uploaded_by = admin_uid`.
5. Ditampilkan di Landing Page menggunakan komponen `<Image unoptimized={true} />` disertai teks disclaimer resmi.

### E. Pemulihan Tautan Sesi Pasien (*Guest Session Recovery* - `/cek-sesi`)
1. **Latar Belakang UX:** Karena pasien bertransaksi tanpa akun (*guest*), terdapat risiko pasien kehilangan tautan unik `/session/[token]` akibat tab browser tertutup, email tertahan di filter spam, atau nomor WhatsApp salah dicatat.
2. **Alur Kerja Pemulihan:**
   - Pasien mengunjungi halaman publik `/cek-sesi`.
   - Pasien memasukkan kombinasi **Email** dan **Nomor WhatsApp** yang digunakan saat checkout.
   - Sistem memvalidasi dan mencari sesi aktif mendatang (`status IN ('confirmed', 'pending_payment')`).
   - Jika cocok:
     - Tautan sesi `/session/[token]` dikirim ulang secara instan via Resend Email.
     - Antarmuka web menampilkan tombol akses langsung ke `/session/[token]` untuk memulihkan sesi seketika.
3. **Proteksi Anti-Abuse:** Form `/cek-sesi` dibatasi (*rate-limited*) maksimal 3 kali pencarian per 15 menit per alamat IP menggunakan rate-limiter sederhana untuk mencegah pencarian acak (*enumeration attack*).

---

## 6. Skema Database Lengkap (Drizzle ORM TypeScript)

File: `src/db/schema.ts`

```typescript
import { 
  pgTable, uuid, text, timestamp, boolean, time, date, 
  integer, numeric, jsonb, pgEnum, index 
} from "drizzle-orm/pg-core";

// --- ENUMS ---
export const roleEnum = pgEnum("role_enum", ["admin", "counselor"]);
export const counselorTypeEnum = pgEnum("counselor_type_enum", ["peer", "psychologist"]);
export const scheduleStatusEnum = pgEnum("schedule_status_enum", ["available", "reserved", "booked"]);
export const bookingStatusEnum = pgEnum("booking_status_enum", ["pending_payment", "confirmed", "completed", "cancelled"]);
export const transactionStatusEnum = pgEnum("transaction_status_enum", ["PENDING", "PAID", "EXPIRED", "FAILED"]);
export const applicationStatusEnum = pgEnum("application_status_enum", ["pending", "approved", "rejected"]);

// --- 1. ZOOM ACCOUNTS (MANAGED IN-APP WITH SAFETY LOCK) ---
export const zoomAccounts = pgTable("zoom_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g. "Akun Zoom Pro 1"
  email: text("email").notNull().unique(),
  accountId: text("account_id").notNull(),
  clientId: text("client_id").notNull(),
  clientSecretEncrypted: text("client_secret_encrypted").notNull(), // AES-256 encrypted
  cachedAccessToken: text("cached_access_token"), // Cache token S2S OAuth (TTL 3500s)
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }), // Timestamp kedaluwarsa token
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- 2. PRICING & VOUCHERS ---
export const platformPricing = pgTable("platform_pricing", {
  id: uuid("id").defaultRandom().primaryKey(),
  counselorType: counselorTypeEnum("counselor_type").notNull().unique(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  promoPrice: numeric("promo_price", { precision: 12, scale: 2 }), // Harga coret jika aktif
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'fixed' atau 'percentage'
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
  quota: integer("quota").notNull(),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
});

// --- 3. CLINICAL SCREENING (SRQ-20) ---
export const screenings = pgTable("screenings", {
  id: uuid("id").defaultRandom().primaryKey(),
  answers: jsonb("answers").notNull(), // Array 20 jawaban boolean
  totalScore: integer("total_score").notNull(),
  hasSuicidalThoughts: boolean("has_suicidal_thoughts").notNull(), // Pertanyaan 17
  recommendedType: counselorTypeEnum("recommended_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- 4. COUNSELOR APPLICATION & VERIFIED COUNSELORS ---
export const counselorApplications = pgTable("counselor_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  counselorType: counselorTypeEnum("counselor_type").notNull(),
  bio: text("bio").notNull(),
  
  // Private Cloudflare R2 Keys (Bucket: solulu-private)
  cvR2Key: text("cv_r2_key").notNull(),
  strR2Key: text("str_r2_key"), // Wajib jika Psikolog
  
  status: applicationStatusEnum("status").default("pending"),
  agreedToTermsAt: timestamp("agreed_to_terms_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const counselors = pgTable("counselors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(), // Terhubung ke Supabase Auth
  fullName: text("full_name").notNull(),
  title: text("title").notNull(), // e.g., "S.Psi", "M.Psi., Psikolog"
  counselorType: counselorTypeEnum("counselor_type").notNull(),
  bio: text("bio").notNull(),
  specializations: text("specializations").array(),
  avatarR2Url: text("avatar_r2_url"), // Bucket: solulu-public
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- 5. SCHEDULES (SLOT MANAGEMENT) ---
export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  counselorId: uuid("counselor_id").references(() => counselors.id).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: scheduleStatusEnum("status").default("available"),
  reservedUntil: timestamp("reserved_until", { withTimezone: true }), // Masa berlaku hold 15 menit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxScheduleLookup: index("idx_schedule_lookup").on(table.date, table.startTime, table.status),
}));

// --- 6. BOOKINGS (GUEST SESSIONS) ---
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  accessToken: text("access_token").notNull().unique(), // Nanoid(32) untuk URL /session/[token]
  
  // Identitas Pasien (Guest Checkout)
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  initialNotes: text("initial_notes"),
  
  scheduleId: uuid("schedule_id").references(() => schedules.id).notNull(),
  counselorId: uuid("counselor_id").references(() => counselors.id).notNull(),
  screeningId: uuid("screening_id").references(() => screenings.id).notNull(),
  
  // Triage Bypass Audit
  bypassedRecommendation: boolean("bypassed_recommendation").default(false),
  waiverAcceptedAt: timestamp("waiver_accepted_at", { withTimezone: true }),
  
  // Zoom Meeting Info
  zoomAccountId: uuid("zoom_account_id").references(() => zoomAccounts.id),
  zoomMeetingId: text("zoom_meeting_id"),
  zoomJoinUrl: text("zoom_join_url"),   // Diberikan ke Pasien
  zoomStartUrl: text("zoom_start_url"), // Diberikan ke Konselor
  
  status: bookingStatusEnum("status").default("pending_payment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- 7. TRANSACTIONS (XENDIT INTEGRATION) ---
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  xenditInvoiceId: text("xendit_invoice_id").notNull().unique(),
  xenditPaymentUrl: text("xendit_payment_url").notNull(),
  paymentMethod: text("payment_method"),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("PENDING"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- 8. CLINICAL SESSION REPORTS ---
export const sessionReports = pgTable("session_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull().unique(),
  counselorId: uuid("counselor_id").references(() => counselors.id).notNull(),
  summary: text("summary").notNull(),
  actionPlan: text("action_plan").notNull(),
  followUpRecommendation: text("follow_up_recommendation"),
  attachmentR2Keys: text("attachment_r2_keys").array(), // Bucket: solulu-private
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- 9. PUBLIC DOCUMENTATIONS (GALERI PRIVACY-FIRST) ---
export const publicDocumentations = pgTable("public_documentations", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageUrl: text("image_url").notNull(), // Bucket: solulu-public
  caption: text("caption").notNull(),
  isCensoredAndConsented: boolean("is_censored_and_consented").notNull(), // Legal audit trail
  isPublished: boolean("is_published").default(true),
  uploadedBy: uuid("uploaded_by").notNull(), // Admin User ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

---

## 7. Kontrak Server Actions & Validasi Zod

### A. Zoom Account Management (Admin Only)
* **`saveZoomAccountAction(payload)`**:
  - Validasi: `name`, `email`, `accountId`, `clientId`, `clientSecret`.
  - Logika: Enkripsi `clientSecret` menggunakan AES-256 sebelum `INSERT` atau `UPDATE`.
* **`deleteOrUpdateZoomAccountAction(id, updates)`**:
  - **Safety Lock Check:** Lakukan `SELECT COUNT(*)` dari `bookings` yang terhubung ke `id` ini dengan jadwal sesi mendatang yang belum selesai (`status IN ('confirmed', 'pending_payment')`).
  - Jika `COUNT > 0`, lempar Zod Exception: *"Akun Zoom ini terkunci karena terikat pada sesi aktif mendatang."*

### B. Booking & Hold Engine (Public Guest)
* **`holdScheduleSlotAction(payload)`**:
  - Validasi Zod:
    - `scheduleId`: uuid
    - `patientName`: string min 3
    - `patientEmail`: email valid
    - `confirmEmail`: email valid (Refine: `patientEmail === confirmEmail`)
    - `patientPhone`: format valid WhatsApp Indonesia (`/^(\+62|62|0)8[1-9][0-9]{6,10}$/`)
    - `screeningId`: uuid
    - `voucherCode`: opsional
    - `waiverAccepted`: boolean (Wajib `true` jika SRQ-20 terdeteksi risiko tinggi dan memilih konselor sebaya)
  - Logika Transaksional (Atomic DB Transaction):
    1. Cek status slot: `WHERE id = scheduleId AND status = 'available'`.
    2. Cek Concurrency Guard: Hitung jumlah total booking aktif di jam tersebut di seluruh platform. Jika $\ge 2$, tolak.
    3. `UPDATE schedules SET status = 'reserved', reserved_until = NOW() + INTERVAL '15 minutes'`.
    4. Buat record `bookings` dengan token `nanoid(32)` dan status `pending_payment`.
    5. Hitung total bayar (terapkan diskon voucher jika ada).
    6. Request Xendit Create Invoice (set expiry 15 menit).
    7. Simpan record `transactions` dan kembalikan `{ paymentUrl, accessToken }`.

### C. Cloudflare R2 Upload Flow
* **`getPrivateUploadPresignedUrlAction(filename, fileType, purpose)`**:
  - Proteksi: Admin / Calon Mitra / Konselor.
  - Bucket: `solulu-private`.
  - Kegunaan: CV/STR pelamar atau lampiran rekam medis.
* **`getPublicGalleryPresignedUrlAction(filename, fileType)`**:
  - Proteksi: Admin Session JWT.
  - Bucket: `solulu-public`.
* **`submitPublicGalleryAction(payload)`**:
  - Proteksi: Admin Session JWT.
  - Validasi Zod: `imageUrl` (valid R2 CDN URL), `caption` (string), `isCensoredAndConsented: z.literal(true)`.

### D. Manajemen Jadwal Konselor (Counselor Only)
* **`createCounselorScheduleSlotsAction(payload)`**:
  - Proteksi: Mitra Konselor terautentikasi (Auth UID terdaftar di tabel `counselors`).
  - Validasi Zod:
    - `date`: string format `YYYY-MM-DD` (tidak boleh tanggal masa lalu).
    - `slots`: array minimal 1 elemen dari `{ startTime: "HH:mm", endTime: "HH:mm" }`.
  - Logika: Bulk insert ke tabel `schedules` dengan status `available`. Menolak penambahan slot bentrok pada rentang jam yang sama untuk konselor bersangkutan.
* **`toggleScheduleSlotAction(slotId, targetStatus)`**:
  - Proteksi: Konselor pemilik slot bersangkutan atau Admin.
  - Validasi: `slotId: uuid`, `targetStatus: 'available' | 'cancelled'`.
  - Logika: Hanya dapat mengubah slot yang berstatus `available`. Jika slot sedang dalam status `reserved` atau `booked`, tolak dengan notifikasi bahwa slot sedang dalam proses transaksi/terjadwal.

### E. Rekam Medis Sesi Klinis (Counselor Only)
* **`submitSessionReportAction(payload)`**:
  - Proteksi: Konselor penanggung jawab sesi (RLS Auth UID diverifikasi terhadap `bookings.counselor_id`).
  - Validasi Zod:
    - `bookingId`: uuid
    - `summary`: string minimal 20 karakter
    - `actionPlan`: string minimal 20 karakter
    - `followUpRecommendation`: string opsional
    - `attachmentR2Keys`: array string nama key privat opsional
  - Logika: Simpan ke tabel `session_reports`, perbarui status `bookings.status = 'completed'`.

### F. Verifikasi & Aktivasi Mitra Konselor (Admin Only)
* **`reviewCounselorApplicationAction(payload)`**:
  - Proteksi: Admin Session JWT (`app_metadata.role = 'admin'`).
  - Validasi Zod:
    - `applicationId`: uuid
    - `status`: `'approved' | 'rejected'`
    - `rejectionReason`: string opsional (jika ditolak)
  - Logika jika `approved`:
    1. Panggil Supabase Admin API `auth.admin.inviteUserByEmail(application.email)` untuk mengirimkan email aktivasi dan set password.
    2. Buat entri baru pada tabel `counselors` yang menautkan `userId` Supabase Auth baru dengan data aplikasi mitra.
    3. Ubah `counselor_applications.status = 'approved'`.

### G. Pengaturan Tarif Flat & Kupon Voucher (Admin Only)
* **`updatePlatformPricingAction(payload)`**:
  - Proteksi: Admin Session JWT.
  - Validasi Zod: `counselorType: 'peer' | 'psychologist'`, `basePrice: number min 0`, `promoPrice: number min 0 opsional`.
  - Logika: Upsert record pada tabel `platform_pricing`.
* **`createOrUpdateVoucherAction(payload)`**:
  - Proteksi: Admin Session JWT.
  - Validasi Zod: `code: string uppercase min 3`, `discountType: 'fixed' | 'percentage'`, `discountValue: number min 1`, `quota: number min 1`, `expiresAt: string ISO opsional`, `isActive: boolean`.
  - Logika: Insert/Update ke tabel `vouchers`.

### H. Pemulihan Tautan Sesi Pasien (Public Guest Recovery)
* **`recoverSessionLinkAction(payload)`**:
  - Proteksi: Terbuka umum (Publik) dengan Rate Limiting (maks 3 req / 15 menit per IP).
  - Validasi Zod: `patientEmail: email valid`, `patientPhone: string format telepon Indonesia`.
  - Logika:
    1. Cari entri di tabel `bookings` dengan kecocokan `patientEmail` dan `patientPhone` serta jadwal sesi mendatang (`date >= CURRENT_DATE`).
    2. Jika ditemukan, sistem memicu pengiriman email pemulihan via Resend API berisi daftar tautan `/session/[token]`.
    3. Mengembalikan respons aman tanpa membocorkan eksistensi data jika tidak ditemukan: `{ success: true, message: "Jika data Anda terdaftar, tautan sesi telah dikirimkan ke email Anda." }`.

---

## 8. Struktur Direktori Proyek (Next.js 15 App Router)

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Landing Page (Profil Konselor & PublicGalleryGrid)
│   │   ├── counselors/                  # Direktori lengkap konselor & filter
│   │   ├── screening/                   # Kuis Mandiri SRQ-20
│   │   ├── book/[counselorId]/          # Kalender booking & slot holding
│   │   ├── session/[token]/             # Ruang Sesi Pasien (Hitung mundur, Zoom Link, WA Help)
│   │   ├── cek-sesi/                    # Pemulihan tautan sesi via Email / WhatsApp
│   │   └── apply/                       # Formulir pendaftaran mitra konselor
│   ├── (auth)/
│   │   ├── login/                       # Login Konselor & Admin (Supabase Auth)
│   │   └── reset-password/
│   ├── (protected)/
│   │   ├── admin/
│   │   │   ├── dashboard/               # Metrik & ringkasan transaksi
│   │   │   ├── counselors/              # Manajemen konselor & verifikasi pelamar
│   │   │   ├── pricing/                 # Pengaturan tarif flat & kode voucher
│   │   │   ├── zoom-settings/           # Konfigurasi & Safety Lock 2 Akun Zoom
│   │   │   └── gallery/                 # Upload & kurasi foto dokumentasi
│   │   └── counselor/
│   │       ├── dashboard/               # Kalender sesi terkonfirmasi & One-Click Start Zoom
│   │       ├── schedules/               # Manajemen buka/tutup slot waktu mandiri
│   │       └── reports/[bookingId]/     # Pengisian rekam medis sesi & upload dokumen
│   └── api/
│       ├── webhooks/
│       │   └── xendit/route.ts          # Webhook penerimaan pembayaran (< 1s execution, trigger QStash)
│       ├── jobs/
│       │   └── fulfill-booking/route.ts # Worker asinkron QStash (Zoom Meeting + Resend Email)
│       └── cron/
│           └── cleanup-slots/route.ts   # Pembersihan 15-menit expired hold (Upstash trigger)
├── components/
│   ├── shared/
│   │   ├── PublicGalleryGrid.tsx        # Grid dokumentasi (unoptimized={true} + Privacy Disclaimer)
│   │   └── EmergencyWaiverModal.tsx     # Modal mitigasi bunuh diri & Hotline 119 Ext 8
│   └── ui/                              # shadcn/ui components
├── db/
│   ├── index.ts                         # Drizzle client instance (Supavisor port 6543)
│   └── schema.ts                        # Drizzle ORM Schema komprehensif
├── lib/
│   ├── encryption.ts                    # AES-256 encrypt/decrypt untuk kredensial Zoom
│   ├── r2.ts                            # AWS S3 SDK Client untuk Cloudflare R2
│   ├── xendit.ts                        # Xendit Invoice SDK Client
│   ├── zoom.ts                          # Zoom Server-to-Server OAuth Meeting Dispatcher + Cache
│   └── resend.ts                        # Pengiriman email notifikasi otomatis
```

---

## 9. Panduan Eksekusi AI Coding Assistant (Prompt Execution Sequence)

*Gunakan urutan prompt berikut secara bertahap agar AI membangun aplikasi dengan presisi tanpa halusinasi:*

* **PROMPT 1: Environment & Core Database Schema Setup**
  > "Berdasarkan PRD Seksi 6, siapkan file `src/db/schema.ts` menggunakan Drizzle ORM dan PostgreSQL Supabase. Buat seluruh tabel lengkap: zoomAccounts, platformPricing, vouchers, screenings, counselorApplications, counselors, schedules, bookings, transactions, sessionReports, dan publicDocumentations. Pastikan koneksi DB di `src/db/index.ts` dikonfigurasi untuk Supavisor Transaction Pooler (port 6543)."

* **PROMPT 2: Zoom Credential Management with Safety Lock**
  > "Implementasikan modul pengaturan Zoom di `/admin/zoom-settings`. Buat server action untuk enkripsi/dekripsi AES-256 `clientSecret`. Terapkan aturan penguncian (*safety lock*): tolak perubahan atau penghapusan akun Zoom jika akun bersangkutan masih memiliki jadwal sesi mendatang dengan status confirmed atau pending_payment."

* **PROMPT 3: SRQ-20 Screening & Emergency Clinical Waiver Modal**
  > "Bangun alur kuesioner SRQ-20 di `/screening`. Hitung skor dan deteksi pertanyaan nomor 17 (`hasSuicidalThoughts`). Jika berisiko tinggi dan pasien memilih peer counselor, wajib tampilkan `EmergencyWaiverModal.tsx` berisi Hotline Kemenkes 119 Ext 8 dan checkbox persetujuan mandiri sebelum lanjut ke pemilihan jadwal."

* **PROMPT 4: Atomic Slot Holding & Guest Checkout Form**
  > "Bangun halaman pemilihan slot dan checkout di `/book/[counselorId]`. Form wajib memiliki input Email dan Konfirmasi Email yang divalidasi identik via Zod. Buat Server Action `holdScheduleSlotAction` dengan transaksi database atomic: cek status available, cek total booking aktif di platform pada jam tersebut (< 2), update status slot menjadi 'reserved' selama 15 menit, dan terbitkan invoice Xendit."

* **PROMPT 5: Xendit Webhook Ingestion & Asynchronous QStash Fulfillment Worker**
  > "Berdasarkan PRD Seksi 4C, buat 2 file endpoint: (1) `src/app/api/webhooks/xendit/route.ts`: validasi callback token Xendit, cek idempotency, ubah status transaksi menjadi PAID, kirim pesan antrean ke Upstash QStash, dan return HTTP 200 dalam < 1 detik. (2) `src/app/api/jobs/fulfill-booking/route.ts`: worker yang dipanggil QStash untuk alokasi host Zoom dinamis, pembuatan meeting room dengan Zoom API (lengkap dengan caching token S2S OAuth), simpan join/start URL, dan kirimkan email link /session/[token] ke pasien via Resend API."

* **PROMPT 6: Upstash QStash Cron Cleanup (Atomic Database Recovery)**
  > "Buat endpoint `src/app/api/cron/cleanup-slots/route.ts` yang dilindungi bearer token `CRON_SECRET`. Jalankan transaksi kueri database atomic untuk: (1) mengembalikan slot 'reserved' yang lewat 15 menit menjadi 'available', (2) mengubah status booking yang tertahan menjadi 'cancelled', dan (3) menandai transaksi yang belum dibayar menjadi 'EXPIRED'."

* **PROMPT 7: Cloudflare R2 Dual-Bucket Integration**
  > "Implementasikan S3 client di `src/lib/r2.ts` untuk Cloudflare R2. Bedakan logic presigned URL untuk bucket publik `solulu-public` (avatar & galeri) dan bucket privat `solulu-private` (dokumen pelamar & catatan rekam medis). Pastikan link download berkas privat menggunakan presigned GET URL dengan kedaluwarsa 15 menit."

* **PROMPT 8: Public Gallery Grid & Privacy Compliance**
  > "Buat halaman `/admin/gallery` untuk upload dokumentasi sesi dengan validasi wajib `isCensoredAndConsented: z.literal(true)`. Tampilkan galeri di landing page via `PublicGalleryGrid.tsx` dengan prop `unoptimized={true}` pada Next.js `<Image />` dan cantumkan teks disclaimer privasi resmi."

---

## 10. Autentikasi, Otorisasi (RBAC), & Perlindungan Rute Middleware

### A. Skema Role Pengguna
Autentikasi menggunakan **Supabase Auth**. Peran (*role*) disimpan dalam `raw_app_meta_data` token JWT pengguna untuk mencegah manipulasi sisi klien:
* **`admin`**: Pengelola platform dengan hak akses penuh ke rute `/admin/*`. Memiliki `user.app_metadata.role = 'admin'`.
* **`counselor`**: Mitra konselor terverifikasi yang terdaftar di tabel `counselors` dan memiliki `user.app_metadata.role = 'counselor'`.
* **`guest`**: Pasien umum tanpa akun. Akses sesi murni divalidasi via `access_token` unik (32 karakter acak nanoid) pada URL `/session/[token]`.

### B. Spesifikasi `src/middleware.ts`
* Memeriksa session Supabase Auth melalui cookies server:
  * Akses ke `/admin/*`:
    - Jika belum login $\rightarrow$ Redirect ke `/login?redirect=/admin/dashboard`.
    - Jika login tetapi role $\ne$ `'admin'` $\rightarrow$ Redirect ke `/counselor/dashboard` atau `/unauthorized`.
  * Akses ke `/counselor/*`:
    - Jika belum login $\rightarrow$ Redirect ke `/login?redirect=/counselor/dashboard`.
    - Jika login tetapi role $\ne$ `'counselor'` $\rightarrow$ Redirect ke `/admin/dashboard` atau `/unauthorized`.
  * Akses ke `/session/[token]`:
    - Terbuka untuk umum (publik) tanpa login; validasi dilakukan di Server Component halaman tersebut terhadap keabsahan `access_token` di database.

---

## 11. Standarisasi Zona Waktu (WIB / UTC+7) & Aturan Sesi

### A. Standar Zona Waktu Platform
* Seluruh interaksi pengguna (kalender booking, jam konsultasi, countdown sesi) ditampilkan dan dioperasikan dalam **WIB (Waktu Indonesia Barat / UTC+7 / Asia/Jakarta)**.
* Di level database:
  - Kolom `date` dan `time` pada tabel `schedules` diasumsikan sebagai waktu lokal WIB.
  - Untuk perbandingan waktu di server Vercel (yang berjalan di UTC), wajib menggunakan fungsi utilitas waktu terpusat (contoh: `date-fns-tz` dengan zona waktu `Asia/Jakarta`).

### B. Format Durasi Sesi Konseling
* Durasi default setiap sesi konseling adalah **50 menit sesi aktif** dengan jeda **10 menit buffer/cooling down** sebelum slot jam berikutnya dimulai (misal: 19:00 - 19:50 WIB, jeda hingga 20:00 WIB).

---

## 12. Siklus Hidup Halaman Sesi Pasien (`/session/[token]`) & Penyelesaian

### A. Pengalaman Antarmuka (UX) Pasien di `/session/[token]`
1. **Verifikasi Token:** Server Component memverifikasi keabsahan token. Jika tidak ditemukan, tampilkan halaman 404/Invalid Session Link.
2. **Kondisi Sebelum Sesi (H - > 10 Menit):**
   - Menampilkan detail konselor, tanggal, jam, dan petunjuk persiapan sesi (headset, koneksi internet, tempat privat).
   - Menampilkan komponen **Live Countdown Timer** menuju jam sesi.
   - Tombol *"Masuk Ruang Zoom"* berada dalam kondisi **Disabled (Terkunci)** dengan keterangan: *"Tautan Zoom akan aktif 10 menit sebelum jadwal dimulai."*
3. **Kondisi Sesi Aktif (H - 10 Menit s/d Selesai):**
   - Tombol *"Masuk Ruang Zoom"* menjadi **Aktif (Berwarna Hijau Mencolok)** dan langsung membuka `zoom_join_url` di tab baru.
   - Tombol bantuan cepat: *"Kendala Teknis? Hubungi Tim Solulu via WhatsApp"* mengarah langsung ke nomor support.

### B. Alur Penyelesaian Sesi (*Session Completion*)
* **Manual Completion:** Konselor menekan tombol **"Tandai Selesai & Buat Catatan"** di Dashboard Konselor setelah sesi usai, yang sekaligus mengarahkan ke form `/counselor/reports/[bookingId]`.
* **Database State:** Mengubah `bookings.status = 'completed'` dan membuat baris baru di `session_reports`.
* **Auto-Archive (Fallback):** Jadwal sesi yang telah lewat $> 2$ jam dari `endTime` tanpa pembatalan otomatis diarsipkan statusnya sebagai `completed` melalui cron berkala.

### C. Alur Pemulihan Sesi Mandiri (*Session Recovery Fallback*)
* Jika pasien tidak sengaja menutup halaman `/session/[token]` dan belum menerima atau kehilangan email konfirmasi:
  1. Pasien mengakses halaman `/cek-sesi` yang selalu tersedia pada header/footer publik.
  2. Memasukkan kombinasi Email dan Nomor WhatsApp yang digunakan saat pemesanan.
  3. Sistem memverifikasi kecocokan data dan langsung menyajikan tombol akses sesi aktif serta mengirimkan ulang konfirmasi ke email via Resend API.
  4. Tersedia tombol bantuan langsung ke WhatsApp Admin Support jika pasien mengalami masalah salah ketik email (*typo*) saat checkout.

---

## 13. Kebijakan Pembatalan (Cancellation), Reschedule, & Refund

1. **Pembatalan oleh Pasien:**
   * Konsultasi yang telah dibayar bersifat **Non-Refundable (Tidak Dapat Diuangkan Kembali)**.
   * Pasien diperbolehkan meminta **Reschedule (Ganti Jadwal) maksimal H-12 jam** sebelum sesi dimulai dengan menghubungi Admin via WhatsApp resmi.
   * Admin memiliki panel khusus di `/admin/counselors` untuk memindahkan `schedule_id` ke slot baru tanpa membatalkan transaksi yang sudah lunas.
2. **Pembatalan Darurat oleh Mitra Konselor:**
   * Jika konselor berhalangan hadir mendadak karena kondisi darurat, Admin akan menawarkan 2 opsi kepada pasien:
     1. Pengalihan jadwal ke mitra lain yang setara di jam yang sama/berdekatan.
     2. Pengembalian dana penuh (*Full Refund*) yang diproses secara manual oleh Admin melalui dashboard Xendit.
   * Status booking diubah menjadi `'cancelled'` dan slot waktu dibuka kembali jika diperlukan.

---

## 14. Keamanan & Privasi Rekam Medis (*Clinical Notes Data Protection*)

1. **Akses Terbatas Konselor:**
   * Catatan sesi di `session_reports` hanya boleh dibaca dan ditulis oleh **konselor yang menangani sesi bersangkutan** dan Super Admin.
   * Menerapkan **Supabase Row Level Security (RLS)**:
     ```sql
     CREATE POLICY "Counselor can only view own session reports"
     ON session_reports FOR SELECT
     USING (auth.uid() IN (SELECT user_id FROM counselors WHERE id = session_reports.counselor_id));
     ```
2. **Kerahasiaan Dokumen Lampiran:**
   * Seluruh dokumen pendukung rekam medis diunggah ke bucket `solulu-private`.
   * Akses dokumen hanya dihasilkan melalui Presigned GET URL dengan masa berlaku maksimal **15 menit** dan hanya dapat di-request oleh konselor penanggung jawab.

---

## 15. Daftar Lengkap Variabel Lingkungan (`.env.example`)

Berikut adalah daftar variabel lingkungan yang wajib disiapkan sebelum memulai implementasi kode:

```env
# ==========================================
# 1. DATABASE (SUPABASE POSTGRESQL)
# ==========================================
# Connection string Supavisor Transaction Pooler (Port 6543) - Wajib flag pgbouncer=true
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection (Port 5432) untuk migrasi Drizzle
DATABASE_URL_DIRECT="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ==========================================
# 2. SUPABASE AUTH & CLIENT
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ==========================================
# 3. INTERNAL ENCRYPTION KEY
# ==========================================
# Kunci hex 32-byte (64 karakter hex) untuk enkripsi AES-256-GCM kredensial Zoom
APP_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# ==========================================
# 4. PAYMENT GATEWAY (XENDIT)
# ==========================================
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_CALLBACK_TOKEN="your_xendit_webhook_callback_token"

# ==========================================
# 5. STORAGE (CLOUDFLARE R2 S3-COMPATIBLE)
# ==========================================
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_PUBLIC_BUCKET_NAME="solulu-public"
R2_PRIVATE_BUCKET_NAME="solulu-private"
NEXT_PUBLIC_R2_PUBLIC_DOMAIN="https://cdn.solulu.id"

# ==========================================
# 6. SCHEDULER & CRON (UPSTASH QSTASH)
# ==========================================
QSTASH_URL="https://qstash.upstash.io/v2"
QSTASH_TOKEN="your_upstash_qstash_token"
CRON_SECRET="your_custom_secure_cron_secret_string"

# ==========================================
# 7. EMAIL SERVICE (RESEND)
# ==========================================
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Solulu Support <halo@solulu.id>"

# ==========================================
# 8. APP SETTINGS
# ==========================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_SUPPORT="6281234567890"
```