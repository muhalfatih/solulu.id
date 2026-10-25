# Modul 02: Metode Pembayaran, Verifikasi Transaksi & Siklus Voucher

> **Dokumen Spesifikasi Gerbang Pembayaran, Verifikasi Admin, Bypass Rp0 & Rekapitulasi Komisi**  
> Bagian dari: **Dokumen Master Solulu (alur-booking-dan-jobdesk)**  
> Klasifikasi: **Panduan Keuangan, Administrasi & Transaksi Klien**

---

## 1. Tiga Model Pembayaran di Solulu

Untuk memberikan kenyamanan maksimal bagi klien dari berbagai latar belakang, Solulu menyediakan **3 jalur transaksi** yang terkelola rapi di dalam sistem:

```mermaid
flowchart TD
    %% Styling Palette
    classDef client fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef auto fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef manual fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef bypass fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#92400e;

    Start[Klien di Halaman Checkout] --> Choice{Pilih Jalur Transaksi}
    
    %% JALUR 1: OTOMATIS
    Choice -->|Jalur 1: Instan Otomatis| Xendit[Payment Gateway Xendit<br/>QRIS, Virtual Account, e-Wallet]
    Xendit --> Webhook[Webhook Callback Otomatis]
    Webhook --> FulfillAuto[Sistem Fulfillment Otomatis<br/>Status: CONFIRMED]
    
    %% JALUR 2: MANUAL
    Choice -->|Jalur 2: Transfer Manual| Bank[Transfer Bank BCA Klinik<br/>Klien Unggah Foto Bukti Transfer]
    Bank --> AdminReview[Antrean Verifikasi di Panel Admin<br/>Status: PENDING]
    AdminReview --> AdminDecision{Admin Cek Mutasi Bank}
    AdminDecision -->|Cocok & Sah| Approve[Admin Klik 'Verifikasi'<br/>Status: VERIFIED]
    AdminDecision -->|Salah / Tidak Masuk| Reject[Admin Tolak Bukti &<br/>Hubungi Klien via WA]
    Approve --> FulfillAuto
    
    %% JALUR 3: BYPASS
    Choice -.->|Jalur 3: Khusus Internal| Bypass[Booking Bypass Admin<br/>Beasiswa / CSR / Rujukan Darurat]
    Bypass --> AdminBypass[Admin Input di Dashboard<br/>Net Amount: Rp 0 + Catatan Alasan]
    AdminBypass --> FulfillAuto

    class Start,Choice client;
    class Xendit,Webhook,FulfillAuto auto;
    class Bank,AdminReview,AdminDecision,Approve,Reject manual;
    class Bypass,AdminBypass bypass;
```

---

## 2. Jalur 1: Pembayaran Instan Otomatis (Xendit Gateway)

Jalur pembayaran otomatis dirancang untuk konfirmasi instan tanpa campur tangan manusia.

* **Kanal Pembayaran Tersedia:**
  * **QRIS Real-Time:** Mendukung semua aplikasi e-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja) dan Mobile Banking berlogo QRIS.
  * **Virtual Account (VA):** BCA, Mandiri, BNI, BRI, Permata Bank (nomor VA unik per pesanan).
  * **Kartu Kredit / Debit:** Visa, MasterCard, JCB dengan autentikasi 3D Secure.
* **Masa Berlaku Invoice:** Tepat **15 Menit** sejak dibuat.
* **Mekanisme Eksekusi (Webhook & QStash Worker):**  
  Ketika pembayaran terdeteksi lunas oleh Xendit:
  1. Xendit mengirimkan sinyal *HTTP Webhook Callback* ke `/api/webhooks/xendit`.
  2. Webhook segera merespons status `200 OK` dan mendelegasikan tugas pemenuhan (*session fulfillment*) ke antrean pesan **Upstash QStash** untuk mencegah kendala batas waktu koneksi (*timeout*).
  3. Pekerja (*worker*) QStash mengubah status pesanan menjadi `confirmed`, mengunci slot jadwal menjadi `booked`, mengalokasikan akun Zoom Pro klinik, dan menerbitkan email tanda terima serta tautan sesi mandiri ke klien.

---

## 3. Jalur 2: Transfer Bank Manual ke Rekening Klinik

Bagi klien yang mengalami kendala transaksi digital atau lebih memilih transfer langsung antar-bank:

### A. Prosedur Pembayaran Klien
1. Pada halaman checkout, klien memilih opsi **"Transfer Bank Manual"**.
2. Sistem menampilkan nomor rekening resmi klinik:
   * **Bank:** BCA (Bank Central Asia)
   * **Nomor Rekening:** `123-456-7890` (atau sesuai konfigurasi Admin)
   * **Atas Nama:** Solulu Mental Health Indonesia
   * **Berita Transfer:** Wajib mencantumkan **Kode Booking** (contoh: `SL-4821`).
3. Klien mentransfer nominal tepat, lalu mengambil tangkapan layar / foto struk transfer.
4. Klien mengunggah file bukti transfer pada form web, lalu menekan **"Kirim Bukti Pembayaran"**.

### B. Prosedur Verifikasi oleh Tim Admin
Tangkapan layar bukti transfer masuk ke antrean verifikasi Admin di `/admin/transactions`:

```mermaid
sequenceDiagram
    autonumber
    actor Klien
    actor Admin
    participant App as Platform Solulu
    participant R2 as Cloudflare R2 (Private Bucket)
    participant DB as PostgreSQL DB

    Klien->>App: Unggah Bukti Transfer (JPG/PNG/PDF)
    App->>R2: Simpan Dokumen Terenkripsi di solulu-private
    App->>DB: Set status transaksi PENDING, manualPaymentStatus PENDING
    App-->>Klien: Tampilkan Halaman Menunggu Verifikasi Admin
    
    Admin->>App: Buka Panel Transaksi & Klik 'Lihat Bukti'
    App-->>Admin: Tampilkan Foto Bukti & Detail Mutasi
    Admin->>Admin: Cek Mutasi m-Banking BCA Klinik
    
    alt Bukti Sah & Mutasi Masuk
        Admin->>App: Klik Tombol 'Verifikasi Pembayaran'
        App->>DB: UPDATE transactions SET status='PAID', manualPaymentStatus='VERIFIED'
        App->>DB: UPDATE bookings SET status='confirmed'
        App->>DB: Alokasikan Akun Zoom & Kirim Email Tautan Sesi ke Klien
        App-->>Admin: Tampilkan Notifikasi Sukses
    else Bukti Palsu / Kurang Bayar / Tidak Terbaca
        Admin->>App: Klik Tombol 'Tolak Bukti' & Masukkan Alasan
        App->>DB: UPDATE manualPaymentStatus='REJECTED'
        Admin->>Klien: Hubungi Klien via Tombol WhatsApp wa.me
    end
```

> [!IMPORTANT]
> **SOP Keamanan Verifikasi Admin:**
> * Admin **wajib mencocokkan** mutasi rekening koran nyata di m-Banking klinik, bukan hanya mengandalkan keaslian visual foto struk.
> * Verifikasi manual harus diproses dalam waktu maksimal **30 menit** pada jam operasional agar tidak melewati batas waktu persiapan sesi.

---

## 4. Jalur 3: Booking Manual / Bypass Admin (Net Rp 0)

Dalam situasi kemanusiaan atau operasional darurat tertentu, Admin memiliki wewenang membuat pesanan konseling langsung tanpa pembayaran (*Admin Bypass*):

### Kondisi yang Memenuhi Syarat Bypass:
1. **Beasiswa Kesehatan Mental:** Klien terpilih dalam program beasiswa atau subsidi yayasan mitra.
2. **Krisis & Rujukan Khusus:** Kasus kedaruratan emosional rujukan rumah sakit atau konselor senior tanpa pungutan biaya (*pro-bono*).
3. **Penjadwalan Pengganti Darurat:** Kompensasi atas gangguan teknis sistem sebelumnya yang membutuhkan pembuatan sesi pengganti.

### Mekanisme Sistem Bypass:
* Admin membuka menu `/admin/bookings/new` dan memilih opsi **"Bypass Pembayaran (Rp 0)"**.
* Transaksi dicatat resmi di database dengan nilai bersih `netAmount: 0` dan `status: PAID`.
* Admin **wajib menginput Catatan Alasan Bypass** (contoh: *"Rujukan Beasiswa Mahasiswa Batch 3"* atau *"Kompensasi Gangguan Zoom Slot 2"*) untuk keperluan audit laporan keuangan internal.
* Pasca-pembuatan, sesi langsung didelegasikan ke modul *Session Fulfillment* sehingga alokasi Zoom dan pengiriman email link sesi berjalan otomatis sama persis seperti pesanan berbayar.

