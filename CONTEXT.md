# Solulu Domain Model

Solulu adalah platform telekonseling kesehatan mental terjangkau dan privat berbasis web di Indonesia dengan model guest-first checkout. Acuan produk: PRD v9 (`PRD_MASTER_SISTEM_KONSELING_SOLULU.md`); deviasi disengaja dicatat di ADR-0009.

## Language

### Pengguna & Peran

**Klien**:
Individu pencari layanan konseling yang memesan dan mengakses ruang sesi secara langsung sebagai tamu (*guest*) tanpa registrasi akun login. Riwayat sesi dikelompokkan secara otomatis berdasarkan nomor WhatsApp dan email.
_Avoid_: Pasien, User, Akun Klien, Customer

**Mitra Konselor**:
Praktisi kesehatan mental terverifikasi yang melayani sesi konseling daring melalui Zoom. Wajib melengkapi 21 data profil & 8 berkas legalitas serta membuka ketersediaan minimal 10 sesi/minggu. Terbagi menjadi Konselor Sebaya dan Psikolog Klinis.
_Avoid_: Terapis umum, Dokter, Pekerja

**Konselor Sebaya**:
Mitra pendamping terlatih non-klinis untuk pendampingan masalah emosional dan stres ringan hingga sedang.
_Avoid_: Psikolog, Psikiater

**Psikolog Klinis**:
Mitra profesional berijazah magister profesi psikologi dan memiliki STR serta SIPP aktif untuk intervensi klinis dan kasus berisiko.
_Avoid_: Konselor biasa, Konselor sebaya

**Superadmin**:
Pengelola sistem level tertinggi; satu-satunya peran yang dapat mengubah parameter sistem, Layanan, tarif, Bagi Hasil, voucher, dan integrasi Zoom Pro. Admin hanya dapat meninjaunya.
_Avoid_: Superuser, Root, Developer

**Admin**:
Pengelola operasional yang memverifikasi 21 data & 8 berkas konselor, memantau laporan pembayaran/komisi, membantu ubah jadwal manual atau ganti konselor darurat, serta mengirim link laporan ke WhatsApp klien. Tidak dapat membaca ringkasan klinis internal.
_Avoid_: Moderator, Staff biasa, Superadmin

**Operator**:
Pengelola teknis ruangan yang memantau 4 akun Zoom Pro, mengirimkan pengingat jadwal & link Zoom via WA, memandu *Waiting Room* dan mengalokasikan *Breakout Room* di Akun Zoom 4 jika slot memiliki lebih dari 4 sesi. Tidak memiliki akses ke laporan klinis maupun keuangan.
_Avoid_: Co-host sembarangan, CS umum, Bot Zoom

### Pemesanan & Penjadwalan

**7 Slot Harian Tetap**:
Unit waktu ketersediaan konseling berdurasi fixed per 2 jam (zona waktu WIB) antara 08.00–22.00 WIB: Slot 1 (08.00–10.00), Slot 2 (10.00–12.00), Slot 3 (12.00–14.00), Slot 4 (14.00–16.00), Slot 5 (16.00–18.00), Slot 6 (18.00–20.00), dan Slot 7 (20.00–22.00). Kuota default 15 sesi bersamaan per slot (maks. 25, diatur Superadmin).
_Avoid_: Slot bebas, Jam sembarang, Sesi 60 menit, Sesi 90 menit bebas

**Cutoff H-4 Jam**:
Batas waktu akhir penguncian pemesanan sesi baru dan pengajuan ubah jadwal mandiri oleh klien (dapat dikonfigurasi oleh Superadmin). Setelah H-4 jam, jumlah sesi per slot telah pasti.
_Avoid_: Pemesanan dadakan < 4 jam, Reschedule instan

**Kunci Jadwal Sementara (Slot Hold)**:
Mekanisme penguncian slot sementara selama 15–30 menit saat klien menyelesaikan proses pembayaran sebelum pesanan otomatis kedaluwarsa.
_Avoid_: Pre-order, Booking sementara tanpa batas

**Sesi Konseling**:
Pertemuan telekonsultasi virtual 1-on-1 privat antara klien dan mitra konselor melalui tautan Zoom Meeting teralokasi.
_Avoid_: Pertemuan, Panggilan, Telemedicine

**Token Sesi**:
Kunci akses rahasia (nanoid 32 karakter) bagi klien untuk membuka halaman sesi mandiri di `/session/[token]` tanpa login. Untuk mengakses laporan sesi dan cetak PDF, diperlukan verifikasi nomor WhatsApp.
_Avoid_: OTP, Password sesi, Kode verifikasi SMS

