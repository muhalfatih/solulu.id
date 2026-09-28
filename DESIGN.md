---
name: Solulu
description: Ekosistem telekonseling kesehatan mental terpercaya dengan Dual-Surface Architecture (Admin/Operasional & Landing Solulu.id)
colors:
  primary: "oklch(0.21 0.006 285.885)"
  primary-foreground: "oklch(0.985 0 0)"
  public-primary: "#7c3aed"
  public-primary-foreground: "#ffffff"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.141 0.005 285.823)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.141 0.005 285.885)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  accent: "oklch(0.967 0.001 286.375)"
  accent-foreground: "oklch(0.21 0.006 285.885)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.92 0.004 286.32)"
  ring: "oklch(0.705 0.015 286.067)"
  healing-emerald: "#10b981"
  clinical-alert: "oklch(0.577 0.245 27.325)"
  whatsapp-green: "#25d366"
typography:
  display:
    fontFamily: "var(--font-heading), Geist, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-heading), Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-sans), Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-sans), Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-sans), Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "0.27rem"
  md: "0.36rem"
  lg: "0.45rem"
  xl: "0.75rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  button-public-primary:
    backgroundColor: "{colors.public-primary}"
    textColor: "{colors.public-primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0.75rem 1.75rem"
    height: "2.75rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
---

# Design System: Solulu (Dual-Surface Architecture)

## Overview

Solulu menerapkan **Dual-Surface Architecture** yang secara sadar membedakan bahasa visual antara area kerja operasional klinis dengan antarmuka publik/klien:

1. **Admin & Auth Surface (`app/admin`, `app/(auth)/login`) — Mode *Operate***
   - **Creative North Star: "Clinical Precision & Operational Sanctuary"**
   - Menghadirkan antarmuka kerja berdensitas tinggi (*information density*), kaku, presisi, minim distraksi, dan berbasis data tabular.
   - Menggunakan palet **Obsidian Ink** (`oklch(0.21 0.006 285.885)`), border 1px halus, sudut ringkas (`0.375rem` - `0.45rem`), tata letak layar penuh yang terkunci (`h-screen overflow-hidden`), serta tipografi teknis **Geist Sans** dengan `tabular-nums` untuk jadwal dan kode sesi.
   - Halaman Login mengusung struktur *split-screen*: kolom kiri memuat proposisi keamanan klinis & privasi (komitmen HIMPSI, enkripsi sesi), sedangkan kolom kanan memuat kartu formulir login yang terfokus dengan dukungan kredensial demo cepat.

2. **Public & Landing Surface (`app/page.tsx`, `app/booking`) — Mode *Persuade & Comfort***
   - **Creative North Star: "The Empathetic Sanctuary (#CeritaDiSolulu)"**
   - Mengacu pada identitas resmi **solulu.id**: ruang bercerita yang hangat, terbuka, bersahabat (*friendly*), dan menurunkan kecemasan (*anxiety-reducing*).
   - Menggunakan aksen **Brand Violet/Purple** (`#7C3AED` / `#8B5CF6`), latar kanvas hangat bertint lavender lembut (`#fcfbfe`), kurva ramah (`rounded-2xl` untuk kartu dan `rounded-full` untuk badge pill & tombol CTA), serta tipografi perpaduan **Poppins** (judul/display) dan **Inter** (teks isi).
   - Menampilkan 4 pilar kepercayaan utama (*Appointment < 24 jam*, *100% Rahasia*, *Konselor & Psikolog*, *Solutif*), paket harga transparan (Single Rp 85k, Psikolog Rp 130k, Paket 3 Sesi Rp 225k), ulasan testimoni anonim, dan widget bantuan WhatsApp. Skrining mandiri SRQ-20 ditempatkan secara terarah pada alur booking (bukan di landing page), dan tidak menampilkan tautan panggilan darurat 119.

