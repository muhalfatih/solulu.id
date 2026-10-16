# Dokumen Master: Spesifikasi Sistem, SOP Teknis Zoom & Jobdesc Peran
**Aplikasi Web Pemesanan & Manajemen Konseling**

---

## Ringkasan Parameter Utama Sistem

| Parameter | Nilai / Pengaturan | Keterangan |
| :--- | :--- | :--- |
| **Jam Operasional** | `08.00 – 22.00 WIB` | Terbagi menjadi 7 slot harian (durasi per 2 jam) |
| **Kuota per Slot** | `Maks. 10 Sesi` | Nilai default/opsional (dapat diubah di Pengaturan Admin) |
| **Batas Waktu (Cutoff)** | `H-4 Jam` | Berlaku untuk pemesanan baru & pengajuan ubah jadwal |
| **Kapasitas Ruang** | `4 Akun Zoom Pro` | Skema 3 Akun Mandiri + 1 Akun Gabungan (*Breakout Room*) |
| **Kewajiban Konselor** | `Min. 10 Sesi / Minggu` | Nilai default (dapat diubah di Pengaturan Admin) |
| **Batas Waktu Bayar** | `15 – 30 Menit` | Kunci jadwal sementara sebelum pesanan otomatis batal |
| **Batas Tunggu Hadir** | `30 Menit` | Lewat dari 30 menit tanpa kabar dianggap selesai (*No-Show*) |

---

# BAGIAN I: SPESIFIKASI SISTEM PEMESANAN & MANAJEMEN KONSELING

## 1. Pembagian Peran Pengguna (4 Role)

| Peran | Tugas & Tanggung Jawab Utama | Batasan Akses & Privasi |
| :--- | :--- | :--- |
| **Superadmin** | Mengatur aturan waktu pesan, batas ubah jadwal, batas waktu bayar, tarif dasar, kuota maksimal sesi, dan target minimal sesi konselor. | Akses penuh ke seluruh pengaturan, data, dan laporan sistem. |
| **Admin** | Memverifikasi 21 data konselor, memantau Laporan Pembayaran, membantu ubah jadwal/ganti konselor, dan mengirim link laporan ke WA klien. | Hanya melihat **status laporan** & foto bukti, tanpa membaca isi cerita klinis klien. |
| **Operator** | Mengelola 4 akun Zoom Pro, mengirim pengingat link Zoom via WA, serta mengatur *Waiting Room* dan *Breakout Room* saat sesi berjalan. | Tidak memiliki akses ke Laporan Sesi maupun Laporan Pembayaran. |
| **Konselor / Psikolog** | Mengisi jadwal mingguan (minimal 10 sesi), melihat profil & riwayat klien, menyalakan *Timer Melayang*, dan mengisi Laporan Sesi. | Hanya mengakses data dan laporan klien yang ditanganinya sendiri. |

---

## 2. Aturan Jam Pemesanan, Kuota & Kehadiran

### A. Pembagian 7 Slot Waktu Harian (WIB)
Waktu pemesanan tidak ditentukan secara bebas oleh konselor, melainkan mengikuti 7 slot tetap setiap 2 jam:
* **Slot 1:** `08.00 – 10.00 WIB`
* **Slot 2:** `10.00 – 12.00 WIB`
* **Slot 3:** `12.00 – 14.00 WIB`
* **Slot 4:** `14.00 – 16.00 WIB`
* **Slot 5:** `16.00 – 18.00 WIB`
* **Slot 6:** `18.00 – 20.00 WIB`
* **Slot 7:** `20.00 – 22.00 WIB`

