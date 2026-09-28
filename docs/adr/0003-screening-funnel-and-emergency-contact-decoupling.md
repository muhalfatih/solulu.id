# 3. Relokasi Skrining SRQ-20 ke Funnel Booking & Penghapusan Tautan Kontak Darurat Publik/Admin

## Status
Diterima (Accepted)

## Konteks
1. Sebelumnya, skrining mandiri SRQ-20 dipromosikan secara agresif di landing page publik (navigasi utama, tombol primer hero, banner interaktif section 3, dan footer). Hal ini menimbulkan friksi bagi pengguna baru yang hanya ingin meninjau layanan atau langsung memesan sesi.
2. Banner dan tombol panggilan darurat nasional (Hotline Kemenkes 119 Ext. 8 dan Lisa Hotline) ditampilkan secara menonjol di landing page dan navbar panel admin. Keberadaan tautan darurat aktif ini dapat membingungkan positioning platform telekonseling terjadwal dan memberi kesan alarmis.
3. Kebutuhan untuk menyelaraskan identitas visual dan copywriting landing page dengan situs live `solulu.id` (warna ungu/violet yang hangat, ramah, dan bebas intimidasi).

## Keputusan
1. **Relokasi Skrining ke Funnel Booking**:
   - Seluruh elemen skrining SRQ-20 dicabut dari landing page publik (`/`).
   - Skrining SRQ-20 hanya ditawarkan saat pasien masuk ke proses reservasi/pemesanan jadwal (`/booking`).
   - Disediakan pengaturan dinamis pada panel Admin (`platform_settings`: `is_screening_required`) untuk menentukan apakah pengisian skrining ini **wajib** atau **opsional** bagi pasien sebelum menyelesaikan transaksi booking.
2. **Penghapusan Tautan Kontak Darurat Publik & Admin**:
   - Menghapus banner krisis, tombol panggilan darurat, dan badge hotline 24/7 dari landing page publik (`/`) dan panel navigasi Admin (`app/admin/layout.tsx`).
   - Menjaga klausul batasan tanggung jawab hukum pada teks statis Syarat & Ketentuan (`/terms`) tanpa menyediakan tombol/tautan telepon aktif.
3. **Penyelarasan Tampilan solulu.id**:
   - Landing page mengadopsi palet warna ungu/violet khas Solulu (`#7C3AED` / `#6D28D9`), kartu layanan bertema `#CeritaDiSolulu`, badge "Ruang Aman untuk Cerita", seksi keunggulan "Kenapa Solulu", daftar paket konsultasi, dan testimoni hangat.
   - CTA utama tetap mengalir ke mesin web booking otomatis terintegrasi (`/counselors`).

## Konsekuensi
- Pasien yang mengakses landing page mendapatkan pengalaman yang lebih welcoming, tenang, dan fokus pada eksplorasi konseling.
- Alur booking tetap terjaga fleksibilitasnya: admin memiliki kendali penuh melalui dashboard untuk mengaktifkan atau menonaktifkan kewajiban skrining sesuai kebijakan klinis yang berlaku.