**Key Characteristics:**
- **Zero Cross-Contamination**: Gaya publik solulu.id (warna ungu, sudut bulat besar, font Poppins) tidak boleh merembes ke panel admin; demikian pula kekakuan tabular admin tidak boleh membuat landing page terasa dingin atau steril.
- **Scoped CSS Theming**: Pengendalian token menggunakan wrapper `.theme-admin` dan `.theme-public` pada level layout masing-masing surface.
- **Cognitive Safety**: Pesan ramah dan bebas stigma, kontras WCAG AA (≥4.5:1), tanpa ilustrasi doodle kartun murahan yang mendegradasi isu kesehatan mental.

## Colors

Palet warna Solulu dibagi menjadi dua spektrum fungsional:

### Admin & Auth Surface (Mode Operate)
- **Obsidian Ink (Primary):** `oklch(0.21 0.006 285.885)` (Light) / `oklch(0.92 0.004 286.32)` (Dark). Digunakan untuk aksi utama, tombol simpan, header tabel, dan status kunci.
- **Calming Slate Surface (Secondary):** `oklch(0.967 0.001 286.375)` (Light) / `oklch(0.274 0.006 286.033)` (Dark). Latar sel tabel, kartu metrik sekunder, dan pill filter.
- **Healing Emerald (Tertiary Status):** `#10b981`. Aksen hijau penanda kesiapan 2 akun Zoom Pro, status pembayaran lunas, dan verifikasi konselor aktif.
- **Clinical Alert Rose (Destructive):** `oklch(0.577 0.245 27.325)`. Khusus indikasi risiko tinggi skrining SRQ-20 pada rekam medis dan pembatalan janji temu.
- **Clinical Warning Amber:** `#f59e0b`. Penanda batas waktu invoice pembayaran 15 menit dan verifikasi berkas tertunda.

### Public & Landing Surface (Mode Persuade — Solulu.id Reference)
- **Solulu Violet (Primary Brand):** `#7c3aed` (Violet 600) / `#6d28d9` (Hover). Warna identitas utama brand, tombol "Mulai Cerita", dan highlight tagar `#CeritaDiSolulu`.
- **Soft Lavender Glow (Brand Accent):** `#8b5cf6` (Violet 500) dan `#f5f3ff` (Violet 50). Latar badge kapsul, highlight kartu aktif, dan gradien lembut.
- **Warm Canvas Neutral:** `#fcfbfe` (Light) / `#0f0c1b` (Dark). Latar belakang viewport publik yang hangat dan tidak menyilaukan mata.
- **WhatsApp Emerald:** `#25d366`. Widget chat mengambang dan tombol kontak konsultasi langsung.
- **Text Primary & Muted:** `#1f2937` (Gray 800) untuk keterbacaan judul utama dan `#4b5563` (Gray 600) untuk penjelasan paragraf.

### Named Rules
**The Surface Isolation Rule.** Dilarang mencampur token warna ungu `#7c3aed` ke dalam tabel atau form dashboard admin, dan dilarang menggunakan warna hitam kaku `oklch(0.21 0.006 285.885)` sebagai warna tombol utama landing page.

**The Strict Contrast Rule.** Seluruh pasangan teks dan latar belakang wajib memenuhi rasio kontras WCAG AA (≥4.5:1 untuk body text, ≥3:1 untuk headline).

## Typography

### Admin & Auth Surface
- **Font Stack:** Geist Sans (`--font-sans`), dengan fallback `system-ui, -apple-system, sans-serif`.
- **Fitur Kritis:** Seluruh tabel data, jam operasional WIB, dan kode sesi wajib menyertakan kelas OpenType `tabular-nums`.
- **Skala:**
  - Display: `2rem` (32px), Bold 700, line-height 1.2
  - Headline: `1.5rem` (24px), SemiBold 600, line-height 1.3
  - Title: `1rem` (16px), SemiBold 600, line-height 1.4
  - Body: `0.875rem` (14px), Regular 400, line-height 1.5
  - Label: `0.75rem` (12px), Medium 500, line-height 1.4

