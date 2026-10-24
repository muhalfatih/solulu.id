# 01: Skema Database & Modul Rolling Materializer 4 Minggu

**What to build:**
Fondasi basis data dan modul kalkulasi materialisasi jadwal yang menyimpan cetak biru pola mingguan konselor (Senin–Minggu × 7 Slot Harian Tetap) serta mengeksekusi pembuatan slot fisik riil di PostgreSQL untuk 4 minggu ke depan. Modul ini menjamin bahwa sesi klien yang sudah terpesan (`booked` / `reserved`) tidak akan pernah tertimpa atau terhapus, dan tanggal cuti konselor (`is_leave: true`) selalu diprioritaskan di atas template.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Tabel `counselor_weekly_templates` terdefinisi di skema Drizzle ORM (`counselor_id`, `day_of_week` 1..7, `slot_index` 1..7, `is_active`) dengan unique constraint pada `(counselor_id, day_of_week, slot_index)`.
- [x] Kolom atau status preferensi jadwal konselor (`schedule_mode: 'manual' | 'automatic'`) tercatat di database.
- [x] Fungsi sinkronisasi `materializeCounselorSlots(counselorId, weeksAhead = 4)` di `lib/schedules/template.ts` menghasilkan baris riil di tabel `schedules` untuk 4 minggu ke depan sesuai pola template aktif.
- [x] Slot yang sudah memiliki pemesanan aktif (`status = 'booked'` atau `status = 'reserved'`) tetap terlindungi dan tidak dihapus saat template diperbarui.
- [x] Slot pada tanggal yang tercatat sebagai hari cuti/izin (`is_leave: true`) dilewati oleh materializer dan tidak dijadikan `available`.
- [x] Pengujian unit Vitest memverifikasi pembuatan slot 4 minggu, proteksi booking klien, dan penanganan tanggal cuti.