### B. Ketentuan Kuota, Jadwal & Kehadiran
* **Kuota & Batas Waktu Pesan:** Setiap slot waktu maksimal menampung **10 sesi bersamaan** (bersifat opsional/default dan dapat diubah di Pengaturan Admin). Pemesanan dilakukan paling lambat **4 jam sebelum sesi dimulai** (dapat diatur di Pengaturan Admin).
* **Kunci Jadwal Sementara:** Saat klien memesan, jadwal dikunci selama **15–30 menit** untuk menunggu pembayaran. Jika melewati batas waktu belum dibayar, pesanan otomatis batal dan jadwal terbuka kembali untuk klien lain.
* **Kewajiban Jadwal Konselor:** Setiap konselor wajib membuka ketersediaan minimal **10 sesi per minggu** (dapat diatur di Pengaturan Admin), dilengkapi fitur izin/cuti jika berhalangan penuh di minggu tertentu.
* **Batas Tunggu Kehadiran (*No-Show*):** Batas tunggu di ruang Zoom adalah **30 menit** sejak jadwal dimulai. Lewat dari 30 menit tanpa kabar, sesi dianggap selesai (hangus) dan pembayaran tidak dapat dikembalikan (*Non-Refundable*, kecuali pembatalan berasal dari pihak konselor/klinik).

---

## 3. Halaman Sesi Klien, Ubah Jadwal & Kondisi Darurat

> **Akses Klien Tanpa Akun Login:**
> Setiap pesanan yang berhasil akan otomatis mengirimkan **Email berisi Tautan Halaman Sesi Klien** (serta tersedia tombol pengingat WA manual bagi Admin/Operator). Halaman ini menampilkan jadwal (WIB), aturan nama tampilan Zoom (`Kode Booking - Nama Panggilan`), tombol masuk Zoom, fitur ubah jadwal, serta akses baca dan cetak laporan.

* **Jalur 1 — Ubah Jadwal Mandiri (Lewat Link Halaman Sesi):** Klien dapat memilih jadwal baru langsung di halaman sesinya. Tombol otomatis terkunci jika waktu sesi tinggal kurang dari **4 jam** (sesuai Pengaturan Admin) atau jika kuota ubah jadwal (**maksimal 1 kali**) sudah terpakai.
* **Jalur 2 — Dibantu Admin (Lewat Tombol WhatsApp):** Tersedia tombol pintasan WhatsApp ke Admin jika klien membutuhkan bantuan perubahan jadwal.
* **Fitur Darurat "Ganti Konselor":** Jika konselor mendadak sakit atau berhalangan di bawah 4 jam sebelum sesi, Admin dapat memindahkan pesanan ke konselor lain yang kosong di jam yang sama (atau mengubah jadwal tanpa memotong jatah ubah jadwal klien).

---

## 4. Pengaturan 4 Akun Zoom Pro

| Urutan Pesanan pada Slot Sama | Alokasi Akun Zoom | Mekanisme Ruang Konseling |
| :--- | :--- | :--- |
| **Pesanan Ke-1 s/d Ke-3** | Akun Zoom 1, 2, dan 3 | Masing-masing sesi memakai 1 akun Zoom Pro terpisah secara mandiri. Link Zoom yang sudah dikirim ke klien tidak akan pernah berubah. |
| **Pesanan Ke-4** *(Jika Hanya 4 Sesi)* | Akun Zoom 4 | Berjalan sebagai sesi mandiri di Akun Zoom 4 tanpa perlu membagi *Breakout Room*. |
| **Pesanan Ke-4 s/d Ke-10** *(Jika > 4 Sesi)* | Akun Zoom 4 *(Gabungan)* | Menggunakan *Waiting Room* dan *Breakout Room* yang dipandu **Operator** agar klien masuk ke ruang konselornya tanpa saling bertemu di ruang utama. |

---

## 5. Timer Melayang & Perpanjangan Sesi (> 90 Menit)

* **Timer Melayang (*Floating Timer*):** Saat sesi dimulai, konselor menyalakan penghitung waktu yang tampil melayang di layar selama konsultasi berlangsung (dilengkapi pengingat menjelang menit ke-90 dan otomatis berhenti di menit ke-120) agar konselor selalu sadar waktu dan tidak lupa mematikan timer.
* **[DITUNDA / HOLD] Hitungan Biaya Tambahan (> 90 Menit):** Saat ini sistem fokus mencatat durasi waktu riil dari timer, sedangkan rumus biaya tambahan (*argo*) dan mekanisme penagihannya akan ditentukan pada tahap berikutnya.