### Public & Landing Surface (Solulu.id Reference)
- **Display & Headline Font:** Poppins (`--font-heading`, `--font-poppins`), dengan fallback sans-serif.
- **Body & Label Font:** Inter (`--font-sans`, `--font-inter`), dengan fallback sans-serif.
- **Karakter:** Hangat, bersahabat, terbuka, dan memiliki kepribadian empatik tinggi.
- **Skala:**
  - Hero Headline: `clamp(2rem, 5vw, 3.5rem)`, Bold 700, line-height 1.15
  - Section Title: `clamp(1.5rem, 3.5vw, 2.25rem)`, SemiBold 600, line-height 1.25
  - Card Title: `1.125rem` (18px), SemiBold 600
  - Body Text: `1rem` (16px) / `0.9375rem` (15px), Regular 400, line-height 1.6
  - Badge / Tag: `0.8125rem` (13px), Medium 500

### Named Rules
**The Dual Typography Rule.** Font Poppins hanya aktif pada heading permukaan publik `.theme-public`. Permukaan kerja operasional `.theme-admin` wajib mempertahankan font Geist Sans demi ketajaman pemindaian data.

**The Cognitive Comfort Rule.** Paragraf pada landing page maupun catatan admin tidak boleh menggunakan line-height lebih rapat dari 1.5, dengan panjang baris optimal 55–75 karakter per baris.

## Layout

### Admin Viewport Shell (`app/admin`)
- **Struktur Shell:** Layar penuh terkunci (`h-screen overflow-hidden`) yang terbagi menjadi bilah sisi (*dock sidebar*) dan kanvas kerja dengan area gulir mandiri (`overflow-y-auto`).
- **Sidebar Dock:** Lebar dinamis `w-64` (256px) saat terbuka dan `w-18` (72px) saat diciutkan (*collapsed*).
- **Kontainer Data:** Lebar maksimum `max-w-6xl` dengan padding responsif `p-4 sm:p-6 md:p-8`.

### Auth Split Shell (`app/(auth)/login`)
- **Struktur Layar:** Pembagian 50/50 pada layar desktop (`lg:flex-row`).
- **Kolom Kiri (Branding & Trust):** Berisi identitas Solulu, pernyataan etika HIMPSI, kartu komitmen privasi (ADR-0001), dan proteksi Zoom 2-host (ADR-0002).
- **Kolom Kanan (Formulir Masuk):** Header dengan navigasi kembali ke beranda, kartu formulir ringkas, tombol cepat akun demo (*quick fill*), dan toggle mode gelap.

### Public Landing Layout (`app/page.tsx`)
- **Struktur Vertikal:** Multi-seksi berirama lega dengan padding vertikal besar (`py-16` hingga `py-24`).
- **Kontainer Publik:** `max-w-6xl` terpusat (`mx-auto px-4 sm:px-6 lg:px-8`).
- **Seksi Standar Solulu.id:**
  1. Sticky Navbar dengan link seksi dan CTA "Mulai Cerita".
  2. Hero Section dengan badge "Ruang Aman untuk Cerita", headline #CeritaDiSolulu, dan 4 Trust Pills.
  3. Alasan Solulu (Kenapa Kami): Empati, Terjangkau, Fleksibel, Privasi.
  4. Paket & Biaya Konseling: Single (Rp 85k), Psikolog (Rp 130k), Paket 3 Sesi (Rp 225k).
  5. Showcase Konselor & Partner Cerita.
  6. Ulasan & Testimoni Klien.
  7. Komitmen Privasi & FAQ.
  8. Footer & Floating WhatsApp Widget.

### Named Rules
**The Persistent Dock Rule.** Navigasi sidebar admin wajib mempertahankan posisinya tanpa terdorong keluar layar saat tabel data yang panjang digulir.

## Elevation & Depth

