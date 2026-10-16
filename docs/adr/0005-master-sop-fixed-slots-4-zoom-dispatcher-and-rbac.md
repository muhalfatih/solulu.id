# 5. Master SOP: 7 Fixed Slots, 4 Zoom Accounts Hybrid Dispatcher, and 4-Role RBAC

Date: 2026-10-15

## Status

Accepted (Supersedes [ADR-0002](file:///home/muhalfatih/solulu-web/docs/adr/0002-90-minute-sessions-and-overlap-concurrency-guard.md))

## Context

Solulu beralih dari model sesi fleksibel 90 menit (dengan guard 2 akun Zoom) ke model operasional terstruktur sesuai Dokumen Master SOP Sistem Konseling. Perubahan ini dilatarbelakangi kebutuhan untuk:
1. Menstandarkan jadwal operasional klinik menjadi 7 slot harian per 2 jam (08.00–22.00 WIB) guna meningkatkan kapasitas platform hingga 10 sesi simultan per slot.
2. Memanfaatkan 4 Akun Zoom Pro klinik secara efisien dengan skema hybrid (Akun 1–3 mandiri, Akun 4 breakout room terpandu).
3. Memperjelas tata kelola peran menjadi 4 peran internal (Superadmin, Admin, Operator, Konselor) dengan pemisahan privasi data klinis dan keuangan yang ketat.
4. Menstandarkan seluruh antarmuka portal backend menggunakan preset resmi Shadcn UI dan menghapus seluruh layout/komponen custom lama.

## Decisions

1. **7 Slot Harian Tetap (08.00–22.00 WIB):**
   - Waktu konseling dibagi menjadi 7 slot tetap:
     - Slot 1: `08.00 – 10.00 WIB`
     - Slot 2: `10.00 – 12.00 WIB`
     - Slot 3: `12.00 – 14.00 WIB`
     - Slot 4: `14.00 – 16.00 WIB`
     - Slot 5: `16.00 – 18.00 WIB`
     - Slot 6: `18.00 – 20.00 WIB`
     - Slot 7: `20.00 – 22.00 WIB`
   - Pengecekan concurrency berbasis rentang waktu dinamis di ADR-0002 digantikan oleh kuota per slot (`slot_index` 1..7) dengan default maksimum 10 sesi per slot.
   - Cutoff pemesanan dan ubah jadwal mandiri dikunci pada H-4 Jam sebelum slot dimulai.

2. **Dispatcher 4 Akun Zoom Pro (Hybrid Standalone & Breakout):**
   - Akun Zoom 1, 2, dan 3: Dialokasikan untuk pesanan ke-1 hingga ke-3 pada setiap slot. Berjalan mandiri via *Join Before Host* aktif; konselor dapat mengklaim hak kendali menggunakan 6-digit *Host Key* tanpa perlu Operator hadir di dalam meeting.
   - Akun Zoom 4: 
     - Jika total sesi pada slot tersebut ≤ 4: Berjalan mandiri tanpa Operator.
     - Jika total sesi pada slot tersebut 5 s/d 10: Operator bertindak sebagai Host di Akun 4, memandu *Waiting Room* dan melakukan *Admit 1-on-1* ke *Breakout Room* masing-masing agar privasi terjaga (klien tidak saling bertemu di *Main Room*).
   - Tautan meeting Zoom dialokasikan sekuensial saat pesanan lunas dan bersifat permanen (tidak pernah berubah bagi klien).

3. **Model 4 Peran & Batasan Hak Akses (RBAC):**
   - **Superadmin:** Kontrol penuh atas parameter sistem, tarif, kuota, akun Zoom, audit, dan peran.
   - **Admin:** Memverifikasi 21 profil data & 8 berkas legalitas konselor, monitoring laporan pembayaran/komisi, bantuan ubah jadwal darurat, pengiriman link laporan via WhatsApp (`wa.me`). Admin **dilarang membaca isi catatan klinis** (hanya status laporan & foto bukti).
   - **Operator:** Memantau jadwal harian pasca H-4 jam, mengirim pengingat link Zoom, memandu ruang Zoom 4 (Waiting Room & Breakout Room). Operator **tidak memiliki akses** ke laporan sesi maupun pembayaran.
   - **Konselor:** Melengkapi 21 data & 8 berkas, mengisi ketersediaan minimal 10 sesi/minggu, menyalakan *Timer Melayang* (peringatan 90 menit, auto-stop 120 menit), dan mengisi Laporan Sesi (*Ringkasan Dinamika Sesi*, *Saran*, *Catatan Internal* rahasia, serta bukti foto dokumentasi).

4. **Privasi Laporan Klinis & Verifikasi Klien:**
   - Klien mengakses laporan melalui `/session/[token]` dan memverifikasi identitas dengan memasukkan Nomor WhatsApp.
   - Klien membaca dan mencetak laporan mandiri (Web View ke PDF). Foto dokumentasi bukti sesi dan catatan internal konselor tidak disertakan dalam PDF klien.

5. **Antarmuka Backend Terpadu Berbasis Shadcn UI:**
   - Mengeliminasi halaman backend lama di `app/admin` dan `app/counselor` yang menggunakan layout/CSS manual.
   - Membangun portal backend terpadu dengan komponen resmi Shadcn UI (`Sidebar`, `Sheet`, `Table`, `Card`, `Badge`, `Dialog`, `Field`, `InputGroup`).

6. **Zero-Mock Policy & Live Prototipe:**
   - Seluruh prototipe UI/UX diuji dengan data terhubung langsung ke database PostgreSQL real (via Drizzle ORM di `@/db`) tanpa data mock/array dummy di direktori produksi.

7. **Aturan Perpanjangan Sesi (Extend Session > 90 Menit):**
   - Dihitung per blok 30 menit dengan batas toleransi (*grace period*) 5 menit (menit 0–95 tarif reguler; menit 96–120 dikenakan 1 blok extend 30 menit).
   - Tarif default: Konselor Sebaya Rp 35.000 / 30 menit dan Psikolog Klinis Rp 50.000 / 30 menit (dapat diatur di Admin/Superadmin).
   - Mendukung metode pembayaran ganda: Pembayaran Otomatis Xendit & Transfer Bank Manual.

8. **Laporan Sesi: Penambahan Isian "Permasalahan Utama":**
   - Formulir laporan klinis konselor memuat field eksplisit: Permasalahan Utama (*Main Issue*), Ringkasan Dinamika Sesi (klien-visible), Saran / Tindak Lanjut (klien-visible), Catatan Internal (rahasia), dan Foto Dokumentasi Kehadiran.

9. **Pemisahan Penggajian (Payroll Decoupling):**
   - Sistem tidak mengelola logika penggajian/komisi otomatis (*payroll engine*), melainkan menyajikan Laporan Rekapitulasi Sesi & Pembayaran komprehensif bagi manajemen klinik.


## Consequences

- Logika race condition overlap dieliminasi total; query ketersediaan slot menjadi jauh lebih deterministik dan cepat.
- Manajemen 4 akun Zoom memerlukan kredensial S2S OAuth aktif untuk 4 akun di database `zoom_accounts`.
- Database schema perlu dimigrasi untuk mendukung 21 field data konselor, 8 file referensi, enum peran baru, dan slot index 1..7.