**Perpanjangan Sesi (Extend Session)**:
Blok tambahan 30 menit yang ditagihkan ke Klien bila sesi melewati menit 95 (toleransi gratis 90–95, batas 120 menit). Tercatat otomatis oleh Timer Melayang dan dapat dikoreksi konselor di Laporan Sesi; tarifnya diatur per Layanan (nilai awal Rp 35.000 Sebaya, Rp 60.000 Psikolog). Laporan Sesi untuk Klien terkunci sampai tagihan ini lunas.
_Avoid_: Argo per menit, Biaya tak terduga tanpa blok

**Template Jadwal Mingguan (Weekly Schedule Template)**:
Cetak biru ketersediaan berulang mitra konselor untuk 7 hari (Senin–Minggu) pada 7 Slot Harian Tetap yang otomatis di-materialisasi menjadi baris jadwal riil di tabel `schedules` untuk rolling window 4 minggu ke depan. Wajib memenuhi komitmen minimal 10 slot aktif sebelum mode otomatis dapat diaktifkan.
_Avoid_: Jadwal virtual tanpa baris DB, Slot tanpa batas rolling, Template di bawah 10 slot

**Override Jadwal Mingguan (Weekly Schedule Override)**:
Penyesuaian slot ad-hoc pada tanggal kalender spesifik oleh konselor yang telah mengaktifkan mode otomatis, tanpa mengubah cetak biru template dasar. Slot berstatus `booked` atau `reserved` terlindungi secara mutlak dari penimpaan atau penghapusan otomatis oleh perubahan template.
_Avoid_: Hard reset jadwal aktif, Pembatalan otomatis sesi klien yang sudah terpesan

### Klinis & Skrining

**Skrining SRQ-20**:
Kuesioner mandiri 20 butir standar WHO yang disajikan secara terintegrasi saat calon klien memulai proses reservasi (dapat dikonfigurasi oleh Superadmin: wajib atau opsional) untuk memberikan konteks distres emosional kepada konselor pendamping, tanpa dimunculkan di landing page publik.
_Avoid_: Diagnosa medis, Tes kepribadian, Kuis umum, Skrining di landing page

**Protokol Darurat & Hotline Krisis**:
Kebijakan penanganan situasi krisis. Nomor kontak darurat dan banner hotline tidak ditampilkan di landing page maupun panel admin untuk menjaga suasana ruang yang tenang dan tidak alarmis, dengan klausul batasan tanggung jawab hukum tetap dicantumkan dalam Syarat & Ketentuan.
_Avoid_: Gejala stres biasa, Alarm intimidatif, Banner darurat di landing page, Tombol hotline di admin

**Laporan Sesi Konseling**:
Laporan pasca-sesi yang diisi langsung oleh konselor penanggung jawab melalui form web tanpa unggah PDF, memuat:
1. Permasalahan Utama (*Main Issue* / fokus intervensi klinis),
2. Ringkasan Dinamika Sesi (terbaca oleh klien),
3. Saran / Tindak Lanjut (opsional, terbaca klien),
4. Catatan Internal (rahasia medis, tersembunyi dari klien dan admin), serta
5. Foto Dokumentasi Bukti Sesi (internal, tidak ikut tercetak di PDF klien).
_Avoid_: Notulensi rapat, Diary pasien, Log sesi, Rekam medis bebas

### Pembayaran & Transaksi

**Pembayaran Otomatis Xendit**:
Alur pembayaran instan via payment link Xendit (QRIS, e-Wallet, Virtual Account) dengan webhook callback otomatis untuk pemesanan awal maupun pelunasan biaya perpanjangan sesi.
_Avoid_: Pembayaran kartu manual, gateway tak dikenal

**Transfer Bank Manual**:
Alur pembayaran alternatif di mana klien mentransfer langsung ke rekening klinik platform (tersedia baik saat checkout pemesanan awal maupun pelunasan perpanjangan sesi), dan Admin memverifikasi bukti transaksi/mutasi bank secara manual di dashboard untuk mengonfirmasi sesi atau membuka akses laporan.
_Avoid_: Transaksi gelap, Pembayaran tanpa nomor referensi

**Honor Konselor**:
Hak bayaran Mitra Konselor per sesi, dihitung sistem dari persentase **Bagi Hasil** atas tarif pokok dan overtime. Tetap dibayar penuh bila klien No-Show.
_Avoid_: Gaji, Komisi manual, Fee bebas

