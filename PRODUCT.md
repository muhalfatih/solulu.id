# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Calon Klien / Pasien (Utama):** Individu di Indonesia yang mengalami stres, kecemasan, kelelahan mental, atau masalah emosional dan membutuhkan layanan konseling mental profesional yang terjangkau, cepat (*frictionless* tanpa registrasi akun), serta terjamin kerahasiaan identitas dan privasinya.
- **Mitra Konselor & Psikolog:** Praktisi kesehatan mental berizin/berpengalaman yang menyediakan slot waktu konseling terjadwal, membutuhkan manajemen sesi yang tertib, serta pencatatan rekam medis (*clinical notes*) yang privat dan aman.
- **Admin Operasional:** Pengelola operasional platform yang mengawasi alokasi 2 akun Zoom independen dengan mekanisme penguncian (*safety lock*), memverifikasi kelayakan mitra konselor, mengelola kupon voucher dan tarif flat, serta memoderasi galeri publik.

## Product Purpose

Menyediakan ekosistem telekonseling kesehatan mental yang mudah diakses, ramah di kantong, dan bebas hambatan birokrasi bagi masyarakat Indonesia, sekaligus beroperasi secara mandiri di atas arsitektur *zero-cost server* (Rp 0/bulan) yang memanfaatkan kuota gratis layanan modern (Next.js, Supabase, Cloudflare R2, Upstash QStash, Resend, dan Xendit). 

Ukuran keberhasilan adalah ketika pasien dapat memilih konselor, menyelesaikan skrining klinis awal, membayar instan, dan masuk ke ruang telekonseling privat tanpa kendala teknis ataupun kekhawatiran kebocoran data.

## Positioning

Satu-satunya platform telekonseling kesehatan mental Indonesia berbasis web yang mengusung *guest-first booking* (pasien tidak wajib membuat akun), dipersenjatai dengan:
1. *Dynamic Zoom Host Dispatcher with Concurrency Locking* yang mengelola 2 akun Zoom Pro pribadi secara otomatis tanpa risiko *double booking*.
2. Skrining klinis mandiri SRQ-20 dengan deteksi dini krisis/ide bunuh diri (*suicidal ideation*) dan *Emergency Clinical Waiver Modal*.
3. Pemisahan fisik data mutlak (*Dual-Bucket Cloudflare R2*) untuk melindungi dokumen legal dan catatan rekam medis dari paparan publik.

## Operating Context

- **Situasi Pasien:** Pasien sering mengakses platform dalam kondisi lelah mental, cemas, atau krisis melalui smartphone atau laptop pribadi. Membutuhkan proses pemesanan yang cepat, pembayaran lokal (QRIS, e-Wallet, Virtual Account via Xendit), serta tautan akses sesi unik (`/session/[token]`) yang dikirim ke email dan dapat dipulihkan mandiri di `/cek-sesi`.
- **Standar Waktu & Satuan:** Seluruh jadwal beroperasi pada Waktu Indonesia Barat (WIB / UTC+7) dengan mata uang Rupiah (IDR). Sesi konseling berdurasi standar 60 menit per sesi.
- **Operasional Konselor & Admin:** Diakses via desktop/tablet melalui dashboard terotentikasi untuk membuka slot jadwal, mengambil tautan konselor (*Zoom start URL*), serta mencatat rekam medis pasca-sesi.

## Capabilities and Constraints

- **Pemesanan Tamu & Slot Locking:** Pemilihan slot waktu menerapkan *atomic reservation hold* 15 menit saat proses transaksi Xendit untuk mengunci slot secara adil dan mencegah bentrok.
- **Batas Keras 2 Sesi Bersamaan (*Concurrency Guard*):** Karena keterbatasan 2 akun Zoom Pro, sistem hanya mengizinkan maksimal 2 sesi aktif (`reserved`/`confirmed`) pada jam yang sama di seluruh platform. Slot ke-3 pada jam tersebut otomatis disembunyikan dari katalog publik.
- **Skrining Klinis SRQ-20 & Protokol Darurat:** 20 pertanyaan skrining mandiri. Jika butir terkait ide bunuh diri terindikasi positif, sistem wajib memunculkan modal persetujuan darurat (*waiver*) dan menampilkan nomor kontak krisis darurat (Hotline 119 / Layanan Sejiwa).
- **Arsitektur Zero-Cost & Anti-Timeout:**
  - Webhook Xendit dieksekusi secara asinkron terpisah (*decoupled*) dengan respons cepat (< 1 detik) ke Xendit, mendelegasikan pembuatan meeting Zoom dan pengiriman email ke Upstash QStash worker demi mematuhi batas 10 detik Vercel Hobby.
  - Unggah dokumen konselor dan rekam medis dilakukan langsung ke Cloudflare R2 melalui Presigned PUT URL guna menghindari batasan ukuran payload 4.5 MB Vercel.
  - Gambar dari Cloudflare R2 wajib menggunakan atribut `unoptimized={true}` untuk menghemat kuota optimasi gambar Vercel.
- **Pemisahan Dual-Bucket:**
  - `solulu-public`: Avatar konselor dan galeri dokumentasi sesi (akses via Edge CDN).
  - `solulu-private`: KTP, Ijazah, STR konselor, dan lampiran rekam medis (akses via Presigned GET URL berdurasi 15 menit).

## Brand Commitments

- **Nama & Identitas:** Solulu (Solulu.id).
- **Bahasa & Nada Komunikasi:** Bahasa Indonesia. Hangat, empatik, menenangkan, profesional, dan bebas stigma. Istilah klinis, privasi medis, dan persetujuan tindakan (*informed consent*) disajikan secara transparan dan mudah dipahami orang awam.
- **Integritas Privasi:** Menghormati kerahasiaan penuh pengguna tanpa meminta data berlebih yang tidak relevan dengan kebutuhan klinis.

## Evidence on Hand

- **Spesifikasi Arsitektur Master:** [prd.md](file:///home/muhalfatih/solulu-web/prd.md) (Dokumen Nomor 008/PRD-MASTER/SOLULU/IX/2026 versi 8.2, mencakup skema Drizzle ORM lengkap, server actions, alur webhook Xendit, dan proteksi middleware).
- **Komitmen Fakta:** Tidak menggunakan data testimoni palsu, foto konselor fiktif, atau klaim medis yang tidak terverifikasi. Seluruh konselor di katalog wajib memiliki bukti kualifikasi riil.

## Product Principles

1. **Frictionless Empathy:** Menghilangkan setiap hambatan pendaftaran yang tidak perlu bagi pasien yang sedang membutuhkan pertolongan emosional.
2. **Uncompromising Clinical Privacy:** Menempatkan keamanan rekam medis dan privasi klien di atas segalanya melalui isolasi infrastruktur yang ketat.
3. **Safety-First Clinical Triage:** Mengutamakan keselamatan jiwa pasien dengan mendeteksi indikasi krisis sebelum sesi dan menyediakan rujukan darurat yang jelas.
4. **Resilient Zero-Cost Engineering:** Memaksimalkan keandalan sistem berstandar tinggi melalui pola asinkron yang cerdas tanpa membebani biaya server bulanan.

## Accessibility & Inclusion

- Desain antarmuka yang mengutamakan kemudahan navigasi perangkat seluler (*mobile-first*).
- Kontras warna yang memenuhi standar WCAG AA dengan nuansa visual yang menenangkan (*calming & grounding*).
- Form pemesanan dan skrining ramah kognitif dengan petunjuk yang jelas, pesan kesalahan yang membantu, serta dukungan navigasi keyboard penuh.
