---
name: Solulu
description: Ekosistem telekonseling kesehatan mental yang mudah diakses, ramah di kantong, dan bebas hambatan birokrasi
colors:
  primary: "oklch(0.21 0.006 285.885)"
  primary-foreground: "oklch(0.985 0 0)"
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
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "0.27rem"
  md: "0.36rem"
  lg: "0.45rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
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

# Design System: Solulu

## Overview

**Creative North Star: "The Grounding Sanctuary"**

Solulu dirancang sebagai ruang digital yang menenangkan, empatik, hangat, dan stabil bagi masyarakat Indonesia yang sedang mengalami tekanan psikologis maupun membutuhkan pertolongan klinis. Setiap permukaan visual memancarkan ketenangan (*grounding*), menepis rasa intimidasi birokrasi medis, dan memprioritaskan privasi serta rasa aman pengguna sejak detik pertama interaksi.

Sebagai sistem telekonseling dengan batas konkurensi 2 ruang Zoom pribadi dan skrining klinis mandiri SRQ-20, antarmuka dirancang dalam mode **Operate** untuk konselor dan admin, serta **Persuade** yang empatik untuk pasien tamu. Desain menghindari estetika rumah sakit yang steril dan dingin tanpa tergelincir ke dalam ornamen dekoratif kartun yang meremehkan masalah kesehatan mental nyata.

**Key Characteristics:**
- **Calming & Grounding Tone**: Nuansa visual yang menurunkan tingkat kecemasan dengan kontras warna lembut berstandar WCAG AA.
- **Refined & Restrained Layering**: Arsitektur permukaan datar berbasis border halus 1px dan tonal contrast tanpa bayangan berat.
- **Cognitive Clarity**: Tipografi sans-serif modern yang terstruktur, bebas jargon berbelit, dan mudah dipindai dalam kondisi mental lelah.
- **Safety-First Clinical Triage**: Penandaan visual status risiko tinggi (SRQ-20 ide bunuh diri) yang tegas namun tidak menghakimi atau memicu kepanikan.

## Colors

Palet warna Solulu mengusung harmoni **Obsidian Ink & Healing Emerald**, memadukan dasar monokromatik lembut dengan aksen hijau teduh untuk memberikan sinyal stabilitas, kesembuhan, dan keandalan sistem telekonseling.

### Primary
- **Obsidian Ink** (`oklch(0.21 0.006 285.885)` / Mode Terang; `oklch(0.92 0.004 286.32)` / Mode Gelap): Warna primer yang berbobot dan tenang, digunakan untuk tombol aksi utama, navigasi kunci, dan teks penting dengan tingkat ketegasan tinggi.

### Secondary
- **Calming Surface / Neutral Soft** (`oklch(0.967 0.001 286.375)` / Mode Terang; `oklch(0.274 0.006 286.033)` / Mode Gelap): Warna permukaan sekunder untuk latar kartu pelengkap, pill indikator, dan hover interaktif.

### Tertiary
- **Healing Emerald** (`#10b981` / `rgb(16 185 129)`): Aksen hijau vitalitas penanda status koneksi aman, ruang telekonseling Zoom yang siap/aktif, dan verifikasi berkas tervalidasi.
- **Clinical Alert Rose** (`oklch(0.577 0.245 27.325)`): Aksen klinis khusus untuk indikasi risiko tinggi skrining SRQ-20, status darurat pasien, dan pembatalan sesi.
- **Clinical Warning Amber** (`#f59e0b`): Penanda peringatan prosedur darurat, batas waktu invoice Xendit 15 menit, dan audit berkas tertunda.

