---
status: accepted
---

# 9. PRD v9 sebagai Acuan Utama dan Deviasi yang Disengaja

Date: 2026-11-02

`PRD_MASTER_SISTEM_KONSELING_SOLULU.md` (PRD v9) menjadi acuan utama dan menggantikan spec 0003. Beberapa bagian PRD sengaja **tidak** diikuti apa adanya; deviasi ini dicatat agar tidak "diperbaiki" kembali:

1. **Penyimpanan berkas tetap Cloudflare R2** (dua bucket `solulu-public` / `solulu-private`, ADR-0001), bukan 4 bucket Supabase Storage di PRD §10.4. Alur unggah KTP, STR, bukti bayar, dan dokumentasi sudah berjalan di R2; migrasi tidak memberi manfaat ke pengguna.
2. **Route tetap `/cek-sesi` dan `/apply`**; `/tiket` dan `/konselor/register` dari PRD dibuat sebagai redirect permanen agar tautan lama dan baru sama-sama hidup.
3. **Batasan zero-cost ADR-0001 dilonggarkan** menjadi titik awal, bukan batas keras. Kuota default PRD (15 sesi/slot, maks. 25, 7 slot/hari) dapat melampaui free tier Resend (100 email/hari) dan QStash (500 pesan/hari); layanan berbayar boleh dipakai saat volume menuntut.
4. **Konseling Pra-Nikah tidak dibuat sebagai tarif khusus**; PRD §8.1 dipenuhi lewat manajemen **Layanan** yang dapat ditambah/dinonaktifkan oleh Superadmin.
