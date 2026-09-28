# Solulu.id — Zero-Cost Teleconsultation Platform

> **"Ruang Aman untuk Bercerita, Pulih, dan Bertumbuh"**  
> Platform telekonseling kesehatan mental hangat, terjangkau, dan bebas stigma dengan kepatuhan penuh terhadap **UU PDP No. 27/2022**.

---

## 🌿 Gambaran Umum (Overview)

**Solulu.id** adalah platform telekonseling yang dirancang untuk merobohkan batasan akses layanan kesehatan mental di Indonesia. Dibangun dengan filosofi desain **"The Grounding Sanctuary"** (Emerald & Obsidian Ink), platform ini menghadirkan pengalaman konsultasi psikologis yang empatik, privat, dan tanpa birokrasi berbelit.

Sistem ini mendukung pendampingan oleh **Psikolog Klinis ber-STR** (Rp 150.000/90 menit) dan **Konselor Sebaya tersertifikasi** (Rp 50.000/90 menit) dengan teknologi *Zero-Cost Dynamic Zoom Concurrency* dan *Guest Checkout* tanpa kewajiban pembuatan akun.

---

## ✨ Fitur Utama Arsitektur

### 1. 🛡️ Zero-Cost Dynamic Zoom Concurrency
- **S2S OAuth Integration**: Menghubungkan akun Zoom Server-to-Server secara dinamis tanpa biaya API per user.
- **Timeline Concurrency Guard**: Membatasi sesi bersamaan maksimal 2 sesi secara cerdas untuk mencegah tabrakan ruang meeting.
- **Safety Lock Engine**: Melindungi kredensial akun Zoom yang sedang melayani sesi aktif atau mendatang dari perubahan tidak sengaja.
- **AES-256-GCM Encryption**: Kredensial sensitif disimpan terenkripsi di database.

### 2. ⚡ Alur Pemesanan Tamu (Guest Booking)
- **Zero-Friction Checkout**: Pasien dapat memesan slot konsultasi tanpa perlu login atau registrasi akun.
- **Atomic 15-Minute Slot Hold**: Penahanan slot waktu secara atomik selama 15 menit saat proses pembayaran berlangsung.
- **Dual Payment Flow**:
  - **Gateway Otomatis**: Integrasi Xendit Invoice (QRIS, BCA, Mandiri, BRI, BNI).
  - **Transfer Manual**: Opsi pembayaran rekening manual dengan verifikasi bukti bayar oleh admin.
- **Mesin Voucher Fleksibel**: Diskon nominal atau persentase dengan pembatasan kuota dan masa berlaku.

### 3. 🧠 Skrining Mandiri SRQ-20 & Crisis Safeguard
- **Kuesioner 20 Pertanyaan**: Instrumen standar Self-Reporting Questionnaire (SRQ-20) Kemenkes/WHO.
- **Triage Otomatis**: Rekomendasi tipe konselor berdasarkan skor (ambang batas $\ge 6$).
- **Hotline Krisis Mental 24/7**: Banner interaktif bantuan darurat terhubung ke **Kemenkes 119 ext 8** dan **Lisa Hotline (0811-3855-472)**.

### 4. 🔒 Ruang Konseling Tamu Privat
- **Akses Berbasis Token Kriptografis**: Akses aman via tautan unik (`/session/[token]`).
- **Countdown Waktu Nyata**: Tautan Zoom hanya terbuka otomatis tepat **15 menit sebelum sesi dimulai (H-15)**.
- **Pemulihan Tautan Sesi (`/cek-sesi`)**: Pemulihan link konsultasi via nomor HP / email yang dilindungi oleh **IP-based Rate Limiter**.

### 5. 👥 Portal Konselor (`/counselor/*`)
- **Manajemen Jadwal**: Pembuatan dan aktivasi slot konsultasi 90 menit dengan buffer 15 menit.
- **Rekam Sesi Klinis**: Pencatatan riwayat konsultasi, asesmen psikologis, dan rencana tindak lanjut privat.
- **Pengaturan Profil**: Pengelolaan bio, spesialisasi, dan status keaktifan konselor.

