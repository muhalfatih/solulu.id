# Solulu Domain Model

Solulu adalah platform telekonseling kesehatan mental terjangkau dan privat berbasis web di Indonesia dengan model guest-first checkout dan operasional zero-cost server.

## Language

### Pengguna & Peran

**Pasien**:
Individu pencari layanan konseling yang memesan dan mengakses ruang sesi secara langsung sebagai tamu (*guest*) tanpa registrasi akun.
_Avoid_: Klien, User, Akun Pasien, Customer

**Mitra Konselor**:
Praktisi kesehatan mental terverifikasi yang melayani sesi konseling daring melalui Zoom. Terbagi menjadi Konselor Sebaya dan Psikolog Klinis.
_Avoid_: Terapis umum, Dokter, Pekerja

**Konselor Sebaya**:
Mitra pendamping terlatih non-klinis untuk pendampingan masalah emosional dan stres ringan hingga sedang.
_Avoid_: Psikolog, Psikiater

**Psikolog Klinis**:
Mitra profesional berijazah magister profesi psikologi dan memiliki STR aktif untuk intervensi klinis dan kasus berisiko.
_Avoid_: Konselor biasa, Konselor sebaya

**Admin**:
Pengelola operasional platform yang mengelola alokasi Zoom, memverifikasi berkas pelamar mitra, mengatur voucher/tarif, dan memoderasi dokumentasi publik.
_Avoid_: Superuser, Moderator, Staff

### Pemesanan & Penjadwalan

**Slot Jadwal**:
Unit waktu ketersediaan sesi konseling berdurasi fixed 90 menit (zona waktu WIB). Konselor hanya menginput `startTime` per jam bulat; `endTime` dihitung otomatis (`startTime + 90 menit`) oleh server action. Tidak ada buffer eksplisit yang di-enforce sistem — konselor mengatur jarak antar slot sendiri. Di UI pasien, ditampilkan sebagai rentang penuh (misal "19:00 – 20:30 WIB").
_Avoid_: Jam konsultasi, Appointment time, 50+10 menit, 60 menit

**Slot Hold (Reservasi)**:
Mekanisme penguncian slot sementara selama 15 menit saat proses transaksi Xendit berlangsung untuk mencegah bentrok pemesanan (*race condition*).
_Avoid_: Pre-order, Booking sementara, Antrean

**Sesi Konseling**:
Pertemuan telekonsultasi virtual 1-on-1 privat antara pasien dan mitra konselor melalui tautan Zoom Meeting teralokasi.
_Avoid_: Pertemuan, Panggilan, Telemedicine

**Token Sesi**:
Kunci akses rahasia (nanoid 32 karakter) bagi pasien untuk membuka ruang sesi mandiri di `/session/[token]` tanpa login.
_Avoid_: OTP, Password sesi, Kode verifikasi

### Klinis & Skrining

**Skrining SRQ-20**:
Kuesioner mandiri 20 butir standar WHO yang diisi calon pasien sebelum memilih jadwal untuk mengukur tingkat distres emosional.
_Avoid_: Diagnosa medis, Tes kepribadian, Kuis umum

**Deteksi Risiko Bunuh Diri (Suicidal Ideation)**:
Indikasi risiko tinggi klinis yang dipicu oleh jawaban 'Ya' pada pertanyaan 17 SRQ-20 atau skor $\ge 8$.
_Avoid_: Gejala stres biasa, Kelelahan biasa

**Emergency Clinical Waiver**:
Klausul pelepasan tanggung jawab dan nomor kontak darurat nasional (Hotline Kemenkes 119 Ext 8) yang wajib disetujui pasien berisiko tinggi jika tetap memilih Konselor Sebaya.
_Avoid_: Syarat ketentuan umum, Formulir biasa

**Rekam Medis Sesi**:
Laporan pasca-sesi berisi ringkasan evaluasi, rencana aksi (*action plan*), dan lampiran privat yang disusun oleh konselor penanggung jawab.
_Avoid_: Notulensi rapat, Diary pasien, Log sesi

### Operasional & Infrastruktur

**Dispatcher Akun Zoom**:
Modul alokasi dinamis yang memetakan sesi confirmed/reserved ke salah satu dari 2 akun Zoom Pro independen dengan batas maksimal 2 sesi bersamaan (*concurrency guard*).
_Avoid_: Multi-account router, Zoom plugin

**Concurrency Guard**:
Aturan pembatasan platform-wide: maksimal 2 sesi aktif (`reserved` atau `confirmed`) yang *overlap secara waktu* pada tanggal yang sama. Karena sesi berdurasi 90 menit, dua sesi dengan start time berbeda bisa overlap (misal 19:00–20:30 dan 20:00–21:30 overlap di 20:00–20:30). Guard menggunakan range overlap check: `existingStart < newStart + 90min AND existingStart + 90min > newStart`. Jika `COUNT(...) >= 2`, slot baru ditolak/disembunyikan.
_Avoid_: Per-counselor limit, simple startTime equality check