---

## 6. Struktur Data Konselor (21 Data) & Data Klien (8 Data)

### A. Daftar Data Konselor (21 Data + Pengaturan Tarif/Komisi)
1. **Biodata & Keahlian (9 Data):**
   * (1) Nama & Gelar
   * (2) Email
   * (3) Nomor WhatsApp
   * (4) Domisili
   * (5) Area Fokus & Spesialisasi
   * (6) Riwayat Pendidikan
   * (7) Pengalaman (tahun)
   * (8) Bio & Pendekatan Konseling
   * (9) Keanggotaan HIMPSI
   * *(Tambahan Sistem)* Pengaturan Tarif Khusus / Komisi Konselor
2. **Izin Praktik (4 Data — Dilengkapi Pengingat Masa Berlaku):**
   * (10) Nomor SIPP / SILP / SIPPK
   * (11) Tanggal Kadaluarsa SIPP / SILP / SIPPK
   * (12) Nomor STR / SSP
   * (13) Tanggal Kadaluarsa STR / SSP
3. **Lampiran Berkas (8 File):**
   * (14) Berkas Foto Formal (setengah badan)
   * (15) Berkas KTP
   * (16) Berkas CV Terbaru
   * (17) Berkas Ijazah S1 Psikologi
   * (18) Berkas Ijazah Profesi Psikolog
   * (19) Berkas STR / SSP
   * (20) Berkas SIPP / SILP / SIPPK
   * (21) Berkas Sertifikat / Dokumen Pendukung *(opsional)*

### B. Daftar Data Klien (8 Data + Persetujuan Layanan)
1. Nama Lengkap / Panggilan
2. Email
3. Nomor WhatsApp
4. Jenis Kelamin
5. Umur
6. Domisili
7. Agama
8. Catatan / Masalah / Keluhan Awal
* **Checkbox Persetujuan Layanan (*Informed Consent*):** Persetujuan syarat dan ketentuan layanan konseling (termasuk izin dokumentasi bukti kehadiran internal) di bagian bawah form pemesanan.
* **Pengelompokan Riwayat Klien Otomatis:** Sistem otomatis mengenali dan mengelompokkan riwayat konseling klien lama berdasarkan **Nomor WhatsApp / Email** yang sama, sehingga konselor dapat melihat histori sesi klien tersebut sebelumnya.

---

## 7. Laporan Sesi, Follow-Up WhatsApp & Laporan Pembayaran

### A. Format Form Laporan Sesi (Diisi Konselor Tanpa Upload PDF)
* **Ringkasan Dinamika Sesi** *(Tampil ke Klien)*
* **Saran / Tindak Lanjut** — Opsional *(Tampil ke Klien)*
* **Catatan Internal** — Opsional *(Rahasia, disembunyikan dari Klien & Admin)*
* **Upload Foto Dokumentasi** — Bisa >1 foto *(Bukti internal, tidak ikut tercetak di PDF Klien)*

### B. Cara Klien Melihat/Cetak Laporan & Penanda Follow-Up
* **Cetak Mandiri (Web View ke PDF):** Klien membuka link halaman sesinya, memasukkan **Nomor WhatsApp** sebagai verifikasi keamanan, lalu dapat langsung membaca dan menekan tombol **Cetak / Simpan sebagai PDF**.
* **Follow-Up Manual via `wa.me`:** Saat ini tidak ada opsi pengingat sesi lanjutan. Begitu laporan selesai diisi konselor dan link-nya dikirimkan ke WhatsApp klien melalui tombol pintasan `wa.me`, sesi tersebut langsung ditandai **"Sudah Follow Up"**.

### C. Laporan Pembayaran
* Halaman rekapitulasi bagi Admin/Superadmin untuk memantau riwayat pembayaran klien (tarif dasar maupun tarif khusus konselor) dan menghitung komisi konselor untuk setiap sesi yang telah selesai dilaporkan.

