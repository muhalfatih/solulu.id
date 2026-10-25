# Spesifikasi Teknis: Pengisian Slot Jadwal Otomatis (Recurring Schedule Templates) untuk Mitra Konselor

## Problem Statement

Saat ini mitra konselor di Solulu harus mengatur ketersediaan slot waktu konseling secara manual dari minggu ke minggu pada kalender live di `/counselor/schedule`. Hal ini menimbulkan friksi operasional yang tinggi bagi konselor yang memiliki pola praktik rutin yang sama setiap minggunya (misalnya setiap Senin dan Rabu pukul 18.00–22.00). Apabila konselor lupa membuka jadwal untuk minggu berikutnya, slot mereka tidak muncul di katalog pencarian klien publik, berpotensi menurunkan pendapatan konselor dan ketersediaan layanan di platform Solulu.

## Solution

Sistem menyediakan dua pilihan model pengisian slot bagi mitra konselor:
1. **Pengisian Manual Mingguan**: Konselor mengelola slot secara ad-hoc dari minggu ke minggu pada kalender aktif seperti biasa.
2. **Pengisian Otomatis Rutin (Recurring Template)**: Konselor menyusun cetak biru ketersediaan mingguan tetap (Senin–Minggu pada 7 slot harian tetap) satu kali. Begitu diaktifkan, sistem secara otomatis mereplikasi dan me-materialisasi slot fisik ke dalam tabel jadwal untuk rolling window 4 minggu ke depan. Konselor tetap memiliki kebebasan untuk melakukan penyesuaian ad-hoc (override) pada minggu tertentu tanpa merusak cetak biru utama, dan sesi yang sudah dipesan klien terlindungi secara mutlak dari pembatalan otomatis.

## User Stories

1. Sebagai mitra konselor, saya ingin dapat memilih antara mode pengisian jadwal manual atau mode pengisian otomatis, sehingga saya dapat menyesuaikan pengelolaan jadwal dengan preferensi kerja saya.
2. Sebagai mitra konselor, saya ingin memiliki antarmuka cetak biru mingguan generik (Senin hingga Minggu pada 7 Slot Harian Tetap), sehingga saya dapat merancang jam praktik rutin saya tanpa terikat tanggal kalender spesifik.
3. Sebagai mitra konselor, saya ingin melihat indikator pemenuhan target minimal 10 slot saat menyusun template mingguan, sehingga saya yakin jadwal rutin saya memenuhi standar komitmen platform.
4. Sebagai mitra konselor, saya ingin sistem menolak pengaktifan mode otomatis jika slot yang saya pilih kurang dari 10 sesi, sehingga saya terhindar dari pelanggaran SLA platform tanpa sengaja.
5. Sebagai mitra konselor, saya ingin slot pada kalender fisik otomatis terisi untuk 4 minggu ke depan saat template diaktifkan, sehingga klien dapat langsung memesan sesi saya di katalog publik.
6. Sebagai mitra konselor yang menggunakan mode otomatis, saya ingin tetap bisa mematikan atau menyalakan slot tertentu pada tanggal spesifik di kalender mingguan aktif, sehingga saya dapat menyesuaikan agenda mendadak tanpa merusak pola rutin mingguan saya.
7. Sebagai mitra konselor, saya ingin perubahan template yang saya simpan tidak membatalkan atau menghapus sesi klien yang sudah terpesan (status `booked` atau `reserved`), sehingga hubungan terapeutik dan hak klien tetap terjaga.
8. Sebagai mitra konselor yang sedang cuti atau izin sakit, saya ingin sistem otomatis mengecualikan tanggal cuti saya dari proses pembuatan slot otomatis, sehingga jadwal saya tidak keliru dibuka untuk pemesanan saat saya berhalangan.
9. Sebagai mitra konselor yang beralih kembali ke mode manual, saya ingin slot yang sudah terlanjur dibuat di kalender masa depan tetap dipertahankan, sehingga ketersediaan saya tidak mendadak hilang dari katalog publik.
10. Sebagai calon klien, saya ingin dapat melihat ketersediaan konselor favorit saya secara konsisten hingga beberapa minggu ke depan di halaman katalog dan pemesanan, sehingga saya dapat merencanakan sesi konseling lanjutan dengan mudah.
11. Sebagai admin operasional, saya ingin memastikan setiap slot yang terbentuk dari template otomatis memiliki data fisik di PostgreSQL yang valid, sehingga alur pemenuhan sesi Zoom dan pencatatan audit transaksi berjalan tanpa cela.

