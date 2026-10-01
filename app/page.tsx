import * as React from "react"
import Link from "next/link"
import {
  Heart,
  HeartHandshake,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Lock,
  Check,
  BadgeCheck,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PublicShell } from "@/components/public/public-shell"
import { FaqAccordion } from "@/components/public/FaqAccordion"

export const metadata = {
  title: "Solulu | Ruang Konseling Online Mental Health & Self Care",
  description:
    "Ruang aman dan privat untuk konseling online bersama psikolog klinis berizin resmi dan konselor sebaya. Durasi penuh 90 menit, 100% rahasia tanpa wajib membuat akun.",
}

const HERO_COUNSELORS = [
  {
    name: "Sarah Annisa, M.Psi",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
  },
  {
    name: "Dimas Wicaksono, M.Psi",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
  },
  {
    name: "Bima Arya, S.Psi",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
  },
  {
    name: "Nadya Putri, S.Psi",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
  },
]

const TRUST_PILLARS = [
  {
    icon: Clock,
    title: "90 Menit Penuh",
    desc: "Sesi lega & mendalam",
  },
  {
    icon: ShieldCheck,
    title: "100% Rahasia",
    desc: "Bebas nama samaran",
  },
  {
    icon: Users,
    title: "Mitra Berizin",
    desc: "Psikolog & konselor",
  },
  {
    icon: Calendar,
    title: "Tanpa Buat Akun",
    desc: "Pilih jadwal langsung",
  },
]

const FEATURED_COUNSELORS = [
  {
    id: "c-1",
    name: "Sarah Annisa, M.Psi",
    role: "Psikolog Klinis Berizin Resmi",
    type: "psychologist" as const,
    education: "S2 Psikologi Klinis • Izin Kemenkes",
    specializations: ["Kecemasan (Anxiety)", "Trauma", "Burnout Karir"],
    rate: "Rp 130.000",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
    rating: "4.9",
    experience: "4+ Tahun",
    availableSoon: "Tersedia Hari Ini",
  },
  {
    id: "c-2",
    name: "Rian Hidayat, S.Psi",
    role: "Konselor Sebaya (Partner Cerita)",
    type: "peer" as const,
    education: "Sarjana Psikologi (S.Psi) • Fasilitator",
    specializations: ["Quarter-life Crisis", "Stres Kuliah & Kerja", "Relasi Asmara"],
    rate: "Rp 85.000",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    rating: "4.8",
    experience: "3+ Tahun",
    availableSoon: "Tersedia Besok",
  },
  {
    id: "c-3",
    name: "Dr. Nadia Larasati, M.Psi",
    role: "Psikolog Klinis Berizin Resmi",
    type: "psychologist" as const,
    education: "Doktor & S2 Psikologi • Izin Kemenkes",
    specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri"],
    rate: "Rp 130.000",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
    rating: "5.0",
    experience: "6+ Tahun",
    availableSoon: "Tersedia Hari Ini",
  },
]

const TOPIC_CATEGORIES = [
  {
    category: "Stres & Tekanan Hidup",
    topics: ["Overthinking & Cemas", "Burnout Kerja & Akademik", "Homesick & Adaptasi Rantau", "Regulasi Emosi"],
  },
  {
    category: "Relasi & Identitas Diri",
    topics: ["Quarter-life Crisis", "Konflik Hubungan & Asmara", "Insecurity & Self-Esteem", "Duka & Kehilangan"],
  },
]

const CORE_PILLARS = [
  {
    title: "Durasi Penuh 90 Menit",
    desc: "Bukan sesi 45 menit yang terburu-buru. Kami memberi ruang bernapas yang cukup untuk mendengarkan ceritamu secara utuh hingga ke akar masalah.",
    icon: Clock,
  },
  {
    title: "100% Rahasia & Anonim",
    desc: "Privasimu terlindungi penuh. Bebas menggunakan nama samaran pada sesi Zoom privat tanpa rekaman sistem, patuh UU PDP No. 27/2022.",
    icon: Lock,
  },
  {
    title: "Mendengar Tanpa Menghakimi",
    desc: "Ruang yang aman, tenang, dan setara. Apa pun ceritamu, tidak ada hal yang salah, berlebihan, atau sepele untuk didiskusikan bersama.",
    icon: Heart,
  },
  {
    title: "Rencana Pemulihan Konkret",
    desc: "Bukan sekadar tempat curhat. Konselor membantumu memetakan pola pikir dan merumuskan rencana aksi pemulihan yang realistis.",
    icon: Sparkles,
  },
]