**Kunci Pengaman Zoom (Safety Lock)**:
Aturan validasi yang melarang penyuntingan atau penghapusan kredensial Zoom jika akun masih terikat dengan sesi mendatang berstatus aktif.
_Avoid_: Readonly flag, DB lock

**Dokumentasi Publik**:
Dokumentasi visual kegiatan yang telah lolos sensor identitas wajah dan persetujuan tertulis (*consented*) untuk ditampilkan di galeri publik.
_Avoid_: Bukti sesi mentah, Foto bebas, Testimoni klien

### Siklus Hidup Voucher

**Voucher Hold**:
Saat pasien meng-hold slot dengan voucher, `usedCount` di-increment secara atomik bersama reservasi slot. Jika hold expired (15 menit tanpa pembayaran), cleanup cron mengembalikan `usedCount` bersamaan dengan pembebasan slot.
_Avoid_: Increment saat confirmed saja (race-prone), burn on hold tanpa rollback

### Reschedule

**Reschedule Semi-Otomatis**:
Admin memindahkan `schedule_id` booking ke slot baru via panel admin (dropdown), dan sistem otomatis mengirim email notifikasi ke pasien dengan link sesi baru. Batas permintaan reschedule: H-12 jam sebelum sesi.
_Avoid_: Self-service pasien, reschedule tanpa notifikasi email

### Ketahanan & Fallback

**Fulfillment Failure Fallback**:
Jika worker QStash `/api/jobs/fulfill-booking` gagal setelah retry (Zoom API down, Resend error), booking tetap `confirmed` (uang sudah masuk). Halaman `/session/[token]` menampilkan pesan "Zoom sedang disiapkan" + tombol WhatsApp support. QStash built-in retry (3x) biasanya cukup.
_Avoid_: Rollback pembayaran otomatis, silent failure

**Auto-Archive**:
Sesi yang telah lewat >2 jam dari `endTime` tanpa penyelesaian manual otomatis diarsipkan sebagai `completed` oleh cron `/api/cron/cleanup-slots` (gabung di cron yang sudah ada, tiap 2 menit).
_Avoid_: Cron terpisah, archive manual

**Rate Limiting**:
Diimplementasikan menggunakan Upstash Redis free tier + `@upstash/ratelimit`. Digunakan untuk `/cek-sesi` (3 req / 15 menit per IP) dan endpoint publik lain yang rawan abuse.
_Avoid_: In-memory map (reset tiap cold start), database-backed rate limit

### Harga & Tampilan

**Pricing Display**:
Harga ditampilkan di dua tempat: (1) preview di katalog konselor / landing page ("Mulai dari Rp X"), dan (2) harga final detail (setelah voucher) di halaman checkout `/book/[counselorId]`.
_Avoid_: Harga hanya di checkout, harga tersembunyi

### Dokumen Aplikasi Mitra

**KTP (ktpR2Key)**:
Dokumen identitas wajib untuk semua tipe pelamar mitra konselor. Disimpan di bucket `solulu-private`.
_Avoid_: Opsional, digabung dengan CV

**Ijazah (diplomaR2Key)**:
Dokumen kualifikasi pendidikan wajib untuk semua tipe pelamar mitra. Terpisah dari STR.
_Avoid_: Digabung dengan STR, implisit di CV

**STR (strR2Key)**:
Surat Tanda Registrasi, wajib khusus pelamar Psikolog Klinis. Terpisah dari Ijazah.
_Avoid_: Wajib untuk semua tipe

### Komunikasi & Notifikasi

**WhatsApp Integration**:
Hanya link `wa.me/{nomor}?text=...` — tidak ada integrasi WA Business API. Nomor WA pasien disimpan di DB untuk identifikasi manual oleh admin.
_Avoid_: WA Business API, notifikasi otomatis WA

**Email Touchpoints (v1)**:
Dua email otomatis ke pasien: (1) konfirmasi booking + link sesi setelah pembayaran, (2) recovery link dari `/cek-sesi`. Plus satu email ke konselor saat booking confirmed.
_Avoid_: Reminder H-1, email post-session, WA notification

### Dashboard & Tampilan

**Admin Dashboard (v1)**:
Minimal: total sesi hari ini, total pending payment, total revenue bulan ini, 10 booking terbaru. Tanpa grafik atau breakdown per konselor.
_Avoid_: Chart/grafik, analytics kompleks

**Counselor Dashboard (v1)**:
List view sesi mendatang (hari ini + 7 hari ke depan) dengan tombol "Mulai Zoom" (`zoom_start_url`) dan "Tandai Selesai". Tanpa kalender visual.
_Avoid_: Kalender visual, grid view