**Bagi Hasil**:
Persentase tarif pokok dan tarif overtime yang menjadi Honor Konselor, diatur Superadmin per Layanan (nilai awal: Layanan Sebaya 70%/80%, Layanan Psikolog 80%/85%). Tarif pokok yang dipakai adalah tarif aktif Layanan sebelum voucher; Booking Manual Rp 0 tetap menghasilkan honor.
_Avoid_: Potongan platform, Komisi tetap

**Periode Payroll**:
Siklus 2 mingguan pengumpulan Honor Konselor (tgl 1–15 dan tgl 16–akhir bulan, menurut tanggal sesi) yang diekspor ke CSV untuk transfer massal bank. Setelah Admin menutup periode, isinya beku; honor yang tertahan pindah ke periode saat syaratnya terpenuhi. Pencairan dana dilakukan manual di luar sistem.
_Avoid_: Payroll bulanan, Payroll decoupled

**Payroll Hold**:
Penahanan Honor Konselor suatu sesi selama Laporan Sesi Konseling belum diserahkan. Honor overtime juga tertahan selama tagihan perpanjangan klien belum lunas.
_Avoid_: Denda, Pemotongan honor

**Omzet, HPP & Laba Bersih**:
Omzet diakui pada tanggal pembayaran lunas; HPP adalah total Honor Konselor (pokok + overtime) menurut tanggal sesi; Laba Bersih = Omzet − HPP dan hanya bermakna per periode, tidak per hari. Pembanding sebuah periode adalah rentang dengan jumlah hari yang sama tepat sebelumnya.
_Avoid_: Revenue per tanggal sesi

**Booking Manual (Admin Bypass)**:
Pemesanan sesi konseling yang dibuat langsung oleh Admin dari panel operasional untuk kebutuhan beasiswa, rujukan khusus/pro-bono, atau penjadwalan darurat tanpa pemrosesan gerbang pembayaran (payment gateway), dengan transaksi tercatat bernilai bersih Rp0 (`netAmount: 0`) dan audit catatan alasan pembebasan biaya. Pasca-pembuatan record awal, eksekusi pemenuhan ruang Zoom atau tautan eksternal didelegasikan langsung ke modul Pemenuhan Sesi (*Session Fulfillment*) tanpa menduplikasi logika alokasi host.
_Avoid_: Free booking, Booking backdoor, Sesi ilegal, Booking kasir, Alokasi Zoom ad-hoc

### Operasional & Infrastruktur

**Pemenuhan Sesi (Session Fulfillment)**:
Modul tunggal yang mengorkestrasi eksekusi pasca-pembayaran maupun bypass admin secara idempoten: mengunci status booking ke `confirmed`, mengalokasikan akun Zoom Pro via Dispatcher 4 Akun Zoom (atau menyematkan tautan rapat manual eksternal), membuat ruang rapat (atau Breakout Room), memperbarui jadwal menjadi `booked`, dan mendistribusikan email konfirmasi ke Klien dan Mitra Konselor.
_Avoid_: Manual fulfillment tersebar, Alokasi Zoom ad-hoc, Multi-pipeline fulfillment

**Dispatcher 4 Akun Zoom**:
Modul alokasi terdistribusi yang memetakan sesi confirmed pada suatu slot ke dalam 4 Akun Zoom Pro klinik:
- Sesi 1–3: Menggunakan Akun Zoom 1, 2, dan 3 (mandiri, *Join Before Host* aktif, konselor memegang 6-digit *Host Key*).
- Sesi 4 (jika total slot ≤ 4): Menggunakan Akun Zoom 4 secara mandiri tanpa operator.
- Sesi ke-4 dan seterusnya (jika total slot > 4): Menggunakan Akun Zoom 4 dalam mode *Breakout Room* yang dipandu oleh Operator dengan *Waiting Room* dan pemindahan peserta 1-on-1 agar antar-klien tidak pernah saling bertemu di ruang utama.
Alokasi dijalankan saat booking lunas dan dijalankan ulang setiap reschedule; yang permanen adalah link Token Sesi, bukan link Zoom.
_Avoid_: Akun Zoom acak, Reschedule tanpa alokasi ulang

**Timer Melayang (Floating Timer)**:
Widget penghitung waktu aktif yang melayang di layar konselor saat sesi berjalan. Memberi chime lembut di menit 80 ("10 menit tersisa") dan otomatis berhenti di menit 120.
_Avoid_: Stopwatch fisik, Timer eksternal ponsel