---
---

# BAGIAN II: SOP TEKNIS RUANG ZOOM & RINCIAN TUGAS PERAN (JOBDESC)

## 1. Alur Private Zoom (Sesi 1–3 atau 1–4) Tanpa Operator

> **Apakah Sesi Private 1–3 (atau 1–4) Membutuhkan Operator di Dalam Zoom? TIDAK PERLU.**
> Walaupun Konselor dan Klien hanya memakai akun Zoom Basic (gratisan), sesi konseling tetap berjalan **tanpa batas 40 menit** dan tanpa perlu dijaga Operator karena ruang meeting dibuat oleh Akun Zoom Pro milik klinik.

* **Otomatis *Join Before Host*:** Saat sistem membuat link meeting di Akun Zoom 1, 2, dan 3 (serta Zoom 4 jika total sesi pada jam tersebut maksimal 4 sesi), pengaturan *Join Before Host* langsung aktif. Konselor dan Klien bisa langsung masuk tanpa menunggu Operator.
* **6-Digit *Host Key* di Dashboard Konselor:** Dashboard Konselor menampilkan 6 angka *Host Key*. Jika konselor membutuhkan akses *Share Screen*, konselor cukup menekan *Claim Host* di Zoom dan memasukkan 6 angka tersebut.
* **Jumlah Sesi Terkunci di H-4 Jam:** Karena pemesanan dan ubah jadwal dikunci pada **H-4 jam**, jumlah sesi pada setiap slot jam sudah pasti sebelum sesi dimulai:
  * **Jika Total 1 s/d 4 Sesi:** Menggunakan Zoom 1, 2, 3, dan 4 secara terpisah (1-on-1). Operator **tidak perlu masuk ke ruang Zoom** (cukup siaga jika ada laporan kendala teknis).
  * **Jika Total 5 s/d 10 Sesi:** Sesi 1–3 tetap berjalan mandiri di Zoom 1, 2, dan 3. **Operator wajib masuk sebagai Host di Zoom 4** untuk memandu *Waiting Room* dan *Breakout Room* bagi Sesi ke-4 s/d ke-10.

---

## 2. Alur Masuk & Teknis Zoom 4 (Mode Breakout Room)

> **Aturan Privasi di Zoom 4:**
> Peserta yang berada di *Waiting Room* Zoom tidak dapat melihat siapa saja peserta lain yang sedang mengantre. Operator wajib memasukkan klien **satu per satu (*Admit 1-on-1*)** dari *Waiting Room* langsung ke *Breakout Room* agar antar-klien tidak pernah saling bertemu di ruang utama (*Main Room*).

| Tahapan Waktu | Peran Terlibat | Langkah Kerja Teknis di Zoom 4 |
| :--- | :--- | :--- |
| **Tahap 1: Persiapan Ruang**<br>*(H-15 Menit)* | **Operator** | Login ke Akun Zoom 4 sebagai *Host*. Pastikan fitur **Waiting Room Aktif**, matikan opsi peserta kembali ke *Main Room*, dan buat kamar **Breakout Room** sesuai nama konselor / kode booking (untuk Sesi 4–10). |
| **Tahap 2: Konselor Masuk**<br>*(H-10 Menit)* | **Konselor & Operator** | Konselor klik link Zoom dari dashboard. Operator langsung menerima (*Admit*) dan memindahkan (*Assign*) Konselor masuk ke *Breakout Room* masing-masing. |
| **Tahap 3: Klien Masuk Satu per Satu**<br>*(H-5 Menit s/d Mulai)* | **Klien & Operator** | Klien masuk dengan format nama `Kode Booking - Nama`. Operator menerima (*Admit*) **1 klien saja** ke *Main Room*, langsung memindahkannya ke *Breakout Room* konselornya, lalu mengulangi proses ini untuk klien berikutnya setelah *Main Room* kosong. |
| **Tahap 4: Sesi Berjalan & Selesai**<br>*(Menit 00 – 120)* | **Konselor & Klien** | Begitu klien masuk ke *Breakout Room*, Konselor menyalakan **Timer Melayang**. Setelah sesi selesai, Konselor mematikan timer dan Klien langsung menekan *Leave Meeting* dari dalam *Breakout Room*. |