const TESTIMONIALS = [
  {
    author: "Mahasiswa, 21 tahun",
    topic: "Kecemasan Studi",
    counselor: "Sarah Annisa, M.Psi",
    quote: "Awalnya ragu mau cerita karena takut dinilai berlebihan. Konselornya sangat menenangkan sejak menit awal, dan durasi 90 menit benar-benar melegakan tanpa rasa terburu-buru.",
  },
  {
    author: "Karyawan Swasta, 26 tahun",
    topic: "Quarter-life Crisis & Burnout",
    counselor: "Rian Hidayat, S.Psi",
    quote: "Burnout kerja sempat membuat saya buntu arah. Melalui sesi ini, beban di kepala pelan-pelan diurai menjadi langkah konkret yang realistis untuk langsung diterapkan.",
  },
  {
    author: "Fresh Graduate, 23 tahun",
    topic: "Regulasi Emosi & Overthinking",
    counselor: "Dr. Nadia Larasati, M.Psi",
    quote: "Konselingnya terarah dan menenangkan. Kami melatih teknik grounding yang langsung membantu saat kecemasan tiba-tiba muncul di malam hari.",
  },
]

const FAQS = [
  {
    question: "Apa perbedaan antara Konselor Sebaya dan Psikolog Klinis?",
    answer:
      "Konselor Sebaya adalah Sarjana Psikologi (S.Psi) terlatih yang memberikan pendampingan suportif untuk stres harian, quarter-life crisis, burnout kuliah atau kerja, dan ruang curhat hangat. Sementara Psikolog Klinis adalah lulusan Magister Profesi Psikologi yang memegang izin praktik resmi dari Kemenkes untuk memberikan pendampingan klinis mendalam (seperti kecemasan berlebih, depresi, trauma, dan evaluasi emosi klinis).",
  },
  {
    question: "Berapa lama durasi satu sesi konseling di Solulu?",
    answer:
      "Setiap sesi berlangsung 90 menit penuh via tautan Zoom Meeting privat. Durasi 90 menit memberi ruang yang lega untuk bercerita tanpa terburu-buru, mengurai akar masalah secara mendalam, dan merumuskan rencana aksi pemulihan yang konkret.",
  },
  {
    question: "Apakah saya harus membuat akun atau menginstal aplikasi khusus?",
    answer:
      "Tidak perlu. Solulu menerapkan sistem pemesanan langsung tanpa akun (guest booking). Anda cukup memilih konselor dan jadwal yang cocok, memasukkan nama (boleh nama panggilan atau inisial), nomor WhatsApp, dan email. Tautan Zoom privat dapat diakses langsung dari peramban ponsel maupun laptop Anda.",
  },
  {
    question: "Bagaimana jika saya berhalangan hadir pada jam yang dijadwalkan?",
    answer:
      "Anda dapat mengajukan perubahan jadwal (reschedule) secara mandiri melalui tautan sesi Anda hingga minimal 12 jam sebelum sesi dimulai, agar waktu konselor dapat dialokasikan kembali secara adil.",
  },
  {
    question: "Bagaimana Solulu menjamin kerahasiaan data dan cerita saya?",
    answer:
      "Kerahasiaan adalah prinsip utama kami. Anda bebas menggunakan nama samaran. Sesi Zoom privat tidak pernah direkam secara otomatis oleh sistem, dan seluruh data pribadi dilindungi secara ketat sesuai ketentuan UU PDP No. 27/2022.",
  },
]