**Testimoni Klien**:
Kurasi ulasan tertulis dari klien pasca-konseling dengan inisial/anonim, rating bintang, kutipan highlight, dan topik untuk ditampilkan secara terkurasi di website publik.
_Avoid_: Komentar liar tanpa kurasi, Ulasan tanpa izin anonimitas

### Siklus Booking

**Tahap Booking**:
Posisi sebuah booking dalam siklusnya: Menunggu Bayar → Terkonfirmasi → Ditugaskan → (Dijadwal Ulang) → Sesi Berjalan → Selesai → Laporan Masuk → Payroll Ditutup, atau berakhir sebagai Kedaluwarsa, Dibatalkan, atau No-Show.
_Avoid_: Status bebas, Status ganda

**No-Show**:
Klien tidak hadir hingga batas toleransi (default 30 menit). Sesi hangus tanpa refund, Honor Konselor tetap penuh.
_Avoid_: Batal, Absen konselor

**Antrean Klien Tersedia (Client Pool)**:
Booking yang dibayar dengan pilihan "Konselor Bebas" dan belum memiliki Mitra Konselor; menunggu diklaim hingga Cutoff H-4 Jam, setelah itu ditugaskan Admin.
_Avoid_: Booking tanpa konselor, Lelang sesi

**Klaim Sesi**:
Tindakan Mitra Konselor yang memenuhi syarat (tipe sesuai Layanan, jadwal kosong di slot itu, tidak cuti) mengambil booking dari Antrean Klien Tersedia; siapa cepat dia dapat.
_Avoid_: Rebutan, Assign mandiri

### Layanan

**Layanan**:
Jenis konseling yang dijual (mis. Partner Cerita, Psikolog Klinis, Konseling Pra-Nikah) dengan tarif, tarif overtime, dan Bagi Hasil sendiri; selalu 90 menit. Menentukan Tipe Konselor yang boleh menanganinya. Ditambah atau dinonaktifkan (tidak dihapus) oleh Superadmin.
_Avoid_: Paket, Tipe konselor, Kategori harga

**Tipe Konselor**:
Kualifikasi Mitra Konselor: Konselor Sebaya atau Psikolog Klinis. Hasil Skrining SRQ-20 merekomendasikan Tipe Konselor, bukan Layanan.
_Avoid_: Layanan, Tier harga

### Siklus Hidup Voucher

**Voucher Hold**:
Saat pasien meng-hold slot dengan voucher, `usedCount` di-increment secara atomik bersama reservasi slot. Jika hold expired (15 menit tanpa pembayaran), cleanup cron mengembalikan `usedCount` bersamaan dengan pembebasan slot.
_Avoid_: Increment saat confirmed saja (race-prone), burn on hold tanpa rollback

### Reschedule

**Reschedule Mandiri**:
Perubahan jadwal oleh Klien sendiri melalui halaman sesi ke slot milik konselor yang sama, maksimal 1 kali per booking dan paling lambat sebelum Cutoff Reschedule (default H-4 jam, diatur Superadmin).
_Avoid_: Reschedule tanpa batas, Reschedule via chat saja

**Reschedule Admin**:
Perubahan jadwal oleh Admin atas permintaan Klien atau keadaan darurat; tidak terikat jatah 1 kali milik Klien.
_Avoid_: Reschedule semi-otomatis

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

**Dashboard Admin**:
Ringkasan operasional dan keuangan dari data riil: daftar Perlu Tindakan, KPI (Omzet, Laba Bersih, Sesi Selesai, Keterisian Slot), serta grafik omzet vs HPP, sesi per Layanan, keterisian slot, dan metode bayar. Default rentang = Periode Payroll berjalan. Superadmin juga melihat Jejak Audit terbaru; Operator tidak pernah melihat angka keuangan.
_Avoid_: Grafik dengan data contoh, Angka statis

**Perlu Tindakan**:
Daftar pekerjaan Admin yang mendesak: booking pool belum diklaim mendekati Cutoff, laporan sesi lewat 24 jam, bukti transfer menunggu verifikasi, dan STR/SIPP yang kedaluwarsa < 60 hari.
_Avoid_: Notifikasi umum, Inbox

**Honor Saya**:
Tampilan Honor Konselor milik konselor sendiri per Periode Payroll, termasuk honor yang tertahan dan alasannya.
_Avoid_: Slip gaji, Payroll semua konselor

**Counselor Dashboard (v1)**:
Sesi hari ini dan 7 hari ke depan, Antrean Klien Tersedia yang dapat diklaim, dan Honor Saya. Tanpa kalender visual.
_Avoid_: Kalender visual, grid view