---

## 3. Penanganan Kendala Teknis & Kondisi Khusus (Troubleshooting)

| Kondisi Lapangan | Cara Penanganan (SOP) |
| :--- | :--- |
| **Nama Zoom Klien Tidak Sesuai** *(Misal: "iPhone" / "User")* | Operator mengirim pesan chat pribadi (*Direct Chat* dari Host ke peserta di *Waiting Room*) untuk menanyakan Kode Booking sebelum mengizinkan klien masuk ke *Main Room*. |
| **Klien Terputus Sinyal (*Disconnect*) & Masuk Lagi** | Saat klien klik ulang link Zoom 4, klien otomatis masuk kembali ke *Waiting Room*. Operator langsung memindahkannya kembali ke *Breakout Room* semula. |
| **Klien Tidak Hadir (*No-Show* > 30 Menit)** | Batas tunggu maksimal adalah **30 menit**. Jika klien tidak hadir tanpa kabar, Konselor menandai status *No-Show* dan sesi dianggap selesai (pembayaran hangus / *non-refundable*). |
| **Konselor Batal Mendadak (< H-4 Jam)** | Admin menghubungi klien via WA untuk menawarkan **Ganti Konselor** yang tersedia di jam yang sama, atau memindahkan jadwal secara gratis tanpa memotong kuota ubah jadwal klien. |

---

## 4. Rincian Tugas Lengkap (Jobdesc) Masing-Masing Peran

### A. Operator — Teknis Zoom & Pemandu Ruangan
* *Batasan Akses: Tidak memiliki akses ke Laporan Sesi maupun Laporan Pembayaran.*
1. **Memantau Jadwal Harian (Setelah H-4 Jam):** Mengecek jumlah sesi pada setiap slot jam untuk memetakan slot mandiri (1–4 sesi) dan slot *Breakout Mode* (5–10 sesi).
2. **Mengirim Pengingat Link Zoom via WA:** Mengklik tombol pintasan `wa.me` di dashboard untuk mengirimkan pengingat jadwal & link Zoom kepada Klien dan Konselor sebelum sesi dimulai.
3. **Memandu Ruang Zoom 4 (Mode Breakout):** Menyiapkan *Breakout Room*, memverifikasi nama klien di *Waiting Room*, dan melakukan *Admit 1-on-1* ke kamar konselor masing-masing.
4. **Bantuan Ubah Jadwal Darurat:** Membantu mengubah jadwal di bawah H-4 jam jika terjadi gangguan teknis pada ruang Zoom atau kendala koneksi konselor.

### B. Konselor / Psikolog — Pelaksana Konseling
* *Batasan Akses: Hanya dapat mengakses data dan laporan klien yang ditanganinya sendiri.*
1. **Melengkapi Profil & Berkas Legalitas:** Mengisi 21 data profil (biodata, spesialisasi, masa berlaku STR/SIPP) dan mengunggah 8 berkas dokumen untuk diverifikasi Admin.
2. **Mengatur Jadwal Mingguan:** Membuka ketersediaan jadwal minimal **10 sesi per minggu** (pada pilihan slot 2 jam antara 08.00–22.00 WIB), atau mengajukan status izin/cuti jika berhalangan.
3. **Persiapan Sebelum Sesi:** Membaca 8 data klien, catatan keluhan awal, serta riwayat sesi klien yang otomatis dikelompokkan sistem berdasarkan Nomor WhatsApp/Email.
4. **Pelaksanaan Sesi & Timer Melayang:** Masuk ke ruang Zoom 5–10 menit sebelum sesi, menyalakan **Timer Melayang (*Floating Timer*)** tepat saat sesi dimulai, dan mematikannya saat sesi selesai.
5. **Mengisi Laporan Sesi:** Mengisi form *Ringkasan Dinamika Sesi*, *Saran / Tindak Lanjut* (opsional), *Catatan Internal* (rahasia), dan mengunggah foto dokumentasi bukti sesi sebagai syarat pencairan komisi.