**Data Pasien untuk Konselor**:
Konselor melihat: nama pasien, catatan awal (`initialNotes`), skor SRQ-20, flag `hasSuicidalThoughts`, dan flag `bypassedRecommendation`. Informasi klinis lengkap agar konselor siap secara klinis.
_Avoid_: Hanya nama saja, skor tersembunyi

**Katalog Konselor Publik (v1)**:
Filter by tipe (Konselor Sebaya / Psikolog Klinis) + filter by ketersediaan tanggal ("Ada slot di tanggal X"). Spesialisasi di-display tapi belum bisa difilter.
_Avoid_: Filter spesialisasi, sorting kompleks

**Halaman Sesi Pasien**:
Menampilkan nama konselor, tipe, foto, bio singkat, spesialisasi, tanggal & jam sesi, countdown, tombol Zoom (aktif H-10 menit), dan tombol WA support.
_Avoid_: Info minimal tanpa bio

### Setup & Onboarding

**Admin Pertama**:
Dibuat manual via Supabase Dashboard (Auth panel + SQL untuk set `app_metadata.role = 'admin'`). Didokumentasikan di README sebagai setup step. Tidak ada setup wizard atau auto-invite.
_Avoid_: Setup wizard, env-based auto-invite

**Avatar Konselor**:
Konselor upload sendiri via `/counselor/dashboard` menggunakan presigned PUT ke `solulu-public/avatars/`. Admin tidak perlu manage avatar.
_Avoid_: Admin-only upload, avatar dari dokumen aplikasi

### Timing & Sinkronisasi

**Slot Hold vs. Xendit Expiry**:
Xendit invoice expiry = 15 menit (UX timer pasien). Slot hold `reserved_until` = NOW() + 17 menit (2 menit buffer untuk latency webhook). Mencegah race condition di mana cron cleanup membebaskan slot tepat saat pasien bayar detik terakhir.
_Avoid_: Keduanya 15 menit tanpa buffer

### Audit & Tracking

**Voucher Tracking**:
`voucherId` disimpan di tabel `transactions` (nullable). Voucher mempengaruhi `discountAmount` dan `netAmount` yang sudah ada di tabel ini. Rollback `usedCount` saat cleanup dilakukan via join `transactions` → `bookings`.
_Avoid_: voucherId di bookings, tanpa tracking

### Hosting & Free Tier Compliance

**Vercel Hobby → Pro Migration**:
Development dan MVP awal di Vercel Hobby. Upgrade ke Vercel Pro ($20/bulan) sebelum production launch resmi karena Hobby hanya untuk non-commercial personal use. Arsitektur tetap zero-cost-ready (semua guardrails berlaku di Pro).
_Avoid_: Production commercial di Hobby plan

**QStash Usage**:
HTTP-based message queue dari Upstash. Digunakan untuk: (1) decouple webhook Xendit → fulfill-booking worker agar tidak timeout 10 detik, (2) cron scheduler pengganti Vercel Cron (Hobby hanya 1x/hari). Cron cleanup dijalankan tiap **5 menit** (~288 messages/hari), total ~304/hari dengan booking, di bawah free tier 500 messages/hari.
_Avoid_: Cron tiap 2 menit (melebihi kuota), Vercel Cron saja

**Resend Free Tier**:
100 emails/hari. Dengan maks ~16 sesi/hari (2 concurrent × 90 menit × ~12 jam), menghasilkan ~48 email (2 pasien + 1 konselor per booking). Cukup untuk v1.
_Avoid_: Email batching, paid plan prematur

**Supabase Auth Rate Limit**:
4 auth emails/jam (invite konselor). Jarang terkena (approval 1-2/minggu), tapi UI Admin harus menampilkan error handling informatif jika rate-limited.
_Avoid_: Silent failure tanpa feedback

### Scope v1

**Masuk v1:**
Landing page (hero, value prop, cara kerja, pricing, gallery, FAQ, footer) · Katalog konselor + filter tipe & ketersediaan · SRQ-20 screening + Emergency Waiver · Booking flow (slot hold, checkout, Xendit) · Webhook + QStash fulfillment · Session page `/session/[token]` · Session recovery `/cek-sesi` · Admin: dashboard, counselor management, pricing/voucher, zoom settings, gallery, **booking search/filter** · Counselor: dashboard (list view), schedule management, session reports, **profile edit**, **avatar upload** · Auth: login, middleware RBAC · Counselor application `/apply` · **Kebijakan Privasi & Syarat Ketentuan** (`/privacy`, `/terms`) · **Custom error pages** (404, 500) · **SEO** (sitemap.xml, robots.txt, OG meta tags)

**Defer ke v2:**
Email reminder (H-1 jam) · Email post-session · Self-service reschedule pasien · Filter spesialisasi katalog · Kalender visual counselor · Analytics/grafik admin · Bulk delete schedule konselor