**Data Pasien untuk Konselor**:
Konselor melihat: nama pasien, catatan awal (`initialNotes`), skor SRQ-20, flag `hasSuicidalThoughts`, dan flag `bypassedRecommendation`. Informasi klinis lengkap agar konselor siap secara klinis.
_Avoid_: Hanya nama saja, skor tersembunyi

**Katalog Konselor Publik (v1)**:
Dikelola oleh deep module `lib/counselor/directory.ts` langsung ke PostgreSQL Drizzle ORM tanpa in-memory mock. Menggabungkan kalkulasi slot aktif bookable, join tier platform pricing (SSOT), dan filter ketersediaan tanggal/tipe (Konselor Sebaya vs Psikolog Klinis). Jika tidak ada konselor aktif atau jadwal, mengembalikan array kosong `[]` (Empty State).
_Avoid_: In-memory fallback mock (`data.ts` / `registry.ts`), data tiruan statis

**Halaman Sesi Pasien & Privacy Gate**:
Dikelola oleh deep module `lib/session/access.ts`. Mengambil data sesi pasien dengan tautan token permanen (`nanoid(32)`). Mengunci laporan klinis di balik verifikasi gerbang nomor WhatsApp dan menjamin zero clinical leak melalui proyeksi kolom SQL ketat (tidak pernah memuat `internalNotes` atau `attachmentR2Keys` ke memori klien). Menangani *dual-payment engine* untuk perpanjangan sesi (>90 menit) melalui invoice Xendit otomatis atau upload bukti transfer bank manual.
_Avoid_: Proyeksi data rahasia klinis, URL checkout ekstensi palsu/hardcoded, verifikasi tanpa normalisasi telepon

**Booking Cepat Admin**:
Booking yang dibuat CS/Admin untuk Klien yang menghubungi lewat WhatsApp. Dibayar lewat tautan pembayaran Xendit (hold default 60 menit), bukti transfer yang diunggah Admin, atau dijadikan Booking Manual Rp 0 dengan alasan.
_Avoid_: Booking manual bypass (itu Rp 0), Input mutasi bank

**Template Pesan WhatsApp**:
Teks baku berparameter (mis. Dispatch Link Sesi, Laporan Siap) yang dikelola Admin dan dibuka 1-klik via `wa.me`; setiap pengiriman tercatat sebagai Sudah Dikirim beserta waktunya.
_Avoid_: Pesan ketik manual, Broadcast otomatis

**Jejak Audit**:
Catatan permanen setiap aksi krusial staf (siapa, peran, aksi, entitas, IP, data sebelum/sesudah), termasuk akses ke dokumen privat konselor. Hanya dapat dilihat Superadmin.
_Avoid_: Log debug, Riwayat bebas

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

**Free Tier sebagai Titik Awal**:
Layanan gratis (Resend 100 email/hari, QStash 500 pesan/hari) dipakai selama volume memungkinkan; dengan kuota 15–25 sesi/slot, paket berbayar boleh diaktifkan (ADR-0009).
_Avoid_: Zero-cost sebagai batas keras

**Supabase Auth Rate Limit**:
4 auth emails/jam (invite konselor). Jarang terkena (approval 1-2/minggu), tapi UI Admin harus menampilkan error handling informatif jika rate-limited.
_Avoid_: Silent failure tanpa feedback

### Scope v1

**Masuk v1:**
Landing page (hero, value prop, cara kerja, pricing, gallery, FAQ, footer) · Katalog konselor + filter tipe & ketersediaan · SRQ-20 screening + Emergency Waiver · Booking flow (slot hold, checkout, Xendit) · Webhook + QStash fulfillment · Session page `/session/[token]` · Session recovery `/cek-sesi` · Admin: dashboard, counselor management, pricing/voucher, zoom settings, gallery, **booking search/filter** · Counselor: dashboard (list view), schedule management, session reports, **profile edit**, **avatar upload** · Auth: login, middleware RBAC · Counselor application `/apply` · **Kebijakan Privasi & Syarat Ketentuan** (`/privacy`, `/terms`) · **Custom error pages** (404, 500) · **SEO** (sitemap.xml, robots.txt, OG meta tags)

**Defer ke v2:**
Email reminder (H-1 jam) · Email post-session · Filter spesialisasi katalog · Kalender visual counselor · Bulk delete schedule konselor · Kontrak digital & e-signature (spec terpisah)
