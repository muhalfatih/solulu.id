# 02: Server Actions & Validasi Komitmen Kuota Template

**What to build:**
Titik interaksi backend (Server Actions) bagi konselor untuk mengambil data cetak biru template, memperbarui slot template dengan validasi batas minimal komitmen 10 sesi/minggu, dan mengganti preferensi mode jadwal antara manual dan otomatis. Saat template disimpan dengan mode otomatis aktif, sistem langsung memicu materialisasi 4 minggu ke depan secara otomatis dan merevalidasi cache halaman terkait.

**Blocked by:** 01-schema-and-rolling-materializer

**Status:** completed

- [x] Server action `getCounselorTemplateAction()` mengambil seluruh konfigurasi slot template konselor aktif (grid 7 hari × 7 slot) dan menghitung jumlah slot aktif.
- [x] Server action `saveCounselorTemplateAction()` memvalidasi input via Zod: menolak pengaktifan mode otomatis jika total slot aktif terpilih < 10 slot dengan pesan kesalahan informatif.
- [x] Saat penyimpanan template berhasil dengan mode otomatis aktif, modul materializer langsung dipanggil untuk menyinkronkan 4 minggu ke depan.
- [x] Server action `toggleScheduleModeAction()` memungkinkan konselor beralih antara `'manual'` dan `'automatic'` secara instan; saat beralih ke manual, slot yang sudah terbentuk di kalender masa depan tetap dipertahankan.
- [x] Revalidasi cache Next.js (`revalidatePath`) dijalankan untuk `/counselor/schedule` dan katalog publik `/counselors`.
- [x] Pengujian integrasi Vitest memvalidasi penolakan kuota < 10 slot, keberhasilan aktivasi, dan pengalihan mode manual/otomatis.