export default function HomePage() {
  return (
    <PublicShell>
      {/* 1. Hero Section: Focused, Empathetic, Dignified */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-border/70 bg-radial from-purple-50/60 via-background to-background dark:from-purple-950/25 dark:via-background dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6 sm:gap-7">
          {/* Subtle Trust Anchor */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs font-medium">
            <span className="size-2 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" aria-hidden="true" />
            <span>Sesi Privat 90 Menit • Langsung Pesan Tanpa Perlu Akun</span>
          </div>

          {/* Natural Typographic Headline */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance">
            Saatnya didengarkan tanpa penghakiman.
            <span className="block mt-1 font-semibold text-purple-700 dark:text-purple-400">
              Ruang aman untuk mengurai ceritamu.
            </span>
          </h1>

          {/* Subtitle with optimal reading line-length */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal text-pretty">
            Konseling online privat bersama <strong>Psikolog Klinis Berizin Resmi</strong> dan <strong>Teman Cerita Terlatih</strong>. Sesi lega 90 menit tanpa terburu-buru, langsung pilih jadwal tanpa repot bikin akun.
          </p>

          {/* Actions & Social Proof */}
          <div className="flex flex-col items-center gap-4 pt-1 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              {/* Standardized Hero Primary: size="pill-lg" (48px, even padding) */}
              <Button
                asChild
                variant="public"
                size="pill-lg"
                className="w-full sm:w-auto"
                id="btn-hero-primary"
              >
                <Link href="/counselors">
                  <span>Pilih Jadwal Konseling</span>
                  <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>

              {/* Standardized Hero Secondary: size="pill-lg" (48px, even padding, matching typography) */}
              <Button
                asChild
                variant="public-secondary"
                size="pill-lg"
                className="w-full sm:w-auto"
                id="btn-hero-secondary"
              >
                <Link href="#harga">
                  <span>Lihat Pilihan &amp; Tarif</span>
                </Link>
              </Button>
            </div>

            {/* Social Proof Row */}
            <div className="flex items-center justify-center gap-2.5 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center -space-x-2">
                {HERO_COUNSELORS.map((c, i) => (
                  <Avatar key={i} className="size-7 border-2 border-background ring-1 ring-border/80 shadow-2xs">
                    <AvatarImage src={c.src} alt={c.name} />
                    <AvatarFallback className="text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {c.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <div className="flex items-center text-amber-500" aria-label="Rating 4.9 dari 5 bintang">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="tabular-nums font-bold ml-1 text-xs">4.9/5.0</span>
                </div>
                <span className="text-muted-foreground font-normal">dari 1.200+ sesi selesai</span>
              </div>
            </div>
          </div>

          {/* Structured Trust Grid: Balanced 4-card layout with top icon and zero awkward wrapping */}
          <div className="w-full max-w-4xl pt-8 border-t border-border/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left items-stretch">
              {TRUST_PILLARS.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-card/75 border border-border/80 shadow-2xs hover:border-purple-500/30 hover:shadow-xs transition-all flex flex-col gap-3 justify-between"
                  >
                    <div className="size-9 sm:size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <IconComp className="size-4.5 sm:size-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 justify-end">
                      <span className="font-heading font-semibold text-xs sm:text-sm text-foreground tracking-tight line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-1">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Kenapa Memilih Solulu: Standardized py-16 sm:py-20 md:py-24 padding */}
      <section id="tentang" className="py-16 sm:py-20 md:py-24 border-b border-border/70 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
          <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Kenapa Memilih Solulu?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Pendampingan kesehatan mental yang berlandaskan rasa aman, empati penuh, dan kepastian privasi.
            </p>
          </div>

          {/* Balanced 4-Card Grid with uniform p-6 sm:p-7 padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {CORE_PILLARS.map((pillar, idx) => {
              const IconComp = pillar.icon
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl border border-border/80 bg-card hover:border-purple-500/30 hover:shadow-xs transition-all flex flex-col gap-4"
                >
                  <div className="size-11 sm:size-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <IconComp className="size-5 sm:size-6" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <h3 className="font-heading font-semibold text-lg sm:text-xl text-foreground tracking-tight text-balance">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Topik yang Sering Dikonsultasikan: Standardized py-16 sm:py-20 md:py-24 padding */}
      <section id="layanan" className="py-16 sm:py-20 md:py-24 border-b border-border/70 bg-muted/20 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8 text-center items-center">
          <div className="flex flex-col gap-2 max-w-xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
              Topik yang Sering Didiskusikan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Bawa cerita apa pun yang sedang memenuhi pikiranmu. Tidak ada masalah yang terlalu sepele atau tidak berharga untuk didengarkan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            {TOPIC_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-card border border-border/80 flex flex-col gap-3.5 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-purple-600" aria-hidden="true" />
                  <span className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider">
                    {cat.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.topics.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Punya topik lain di luar daftar di atas? Seluruh konselor kami siap mendampingi kebutuhan unikmu.
          </p>
        </div>
      </section>

      {/* 4. Pilihan Layanan & Biaya (Pricing): Balanced card proportions, zero badge wrapping, pixel-perfect alignment */}
      <section id="harga" className="py-16 sm:py-20 md:py-24 border-b border-border/70 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
          <div className="text-center flex flex-col items-center gap-2.5 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap">
              <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>Biaya Flat &amp; Transparan</span>
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pilihan Layanan &amp; Biaya
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Tarif flat transparan mencakup 90 menit penuh tanpa biaya pendaftaran, biaya admin, atau biaya tersembunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch pt-6 sm:pt-7 max-w-4xl mx-auto w-full">
            {/* Tier 1: Konseling Sebaya */}
            <Card className="relative border border-border/80 shadow-xs flex flex-col justify-between rounded-2xl bg-card hover:border-purple-500/40 hover:shadow-sm transition-all">
              <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5">
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="size-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <HeartHandshake className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="font-heading text-lg sm:text-xl font-bold text-foreground">
                      Konseling Sebaya
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                      Partner Refleksi &amp; Dengar Aktif (S.Psi Terlatih)
                    </CardDescription>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums whitespace-nowrap">
                      Rp 85.000
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0 whitespace-nowrap"> / 90 menit</span>
                  </div>
                  <div className="h-5 flex items-center">
                    <span className="text-xs text-muted-foreground">1 sesi privat tanpa komitmen paket</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 sm:px-7 flex flex-col gap-4 text-xs sm:text-sm text-muted-foreground flex-1">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Sarjana Psikologi (S.Psi) terverifikasi resmi</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Mendengarkan aktif dengan ruang empati hangat</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Refleksi diri &amp; pemetaan emosi yang terarah</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Ruang Zoom privat tanpa rekaman otomatis</span>
                  </li>
                </ul>

                <div className="mt-auto pt-4 border-t border-border/60">
                  <div className="rounded-xl bg-muted/40 p-3.5 text-xs sm:text-sm text-foreground/80 leading-relaxed border border-border/40 min-h-[76px] flex flex-col justify-center">
                    <div>
                      <strong className="text-foreground">Cocok untuk:</strong> Stres harian, butuh ruang curhat aman, quarter-life crisis, &amp; adaptasi baru.
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 sm:p-7 pt-2">
                <Button
                  asChild
                  variant="public-secondary"
                  size="pill"
                  className="w-full"
                  id="btn-pricing-peer"
                >
                  <Link href="/counselors?type=peer">
                    <span>Pilih Konselor Sebaya</span>
                    <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Tier 2: Psikolog Klinis (Featured Flagship) */}
            <Card className="relative border-2 border-purple-600 dark:border-purple-400 shadow-md flex flex-col justify-between rounded-2xl bg-card overflow-visible">
              {/* Floating Pill Badge: whitespace-nowrap and solid contrast */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-600 text-white shadow-sm ring-1 ring-purple-600/30 whitespace-nowrap inline-flex items-center gap-1.5 z-10">
                <Sparkles className="size-3 text-purple-200" aria-hidden="true" />
                <span>Rekomendasi Klinis</span>
              </div>

              <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5">
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="size-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="font-heading text-lg sm:text-xl font-bold text-foreground">
                      Konseling Psikolog
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                      Psikolog Klinis Profesional Berizin Resmi
                    </CardDescription>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums whitespace-nowrap">
                      Rp 130.000
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0 whitespace-nowrap"> / 90 menit</span>
                  </div>
                  <div className="h-5 flex items-center">
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">1 sesi intensif standar klinis Kemenkes</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 sm:px-7 flex flex-col gap-4 text-xs sm:text-sm text-muted-foreground flex-1">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-medium text-foreground">Psikolog klinis berpendidikan S2 Profesi resmi</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Izin resmi psikolog klinis dari Kemenkes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Metode klinis teruji (CBT, ACT &amp; emosi)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Rencana penanganan &amp; aksi terstruktur</span>
                  </li>
                </ul>

                <div className="mt-auto pt-4 border-t border-border/60">
                  <div className="rounded-xl bg-purple-500/10 p-3.5 text-xs sm:text-sm text-foreground/90 leading-relaxed border border-purple-500/20 min-h-[76px] flex flex-col justify-center">
                    <div>
                      <strong className="text-purple-700 dark:text-purple-300">Cocok untuk:</strong> Kecemasan (anxiety), depresi, trauma mendalam, &amp; keluhan klinis.
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 sm:p-7 pt-2">
                <Button
                  asChild
                  variant="public"
                  size="pill"
                  className="w-full"
                  id="btn-pricing-psychologist"
                >
                  <Link href="/counselors?type=psychologist">
                    <span>Pilih Psikolog Klinis</span>
                    <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Mitra Konselor Berpengalaman: Standardized py-16 sm:py-20 md:py-24 & uniform card padding p-6 */}
      <section id="partner" className="py-16 sm:py-20 md:py-24 border-b border-border/70 bg-muted/20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-lg">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
                Mitra Konselor Berpengalaman
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                Seluruh mitra terverifikasi ijazah profesi dan izin praktik resmi Kemenkes untuk menjamin kenyamanan sesi Anda.
              </p>
            </div>

            {/* Standardized Header Action: size="pill-sm" (h-9, px-4) */}
            <Button
              asChild
              variant="public-secondary"
              size="pill-sm"
              className="shrink-0"
              id="btn-counselors-all"
            >
              <Link href="/counselors">
                <span>Lihat Semua Konselor</span>
                <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {FEATURED_COUNSELORS.map((c) => (
              <Card
                key={c.id}
                className="group p-0 py-0 gap-0 ring-0 border border-border/80 shadow-xs hover:border-purple-500/40 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl bg-card overflow-hidden"
                style={{ paddingTop: 0 }}
              >
                {/* 1. Top Cover / Portrait Photo (Flush to card top, no empty padding) */}
                <div data-slot="card-cover" className="relative w-full aspect-[4/3] bg-muted overflow-hidden shrink-0">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    width={600}
                    height={450}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle Gradient Vignette at bottom of image for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Top-left Counselor Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${
                        c.type === "psychologist"
                          ? "bg-purple-950/85 text-purple-200 border border-purple-400/30"
                          : "bg-blue-950/85 text-blue-200 border border-blue-400/30"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${c.type === "psychologist" ? "bg-purple-400" : "bg-blue-400"}`} />
                      <span>{c.type === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
                    </span>
                  </div>

                  {/* Top-right Rating Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-xs border border-white/10">
                    <Star className="size-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                    <span className="tabular-nums">{c.rating}</span>
                  </div>

                  {/* Bottom Availability Status */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-medium text-white/95">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>{c.availableSoon}</span>
                    </div>
                    <span className="text-white/80 font-normal">{c.experience} Pengalaman</span>
                  </div>
                </div>

                {/* 2. Counselor Details Underneath */}
                <CardContent className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-1 min-h-[68px]">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground tracking-tight">
                        {c.name}
                      </h3>
                      <BadgeCheck className="size-4.5 text-purple-600 dark:text-purple-400 shrink-0" aria-label="Terverifikasi" />
                    </div>
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 line-clamp-1">
                      {c.role}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.education}
                    </p>
                  </div>

                  {/* Specializations / Focus Areas */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {c.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="text-[11px] font-medium text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/40 whitespace-nowrap"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Rate / Fee Row */}
                  <div className="pt-3.5 mt-auto border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Tarif sesi (90 mnt):</span>
                    <strong className="text-foreground font-heading font-bold text-base sm:text-lg tabular-nums">
                      {c.rate}
                    </strong>
                  </div>
                </CardContent>

                {/* 3. Action Button */}
                <CardFooter className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <Button
                    asChild
                    variant="public"
                    size="pill"
                    className="w-full"
                    id={`btn-counselor-${c.id}`}
                  >
                    <Link href={`/counselors?id=${c.id}`}>
                      <span>Pilih Jadwal Konseling</span>
                      <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pengalaman Klien di Solulu: Standardized py-16 sm:py-20 md:py-24 & uniform card padding p-6 */}
      <section id="testimoni" className="py-16 sm:py-20 md:py-24 border-b border-border/70 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2 max-w-lg mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pengalaman Klien di Solulu
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Cerita nyata dari klien yang telah menyelesaikan sesi (identitas disamarkan demi menjaga privasi).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-card border border-border/80 flex flex-col justify-between gap-3.5 shadow-2xs"
              >
                {/* 1. Header with purple indicator dot & Rating */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-purple-600" aria-hidden="true" />
                    <span className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider">
                      Sesi Terverifikasi
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400" aria-label="Rating 5 bintang">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                </div>

                {/* 2. Pure Distilled Quote */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* 3. Essential Author Context & Topic Pill */}
                <div className="pt-3.5 border-t border-border/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-xs sm:text-sm text-foreground">
                      {t.author}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground/90">
                      {t.topic}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-normal">
                    Sesi bersama <strong className="font-medium text-purple-600 dark:text-purple-400">{t.counselor}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pertanyaan yang Sering Diajukan: Standardized py-16 sm:py-20 md:py-24 & uniform padding p-6 */}
      <section id="faq" className="py-16 sm:py-20 md:py-24 border-b border-border/70 bg-muted/20 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
              Informasi lengkap seputar mekanisme konseling, jadwal, dan kepastian privasi Anda.
            </p>
          </div>

          <FaqAccordion faqs={FAQS} />

          {/* Quick Support Callout */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Masih punya pertanyaan lain sebelum memesan?{" "}
              <a
                href="https://wa.me/6285144909949?text=Halo%20Solulu!%20Saya%20ingin%20tanya%20tentang%20sesi%20konseling."
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 font-semibold underline underline-offset-4 hover:opacity-80"
              >
                Tanya langsung via WhatsApp kami
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* 8. Call To Action Banner: Standardized py-16 sm:py-20 md:py-24 & size="pill-lg" (48px) */}
      <section id="privasi" className="py-16 sm:py-20 md:py-24 border-b border-border/70 bg-background scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-radial from-purple-900 via-purple-950 to-slate-950 text-white p-8 sm:p-12 md:p-14 text-center flex flex-col items-center gap-6 shadow-xl relative overflow-hidden border border-purple-800/40">
            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200">
              <Heart className="size-6 fill-purple-300/30 text-purple-200" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-2 max-w-xl">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-balance">
                Siap Memulai Ruang Ceritamu?
              </h2>
              <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-normal text-pretty">
                Kamu tidak perlu menunggu masalah menumpuk untuk mencari teman bicara. Pilih konselor dan jadwal yang paling nyaman untukmu hari ini.
              </p>
            </div>

            {/* Standardized Footer CTA: size="pill-lg" (48px, even padding, matching Hero) */}
            <Button
              asChild
              variant="public-white"
              size="pill-lg"
              id="btn-footer-cta"
            >
              <Link href="/counselors">
                <span>Pilih Jadwal Konseling Sekarang</span>
                <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-purple-200/80 font-medium tabular-nums pt-1 border-t border-white/10 w-full max-w-lg">
              <span>90 Menit Penuh</span>
              <span>•</span>
              <span>Zoom Privat Tanpa Rekaman</span>
              <span>•</span>
              <span>100% Rahasia</span>
              <span>•</span>
              <span>Tanpa Akun</span>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