---

## 5. Siklus Hidup Voucher Diskon & Proteksi Kuota

Solulu mendukung penggunaan kode promo dan voucher diskon (potongan harga nominal tetap maupun persentase). Untuk mencegah manipulasi kuota dan *race conditions*, siklus hidup voucher diatur secara atomik:

```mermaid
stateDiagram-v2
    [*] --> Tersedia: Superadmin Terbitkan Voucher

    Tersedia --> Terkunci_Hold: Klien Pakai Voucher di Form Booking
    note right of Terkunci_Hold
        usedCount bertambah +1
        bersamaan saat jadwal di-hold
    end note

    Terkunci_Hold --> Digunakan_Permanen: Klien Sukses Bayar Sebelum 15 Menit
    note right of Digunakan_Permanen
        Transaksi Lunas (PAID)
        Diskon tercatat di Laporan Keuangan
    end note

    Terkunci_Hold --> Rollback_Tersedia: Klien Batal / Waktu Bayar Habis (>15 Menit)
    note right of Rollback_Tersedia
        Cron QStash otomatis mengembalikan
        usedCount berkurang -1
    end note

    Rollback_Tersedia --> Tersedia: Kuota Terbuka Kembali

    Digunakan_Permanen --> [*]
```

### Tabel Perbandingan Perhitungan Diskon Voucher

| Tipe Diskon | Nilai Pengaturan | Biaya Asli | Diskon Terpotong | Biaya Bersih (*Net*) |
| :--- | :---: | :---: | :---: | :---: |
| **Nominal Tetap (*Fixed*)** | `Rp 50.000` | Rp 150.000 | - Rp 50.000 | **Rp 100.000** |
| **Persentase (*Percentage*)** | `20%` | Rp 150.000 | - Rp 30.000 | **Rp 120.000** |
| **Gratis Penuh (*100% Promo*)** | `100%` | Rp 150.000 | - Rp 150.000 | **Rp 0** |

---

## 6. Rekapitulasi Pembayaran & Audit Komisi Konselor

Sistem Solulu mengadopsi prinsip **Decoupled Payroll Architecture**:
* Sistem menyajikan data audit transaksi dan durasi konsultasi secara transparan.
* Perhitungan komisi konselor disajikan siap ekspor pada menu **Laporan Pembayaran & Komisi** (`/admin/payouts`).
* Komisi mitra konselor baru berstatus **"Siap Dicairkan (*Eligible for Payout*)"** apabila konselor telah menuntaskan kewajiban administratif, yaitu **mengisi Laporan Sesi Klinis dan mengunggah foto bukti kehadiran**.

### Matriks Status Transaksi & Dampak Operasional

| Status Transaksi | Status Jadwal | Tautan Sesi Klien | Hak Komisi Konselor | Tindakan Lanjutan |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING` | `reserved` | Belum Aktif | Belum Ada | Menunggu pembayaran / verifikasi struk admin. |
| `PAID` | `booked` | Aktif Permanen | Menunggu Sesi Selesai | Ruang Zoom dialokasikan, sesi siap dijalankan. |
| `EXPIRED` | `available` | Batal / Hangus | Tidak Ada | Waktu bayar habis, slot dilepas kembali. |
| `FAILED` | `available` | Batal / Hangus | Tidak Ada | Transaksi gateway gagal, slot dilepas kembali. |

---

## 7. Tampilan Antarmuka Panel Verifikasi Pembayaran Admin

Berikut adalah tampilan nyata menu verifikasi pembayaran dan administrasi konselor di panel Admin Solulu:

### Antarmuka Verifikasi Data & Pengaturan Tarif Mitra
Admin dapat memeriksa keaslian data, mengatur tarif dasar, serta memantau histori transaksi setiap konselor:
![Verifikasi Konselor](file:///home/muhalfatih/solulu-web/alur-booking-dan-jobdesk/screenshots/11-admin-verifikasi-konselor.png)

---
*Langkah berikutnya mengenai penanganan situasi darurat, pembatalan, dan toleransi keterlambatan dijelaskan pada [Modul 03: Kondisi Khusus, Pembatalan & Kehadiran](file:///home/muhalfatih/solulu-web/alur-booking-dan-jobdesk/03-kondisi-khusus-pembatalan-dan-kehadiran.md).*