### C. Admin — Operasional, Keuangan & Follow-Up Klien
* *Batasan Akses: Tidak dapat membaca isi catatan klinis (Ringkasan Dinamika Sesi & Catatan Internal).*
1. **Verifikasi Konselor & Pantau Izin Praktik:** Memeriksa kelengkapan 21 data konselor baru dan memantau peringatan masa berlaku dokumen STR/SIPP konselor.
2. **Laporan Pembayaran & Komisi:** Memverifikasi pembayaran klien dan memantau komisi konselor (komisi siap dicairkan setelah konselor menyelesaikan Laporan Sesi).
3. **Bantuan Ubah Jadwal & Ganti Konselor:** Membantu klien yang meminta ubah jadwal via WA dan menjalankan fitur **Ganti Konselor** jika konselor utama berhalangan mendadak.
4. **Pengiriman Laporan & Follow-Up WA:** Memantau status pengisian laporan sesi (hanya melihat status & foto bukti), lalu mengklik tombol `wa.me` untuk mengirim link laporan ke klien yang otomatis mengubah status sesi menjadi **"Sudah Follow Up"**.

### D. Superadmin — Pengelola Utama & Pengaturan Sistem
* *Batasan Akses: Akses penuh ke seluruh modul, pengaturan sistem, dan audit.*
1. **Mengatur Parameter Sistem:** Mengubah aturan sistem kapan saja melalui halaman Pengaturan, meliputi: batas waktu pemesanan (default: `4 jam`), batas waktu *reschedule* (default: `4 jam`), kuota maksimal per slot (default: `10 sesi`), minimal slot konselor (default: `10 sesi/minggu`), batas waktu bayar (`15–30 menit`), serta tarif dasar & tarif khusus konselor.
2. **Manajemen Akun & Integrasi Zoom:** Mengelola akun Admin, Operator, dan Konselor, mengatur konfigurasi 4 Akun Zoom Pro, serta melakukan audit operasional dan keuangan.

---

## 5. Alur Lengkap Perjalanan Klien (End-to-End Client Flow Tanpa Login)

| Tahapan Klien | Aktivitas Klien & Aturan Sistem |
| :--- | :--- |
| **1. Pilih Jadwal & Isi Data** | Memilih konselor dan jam sesi (08.00–22.00 WIB per 2 jam, maksimal H-4 jam). Mengisi 8 data diri (*Nama/Panggilan, Email, WA, Jenis Kelamin, Umur, Domisili, Agama, Keluhan*) dan mencentang kotak **Informed Consent**. |
| **2. Pembayaran & Terima Link** | Menyelesaikan pembayaran sebelum batas waktu kunci jadwal (**15–30 menit**) habis. Setelah lunas, sistem otomatis mengirim **Email berisi Tautan Halaman Sesi Klien**. |
| **3. Ubah Jadwal (Reschedule)**<br>*(Opsional — Maks. 1x)* | Dapat dilakukan maksimal **1 kali** dan paling lambat **H-4 jam** sebelum sesi melalui 2 cara: mengubah langsung di *Halaman Sesi Klien* (mandiri) atau klik tombol WA untuk dibantu Admin. |
| **4. Masuk Ruang Zoom** | Membuka *Halaman Sesi Klien*, menggunakan nama tampilan Zoom `Kode Booking - Nama Panggilan`, dan masuk tepat waktu (batas toleransi keterlambatan maksimal **30 menit**). |
| **5. Baca & Cetak Laporan (PDF)** | Setelah menerima pesan WA dari Admin bahwa laporan telah siap, klien membuka kembali *Halaman Sesi Klien*, memverifikasi dengan mengetik **Nomor WhatsApp**, lalu membaca dan menekan tombol **Cetak / Simpan sebagai PDF**. |