### 6. ⚙️ Portal Administrator Operasional (`/admin/*`)
- **Verifikasi Pelamar Konselor**: Review berkas KTP, CV, ijazah, dan nomor STR resmi dengan pratinjau dokumen dari Cloudflare R2 privat.
- **Aturan Reschedule H-12**: Sistem otomatis mengunci permintaan perubahan jadwal jika kurang dari 12 jam sebelum sesi.
- **Konfirmasi Pembayaran Manual**: Verifikasi pembayaran transfer manual dan pemicu alokasi Zoom otomatis.
- **Kurasi Testimoni & Galeri**: Publikasi testimoni anonim dan foto kegiatan edukasi komunitas dengan validasi persetujuan klien (*consent*).

### 7. ⏱️ Automated Background Worker
- **QStash Job Worker**: Pengiriman notifikasi email dan alokasi ruang Zoom secara asinkron tanpa memblokir response HTTP.
- **Cron Cleanup Endpoint (`/api/cron/cleanup-slots`)**: Pembersihan berkala untuk slot hold yang kedaluwarsa, pengembalian kuota voucher, dan auto-archive sesi yang telah rampung.

### 8. 📄 Kepatuhan Hukum, SEO & Aksesibilitas
- **Kepatuhan UU PDP No. 27/2022**: Kebijakan privasi detail mengenai pemrosesan data medis dan retensi dokumen di `/privacy`.
- **Syarat & Ketentuan Konseling**: Regulasi hak & kewajiban di `/terms`.
- **Dynamic SEO Engine**: Auto-generated `sitemap.xml`, `robots.txt`, dan OpenGraph / Twitter Cards metadata.
- **Empathetic Error Pages**: Halaman 404 & 500 yang menenangkan dan menyediakan tombol pemulihan cepat.

---

## 🏗️ Tech Stack