### Neutral
- **Pure Canvas** (`oklch(1 0 0)` / Mode Terang; `oklch(0.141 0.005 285.823)` / Mode Gelap): Latar dasar viewport yang bersih dan lapang.
- **Grounding Foreground** (`oklch(0.141 0.005 285.823)` / Mode Terang; `oklch(0.985 0 0)` / Mode Gelap): Teks utama berbobot tajam dengan kontras tinggi yang nyaman dibaca.
- **Muted Mist** (`oklch(0.552 0.016 285.938)` / Mode Terang; `oklch(0.705 0.015 286.067)` / Mode Gelap): Teks pendukung, label metadata, dan petunjuk formulir.
- **Subtle Outline Border** (`oklch(0.92 0.004 286.32)` / Mode Terang; `oklch(1 0 0 / 10%)` / Mode Gelap): Garis pemisah struktural 1px yang lembut tanpa kesan kotak kaku.

### Named Rules
**The Non-Intimidating Palette Rule.** Warna peringatan klinis (*Clinical Alert Rose* dan *Warning Amber*) dicadangkan secara eksklusif untuk data medis kritis (SRQ-20 > 6, suicidal ideation waiver) dan batas waktu pembayaran transaksi. Dilarang menggunakan warna merah alarm untuk pesan sistem rutin atau elemen dekoratif.

**The Calming Contrast Rule.** Seluruh pasangan warna teks dan latar wajib melampaui rasio kontras WCAG AA (≥4.5:1 untuk body text, ≥3:1 untuk display text), tanpa menggunakan kontras hitam-putih murni yang menyilaukan atau warna neon agresif yang memicu kelelahan kognitif.

## Typography

**Display, Body, & Label Font:** Geist Sans (`--font-sans`), dengan fallback `system-ui, -apple-system, sans-serif` sesuai standar preset shadcn/ui. Seluruh elemen tipografi antarmuka, heading, isi teks, hingga label dan kode sesi menggunakan Geist Sans secara seragam (dengan fitur OpenType `tabular-nums` untuk angka dan kode).

**Character:** Tipografi rasional, modern, dan sangat bersih. Memiliki proporsi geometris yang seimbang dan mudah dipindai, mendukung ketenangan pasien serta akurasi konselor dalam membaca data klinis.

### Hierarchy
- **Display** (Bold 700, `2rem` / 32px, line-height 1.2, tracking `-0.025em`): Judul utama permukaan operasional dan hero judul layanan.
- **Headline** (SemiBold 600, `1.5rem` / 24px, line-height 1.3, tracking `-0.02em`): Judul modul besar, bagian ringkasan metrik, dan heading modal krisis.
- **Title** (Medium 500 / SemiBold 600, `1rem` / 16px, line-height 1.4, tracking `-0.01em`): Judul kartu, sub-bagian formulir, dan header tabel data.
- **Body** (Regular 400, `0.875rem` / 14px, line-height 1.5, normal tracking): Paragraf deskripsi klinis, instruksi pasien, catatan konselor. Dibatasi pada panjang ideal 65–75 karakter per baris.
- **Label / Caption** (Medium 500, `0.75rem` / 12px, line-height 1.4, tracking `0.02em`): Badge status, waktu sesi WIB, kueri keyboard (`⌘K`), dan header kolom tabel.

### Named Rules
**The Cognitive Comfort Rule.** Teks isi (*body*) tidak boleh menggunakan line-height lebih rapat dari 1.4. Ruang antar baris yang lega menjaga ketenangan membaca bagi pengguna yang sedang cemas atau kelelahan mental.

**The Unadorned Heading Rule.** Dilarang menggunakan teks bergradien (*gradient text*) atau label *kicker/eyebrow* di atas judul utama. Kekuatan hirarki ditegaskan semata-mata oleh perbedaan bobot font dan skala ukuran yang terukur.

## Layout

Sistem tata letak Solulu berakar pada modularitas berbasis skala 4-unit (`0.25rem` [4px], `0.5rem` [8px], `0.75rem` [12px], `1rem` [16px], `1.5rem` [24px], `2rem` [32px]).