## Implementation Decisions

- **Model Data PostgreSQL**:
  - Dibuat tabel baru `counselor_weekly_templates` yang menyimpan pasangan `(counselor_id, day_of_week, slot_index, is_active)` dengan relasi ke tabel `counselors`. Hari dalam seminggu diwakili oleh integer `1` (Senin) hingga `7` (Minggu).
  - Kolom `schedule_mode` (enum/text `'manual' | 'automatic'`) disimpan pada tabel `counselors` atau metadata template untuk melacak preferensi aktif konselor.
- **Deep Module Rolling Materializer**:
  - Logika pembuatan slot ditempatkan dalam modul murni yang dapat diuji (`lib/schedules/template.ts`).
  - Fungsi sinkronisasi mengambil template aktif, menghitung 4 minggu ke depan mulai dari Senin minggu berjalan, memeriksa apakah ada tanggal cuti (`is_leave = true`) atau sesi terpesan (`booked` / `reserved`), dan melakukan upsert aman ke tabel `schedules`.
- **Server Actions & Validasi Zod**:
  - `getCounselorTemplateAction`: Mengambil data template 7x7 beserta ringkasan komitmen.
  - `saveCounselorTemplateAction`: Memvalidasi skema input (wajib >= 10 slot bila status mode adalah `'automatic'`), menyimpan ke `counselor_weekly_templates`, dan langsung memicu *immediate 4-week materialization*.
  - `toggleScheduleModeAction`: Mengaktifkan/menonaktifkan mode otomatis untuk konselor.
- **Antarmuka Pengguna (UI)**:
  - Halaman `/counselor/schedule` diperbarui menggunakan sistem tab terpadu:
    - Tab 1: **Kalender Mingguan (Aktif)** — kalender tanggal riil dengan navigasi minggu, banner status mode otomatis, dan dukungan override ad-hoc.
    - Tab 2: **Template Otomatis (Rutin)** — grid generik Senin–Minggu, meteran kuota komitmen (target 10 slot), switch mode otomatis, dan tombol simpan.
- **Cron Maintenance**:
  - Ditambahkan fungsi pemeliharaan rolling window pada cron background yang sudah ada (`/api/cron/cleanup-slots` atau cron periodik konselor) untuk memperpanjang ketersediaan slot 4 minggu ke depan secara otomatis setiap minggunya bagi konselor dengan mode otomatis aktif.

## Testing Decisions

- Pengujian unit dan integrasi menggunakan **Vitest** dengan menguji perilaku eksternal kontrak database PostgreSQL real (sesuai *Zero-Mock Policy* di `AGENTS.md`).
- Cakupan pengujian mencakup:
  1. Materializer berhasil membuat baris riil di tabel `schedules` untuk 4 minggu ke depan.
  2. Proteksi booking: Perubahan template tidak menimpa/menghapus baris yang memiliki `bookingId` atau status `booked`/`reserved`.
  3. Proteksi cuti: Tanggal dengan status `is_leave: true` dilewati oleh materializer dan tidak dijadikan `available`.
  4. Validasi server action: Penolakan aktivasi mode otomatis jika slot terpilih < 10.
  5. Perilaku override mingguan: Perubahan slot pada minggu aktif tidak mengubah record template di database.

## Out of Scope

- Pembuatan pola rotasi ganjil-genap (misalnya jadwal berbeda antara minggu ke-1 dan minggu ke-2).
- Notifikasi email kepada konselor setiap kali slot mingguan ter-generate otomatis.
- Pembuatan jadwal non-fixed slot di luar 7 Slot Harian Tetap (08.00–22.00 WIB).

## Further Notes

Keputusan arsitektur mendalam mengenai pemilihan pola *Template + Rolling Materializer* dibandingkan *Virtual In-Memory Slots* telah didokumentasikan dalam ADR 0006 (`docs/adr/0006-recurring-weekly-schedule-templates-and-rolling-materialization.md`).