| Kategori | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Webpack Bundler) |
| **UI Library** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/), Lucide Icons |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) ([Supabase](https://supabase.com/)), [Drizzle ORM](https://orm.drizzle.team/) |
| **Penyimpanan Berkas** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) (Private S3-Compatible Storage) |
| **Payment Gateway** | [Xendit](https://www.xendit.co/) |
| **Asynchronous Jobs** | [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted) |
| **Video Platform** | [Zoom Video Communications](https://marketplace.zoom.us/) (Server-to-Server OAuth) |
| **Testing** | [Vitest](https://vitest.dev/) (221 tests, 20 test files, 100% pass rate) |

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- **Node.js**: v20.x atau lebih baru
- **npm** atau **pnpm**
- Akun PostgreSQL / Supabase, Cloudflare R2, dan Xendit Sandbox

### 1. Kloning Repositori
```bash
git clone https://github.com/muhalfatih/solulu.id.git
cd solulu.id
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi lingkungan:
```bash
cp .env.example .env
```
Lengkapi variabel lingkungan utama:
```env
# Database
DATABASE_URL="postgres://..."

# App Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Zoom S2S OAuth (Default Fallback)
ZOOM_ACCOUNT_ID="..."
ZOOM_CLIENT_ID="..."
ZOOM_CLIENT_SECRET="..."

# Cloudflare R2 Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="solulu-private"

# Payment & Jobs
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_WEBHOOK_TOKEN="..."
CRON_SECRET="..."
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."

# Encryption
ENCRYPTION_SECRET_KEY="32-byte-hex-or-string..."
```

### 4. Migrasi Database
```bash
npx drizzle-kit push
```

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3001](http://localhost:3001) di browser Anda.

---

## 🧪 Pengujian & Pemeriksaan Kualitas

Proyek ini dilengkapi dengan cakupan pengujian komprehensif (Unit, Integration, & Concurrency):

```bash
# Menjalankan seluruh test suite Vitest
npm test

# Menjalankan typecheck TypeScript
npm run typecheck

# Menjalankan linter
npm run lint

# Membangun bundle produksi (Production Build)
npm run build
```

**Status Pengujian**:
- ✅ **20 Test Files Passed**
- ✅ **221 Tests Passed (100% Pass Rate)**
- ✅ **0 TypeScript Errors**

---

## 📂 Struktur Direktori Proyek

```text
solulu-web/
├── app/                        # Next.js App Router
│   ├── (auth)/login/          # Halaman autentikasi login konselor & admin
│   ├── admin/                 # Portal operasional admin & verifikasi konselor
│   ├── api/                   # Route handlers (webhooks xendit, cron cleanup, jobs)
│   ├── apply/                 # Formulir pendaftaran mitra konselor
│   ├── booking/               # Alur pemesanan tamu, checkout & status pembayaran
│   ├── cek-sesi/              # Pemulihan tautan sesi konsultasi
│   ├── counselor/             # Portal jadwal & rekam klinis konselor
│   ├── counselors/            # Katalog pencarian mitra konselor publik
│   ├── pricing/               # Halaman transparansi biaya layanan
│   ├── privacy/               # Kebijakan privasi (UU PDP No. 27/2022)
│   ├── terms/                 # Syarat & ketentuan layanan
│   ├── screening/             # Skrining mandiri kesehatan mental SRQ-20
│   ├── session/[token]/       # Ruang konsultasi tamu privat & countdown Zoom
│   ├── not-found.tsx          # Halaman 404 empatik
│   ├── error.tsx              # Error boundary 500
│   ├── sitemap.ts             # Dynamic SEO sitemap
│   └── robots.ts              # Dynamic robots.txt
├── components/                # Komponen UI Reusable (Shadcn/UI & Domain)
├── db/                        # Drizzle ORM schema & koneksi database
├── docs/                      # Dokumentasi teknis, ADR & Spesifikasi Solulu v1
│   ├── adr/                   # Architecture Decision Records
│   └── specs/                 # Spesifikasi fitur lengkap
├── lib/                       # Modul logika bisnis inti
│   ├── admin/                 # Reschedule locks & analitik admin
│   ├── booking/               # Checkout, atomic hold & voucher engine
│   ├── counselor/             # Autentikasi & tipe konselor
│   ├── cron/                  # Logika auto-archive & slot cleanup
│   ├── fulfillment/           # Webhook, alokasi Zoom & integrasi QStash
│   ├── schedules/             # Concurrency guard & interval waktu
│   ├── screening/             # Algoritma scoring & kuesioner SRQ-20
│   ├── session/               # Rate limiting & token recovery
│   ├── zoom/                  # Klien S2S Zoom, safety lock & cache token
│   ├── encryption.ts          # Utilitas kriptografi AES-256-GCM
│   ├── r2.ts                  # Integrasi AWS SDK Cloudflare R2
│   └── xendit.ts              # Integrasi API Xendit Invoicing
└── tests/                     # Unit & integration test suites (Vitest)
```

---

## 📜 Lisensi & Etika Layanan

Proyek ini dibangun untuk tujuan kebermanfaatan sosial dan akses kesehatan jiwa yang beretika:
- **Kerahasiaan Medis**: Rekaman sesi video/audio dinonaktifkan secara bawaan pada tingkat akun Zoom (`auto_recording: none`).
- **Penyimpanan Aman**: Seluruh dokumen identitas dan sertifikasi (STR/KTP) disimpan dalam bucket privat terenkripsi tanpa akses publik langsung.
- **Bukan Pengganti Layanan Darurat**: Layanan ini tidak ditujukan untuk penanganan gawat darurat psikiatri aktif. Pasien dengan ide bunuh diri segera diarahkan ke IGD terdekat atau Hotline Kemenkes 119 ext 8.