- **Admin Viewport Shell:** Mengunci tinggi layar penuh (`h-screen overflow-hidden`) dengan pembagian bilah samping navigasi (*dock sidebar*) dan area kerja utama yang memiliki scrollbar independen.
- **Sidebar Dock:** Lebar standar `w-64` (256px) saat diperluas dan `w-18` (72px) saat diperkecil (*collapsed*), memberikan efisiensi ruang horizontal bagi layar kerja 13-16 inci.
- **Kontainer Data Operasional:** Batas maksimum konten `max-w-6xl` dengan padding responsif `p-6 md:p-8`, memastikan scannability data jadwal dan metrik tidak melebar tak berujung pada monitor ultra-wide.
- **Mobile Adaptation:** Pada viewport `< 768px`, bilah navigasi bertransformasi menjadi *sticky header* `h-14` dengan drawer samping penuh berlatar peredup (*backdrop blur*).

### Named Rules
**The Stable Horizon Rule.** Elemen navigasi operasional dan status telemetri kritis (ketersediaan 2 ruang Zoom, akses hotline krisis) wajib berada dalam jangkauan pandang tetap (*viewport-pinned*) dan dilarang terdorong keluar layar saat pengguna membaca tabel panjang.

## Elevation & Depth

Solulu menganut filosofi kedalaman **Refined & Restrained (Subtle Layering)**. Permukaan antarmuka bersifat datar secara default (*flat at rest*), dengan kedalaman yang dihadirkan melalui kontras tonal latar belakang dan garis batas (*subtle border* 1px).

### Shadow Vocabulary
- **Surface Rest** (`box-shadow: none`, `border: 1px solid var(--border)`): Kedalaman standar kartu, tabel, dan form input.
- **Ambient Micro** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Diterapkan pada kartu ringkasan metrik dan tombol outline untuk memisahkannya secara halus dari kanvas dasar.
- **Floating Overlay** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): Digunakan secara eksklusif untuk modal Command Palette (`⌘K`) dan Modal Protokol Darurat Klinis yang membutuhkan fokus isolasi penuh.

### Named Rules
**The Ghost Elevation Rule.** Hindari penggunaan drop shadow tebal (seperti `box-shadow: 4px 4px 0` neobrutalisme atau bayangan kabur lebar berwarna). Pemisahan bidang antarmuka dicapai melalui kontras latar bertingkat (`bg-background` ke `bg-card` ke `bg-muted`) serta garis tepi 1px presisi.

## Shapes

Bahasa bentuk Solulu mengedepankan kurva sudut yang lembut dan bersahabat, mengurangi ketegangan visual tanpa terkesan main-main.

- **Base Radius:** `0.45rem` (~7.2px).
- **Cards & Modal Containers:** `rounded-xl` (12px) dengan ring pelindung `ring-1 ring-foreground/10`.
- **Buttons & Form Controls:** `rounded-md` (6px) hingga `rounded-lg` (8px).
- **Badges & Status Telemetry:** `rounded-full` (9999px / bentuk pill).
- **Avatar & Icon Badges:** `rounded-lg` (8px) untuk logo identitas, `rounded-full` untuk avatar profil klinis.

### Named Rules
**The Functional Pill Rule.** Bentuk pill (*fully rounded*) dicadangkan semata-mata untuk status telemetri kecil, badge peringatan, dan tag kategori. Kontainer konten, kartu modul, dan dialog formulir wajib mempertahankan struktur persegi panjang melengkung (12px) demi efisiensi visual ruang tabular.

## Components

### Buttons
- **Shape:** Sudut membulat proporsional (`rounded-md` / 6px), tinggi standar `h-9` (36px) dan varian ringkas `h-8` (32px).
- **Primary:** Latar `bg-primary` dengan teks kontras tinggi `text-primary-foreground`. Efek hover menurunkan opasitas halus (`hover:bg-primary/80`) dengan feedback aktif `active:translate-y-px`.
- **Outline:** Latar transparan atau putih dengan batas `border-border`, elevasi halus `shadow-xs`, dan hover `hover:bg-muted`.
- **Destructive:** Latar lembut `bg-destructive/10` dengan teks tajam `text-destructive`, menjaga agar aksi kritis tidak tampak seperti kesalahan grafis.