- **Admin Surface:** Menganut prinsip **Flat-By-Default**. Kedalaman diciptakan melalui kontras warna bidang (`bg-background` ke `bg-card` ke `bg-muted`) dan border presisi 1px (`border-border`). Bayangan hanya digunakan pada modal Command Palette (`⌘K`) dan dropdown menu.
- **Public Surface:** Menganut prinsip **Soft Layered Ambient**. Kartu layanan dan kartu konselor menggunakan bayangan sangat lembut (`shadow-sm` hingga `shadow-md` dengan rona transparan `rgba(124, 58, 237, 0.04)`), memberikan kesan mengapung yang ramah saat disentuh atau di-hover.

### Named Rules
**The Anti-Neobrutalism Rule.** Dilarang menggunakan bayangan kaku dengan offset tebal (misal `box-shadow: 4px 4px 0`) di seluruh permukaan aplikasi.

## Shapes

- **Admin Controls & Cards:** Sudut fungsional dan tegas (`rounded-md` / 6px untuk tombol dan input; `rounded-xl` / 12px untuk kartu modul).
- **Public Controls & Cards:** Sudut organik dan membulat lembut (`rounded-2xl` / 16px untuk kartu paket & testimoni; `rounded-full` / 9999px untuk tombol CTA dan trust pills).

### Named Rules
**The Full-Radius Pill Rule.** Tombol berbentuk kapsul penuh (`rounded-full`) adalah ciri khas landing page solulu.id dan tidak boleh digunakan untuk tombol aksi operasional di tabel admin.

## Components

### 1. Primary Buttons
- **Admin:** `h-9 px-4 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90`.
- **Public Solulu:** `h-11 px-6 text-sm font-semibold rounded-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-sm hover:shadow transition-all`.

### 2. Trust Pills & Telemetry Badges
- **Admin Telemetry:** `rounded-full px-2.5 py-1 text-xs border border-border bg-muted/50` dengan indikator lampu berkedip hijau untuk status Zoom 2-host.
- **Public Trust Pill:** `rounded-full px-3.5 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 flex items-center gap-1.5`.

### 3. Cards & Modules
- **Admin Metric Card:** Latar `bg-card`, border `border-border`, padding `p-5`, sudut `rounded-xl`, tipografi angka berukuran `text-2xl font-bold tabular-nums`.
- **Public Pricing Card:** Latar putih bersih dengan border halus `border-violet-100`, sudut `rounded-2xl`, aksen badge "Populer", rincian manfaat dengan checkmark ungu, dan tombol reservasi.

### 4. Search & Command Trigger
- **Admin Header Search:** Trigger `⌘K` dengan input semi-transparan, border tipis, dan kueri keyboard monospace.

### 5. Floating Action Widget
- **Public WhatsApp Button:** Lingkaran hijau `#25d366` di sudut kanan bawah dengan ikon pesan dan tooltip ramah "Chat Sekarang".

## Do's and Don'ts

### Do:
- **Do** gunakan bahasa Indonesia yang hangat, profesional, dan empatik di seluruh antarmuka ("Mitra Konselor", "Ruang Cerita", "Konseling Online").
- **Do** terapkan scoped theme `.theme-admin` pada rute admin/auth dan `.theme-public` pada landing page.
- **Do** pastikan skrining SRQ-20 hanya tampil saat klien masuk ke alur booking spesifik, bukan di landing page utama.
- **Do** gunakan format mata uang Rupiah (IDR) dan satuan waktu WIB secara konsisten.
- **Do** sediakan akun demo cepat (*quick-fill*) pada halaman login untuk mempermudah evaluasi operasional.

### Don'ts:
- **Don't** menampilkan link, tombol, atau nomor kontak panggilan darurat 119 di landing page maupun admin (sesuai instruksi kebijakan revisi).
- **Don't** membocorkan warna Violet `#7c3aed` atau font Poppins ke dalam dashboard admin.
- **Don't** menggunakan form skrining mandiri yang panjang secara mendadak di halaman beranda.
- **Don't** menggunakan efek bayangan tebal neobrutalisme atau gradien warna neon yang mengaburkan fokus pengguna.
