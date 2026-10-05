# 4. Admin Manual Counselor Management & Zero-Cost Booking Bypass

Date: 2026-10-05

## Status

Accepted

## Context

Admin Solulu perlu mengelola operasional secara fleksibel:
1. Mendaftarkan dan memperbarui profil Mitra Konselor langsung dari panel Admin tanpa melalui proses lamaran publik (`counselor_applications`).
2. Mendaftarkan Pasien dan menjadwalkan Sesi Konseling secara manual tanpa pembayaran (kasus pro-bono, beasiswa, rujukan darurat, atau pembayaran tunai offline).

Karena skema database memiliki relasi ketat (`counselors.userId` NOT NULL UNIQUE terikat Supabase Auth, dan pembatasan 2 akun Zoom Pro platform pada ADR 0002), diperlukan keputusan desain yang menjaga integritas data dan keamanan operasional.

## Decisions

1. **Admin Counselor Creation via Supabase Auth Admin:**
   - Pembuatan Mitra Konselor manual secara otomatis membuat akun pengguna di Supabase Auth via `supabase.auth.admin.createUser` dengan email, password (kustom atau auto-generated), dan role metadata `counselor`.
   - Record di tabel `counselors` langsung terisi dengan `userId` hasil generate tersebut, memungkinkan Mitra Konselor langsung login ke dashboard `/counselor` untuk mengelola slot dan rekam medis.
   - Foto avatar konselor diunggah langsung ke Cloudflare R2 publik (`solulu-public`) menggunakan presigned PUT URL.

2. **Admin Zero-Cost Booking Bypass (Rp 0 Transaction):**
   - Sesi yang didaftarkan manual oleh Admin tidak memotong atau memanggil gateway pembayaran Xendit.
   - Status booking langsung disetel `confirmed` dengan Token Sesi nanoid 32 karakter terbit seketika.
   - Untuk menjaga keutuhan relasi dan audit finansial, sebuah record transaksi di tabel `transactions` tetap dibuat dengan `paymentProvider: 'admin_bypass'`, `grossAmount: [Tarif Normal]`, `discountAmount: [Tarif Normal]`, `netAmount: 0`, status `PAID`, serta catatan wajib `adminNotes` (alasan pro-bono/beasiswa/rujukan).

3. **Ad-Hoc Scheduling & Zoom Concurrency Guard:**
   - Admin dapat memilih slot yang sudah ada berstatus `available`, ATAU membuat slot 90 menit ad-hoc baru secara otomatis.
   - Slot ad-hoc wajib diverifikasi terhadap *Concurrency Guard*: jika 2 akun Zoom telah terpakai pada rentang 90 menit tersebut, otomatisasi Zoom ditolak.
   - Admin diberikan opsi *Graceful Fallback*: jika kuota Zoom otomatis penuh atau dinonaktifkan, Admin dapat menginput tautan rapat eksternal manual (misal Google Meet) agar sesi tetap dapat berlangsung tanpa bentrok dengan 2 akun Zoom platform.
   - Disediakan toggle untuk menentukan apakah email konfirmasi otomatis dikirimkan ke Pasien dan Mitra Konselor.

## Consequences

- Integritas data relasional (`auth.users` -> `counselors` -> `schedules` -> `bookings` -> `transactions`) tetap 100% terjaga tanpa perlu skema `NULL` yang longgar.
- Analitik finansial platform tetap akurat karena nilai valuasi sesi tercatat via `grossAmount` dan `discountAmount`.
- Kapasitas 2 akun Zoom Pro platform terlindungi dari tabrakan jadwal (*double allocation*).