### Cards / Containers
- **Corner Style:** Sudut `rounded-xl` (12px), ring tipis `ring-1 ring-foreground/10`, dan padding internal modular `p-6` (atau `p-4` untuk varian ringkas).
- **Background:** `bg-card` dengan isolasi teks `text-card-foreground`.
- **Header & Action:** Mendukung layout grid otomatis yang menyelaraskan judul modul dengan tombol aksi di sudut kanan atas.

### Badges / Status Chips
- **Style:** Bentuk kapsul ramping `rounded-full` dengan padding `px-2 py-0.5` dan teks `text-xs font-medium`.
- **Status Telemetry:** Didampingi lampu indikator berkedip (*pulsing dot*) seperti `bg-emerald-500` untuk koneksi Zoom aktif.
- **Clinical Waiver Alert:** Border khusus `border-rose-500/40` dengan teks `text-rose-600 dark:text-rose-400` untuk penandaan kasus risiko tinggi SRQ-20.

### Inputs & Command Palette
- **Style:** Latar semi-transparan `bg-muted/30` dengan border 1px `border-border/80` dan radius `rounded-lg`.
- **Focus:** Cincin fokus lembut `focus-visible:ring-3 focus-visible:ring-ring/50` tanpa pergeseran layout.
- **Pintasan Keyboard:** Tag penanda tombol `⌘K` dan `ESC` dengan tipografi monospace berbingkai border.

### Navigation (Sidebar)
- **Grouping:** Dikelompokkan secara semantik: *Operasional Klinis* dan *Kemitraan & Tata Kelola*.
- **Active State:** Menggunakan aksen garis kiri vertikal tebal 3px dengan latar belakang lembut `bg-primary/10` dan warna teks primer.
- **Footer Operator:** Tersemat permanen di bagian bawah menampilkan inisial operator, email resmi, dan indikator online hijau.

## Do's and Don'ts

### Do:
- **Do** gunakan bahasa Indonesia yang hangat, profesional, dan empatik di seluruh antarmuka ("Mitra Konselor", "Ruang Telekonseling", "Protokol Krisis").
- **Do** pastikan seluruh penanda risiko krisis SRQ-20 selalu disertai akses nomor kontak darurat nasional (**Hotline 119 ext. 8 / Layanan Sejiwa**).
- **Do** jaga rasio kontras warna teks terhadap latar belakang selalu memenuhi kriteria WCAG AA (≥4.5:1).
- **Do** sematkan indikator status Zoom 2 Host Concurrency Guard pada header agar operator selalu mengetahui ketersediaan slot sesi.
- **Do** gunakan satuan waktu WIB (Waktu Indonesia Barat / UTC+7) dan format mata uang Rupiah (IDR) secara konsisten pada seluruh jadwal dan tarif.

### Don'ts:
- **Don't** menggunakan warna merah menyala atau ikon seram untuk menandai skrining kesehatan mental yang dapat memicu kecemasan berlebih pada pasien.
- **Don't** menggunakan efek bayangan tebal neobrutalisme (`box-shadow: 4px 4px 0`) atau gradien teks warna-warni yang mengaburkan pesan klinis.
- **Don't** membiarkan navigasi samping atau header terdorong keluar layar saat pengguna menelusuri data sesi yang panjang.
- **Don't** menggunakan ilustrasi kartun generik (*doodle* / sketsa acak) sebagai pengganti visual; gunakan ikon stroke Lucide yang presisi dan konsisten.
- **Don't** memasukkan data dummy fiktif yang menyesatkan pada status medis atau profil mitra konselor.
