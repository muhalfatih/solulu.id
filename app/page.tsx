import * as React from "react"
import Link from "next/link"
import {
  Heart,
  HeartHandshake,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Quote,
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
import { getPlatformPricing } from "@/lib/pricing/platform-pricing"
import { formatRupiah } from "@/lib/booking/checkout"
import { getFeaturedCounselorsForHomepageAction } from "@/app/admin/counselors/actions"
import { getFeaturedTestimonialsForHomepageAction } from "@/app/admin/testimonials/actions"
import { ScrollReveal } from "@/components/scroll-reveal"

export const metadata = {
  title: "Solulu | Ruang Konseling Online & Kesehatan Jiwa",
  description:
    "Ruang aman dan privat untuk konseling bersama psikolog klinis berizin resmi dan teman cerita terlatih. Durasi 90 menit penuh, rahasia, tanpa perlu membuat akun.",
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
    desc: "Sesi lega, nggak buru-buru",
  },
  {
    icon: ShieldCheck,
    title: "100% Rahasia",
    desc: "Boleh pakai nama samaran",
  },
  {
    icon: Users,
    title: "Mitra Berizin",
    desc: "Psikolog & konselor resmi",
  },
  {
    icon: Calendar,
    title: "Tanpa Bikin Akun",
    desc: "Tinggal pilih jadwal langsung",
  },
]

const FEATURED_COUNSELORS = [
  {
    id: "c-1",
    name: "Sarah Annisa, M.Psi",
    role: "Psikolog Klinis Berizin Resmi",
    type: "psychologist" as const,
    education: "S2 Profesi Psikologi • Izin Kementerian Kesehatan",
    specializations: ["Kecemasan Berlebih", "Pemulihan Trauma", "Kejenuhan Kerja"],
    rate: "Rp 130.000",
    originalRate: "Rp 250.000",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
    rating: "4.9",
    experience: "4+ Tahun",
    availableSoon: "Tersedia Hari Ini",
  },
  {
    id: "c-2",
    name: "Rian Hidayat, S.Psi",
    role: "Konselor Sebaya (Teman Cerita Terlatih)",
    type: "peer" as const,
    education: "Sarjana Psikologi • Pendamping Sebaya",
    specializations: ["Bimbang Arah Masa Depan", "Stres Kuliah & Kerja", "Hubungan Asmara"],
    rate: "Rp 85.000",
    originalRate: "Rp 150.000",
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
    education: "Doktor & Magister Psikologi • Izin Kementerian Kesehatan",
    specializations: ["Gejala Depresi", "Rasa Kurang Percaya Diri", "Penerimaan Diri"],
    rate: "Rp 130.000",
    originalRate: "Rp 250.000",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
    rating: "5.0",
    experience: "6+ Tahun",
    availableSoon: "Tersedia Hari Ini",
  },
]

const TOPIC_CATEGORIES = [
  {
    category: "Tekanan & Beban Pikiran",
    topics: ["Pikiran Nggak Tenang & Cemas", "Capek Kuliah & Kerja", "Kangen Rumah & Susah Adaptasi", "Susah Kelola Emosi"],
  },
  {
    category: "Hubungan & Diri Sendiri",
    topics: ["Bingung Arah Hidup Usia 20-an", "Masalah Hubungan Asmara", "Sering Ngerasa Kurang PD", "Duka & Kehilangan"],
  },
]

const CORE_PILLARS = [
  {
    title: "Durasi Penuh 90 Menit",
    desc: "Bukan sesi 45 menit yang serba buru-buru. Kamu punya waktu cukup buat cerita sampai tuntas dan cari jalan keluar bareng.",
    icon: Clock,
  },
  {
    title: "100% Rahasia & Aman",
    desc: "Privasimu nomor satu. Bebas pakai nama samaran di panggilan video privat tanpa rekaman sistem, aman sesuai aturan perlindungan data pribadi.",
    icon: Lock,
  },
  {
    title: "Didengar Tanpa Dihakimi",
    desc: "Ruang yang tenang dan setara. Apa pun ceritamu, nggak ada hal yang salah, berlebihan, atau sepele buat diobrolin bersama.",
    icon: Heart,
  },
  {
    title: "Bukan Sekadar Curhat",
    desc: "Konselor bakal bantu kamu mengurai benang kusut di kepala dan nemuin langkah kecil yang realistis buat dijalani sehari-hari.",
    icon: Sparkles,
  },
]

const TESTIMONIALS = [
  {
    title: "Tidak merasa sendirian lagi",
    author: "Mahasiswa, 21 tahun",
    topic: "Kecemasan Kuliah & Ujian",
    quote: "Awalnya sempat ragu mau cerita karena takut dinilai lebay. Tapi konselornya sangat menenangkan sejak menit awal, dan durasi 90 menit beneran bikin lega tanpa rasa diburu-buru.",
  },
  {
    title: "Punya arah keluar dari masalah",
    author: "Karyawan Swasta, 26 tahun",
    topic: "Capek Kerja & Bingung Arah",
    quote: "Tekanan kerja sempat bikin kepala buntu banget. Lewat sesi ini, beban pikiran pelan-pelan diurai jadi langkah nyata yang masuk akal buat langsung saya jalanin.",
  },
  {
    title: "Punya cara tenang saat cemas datang",
    author: "Lulusan Baru Kuliah, 23 tahun",
    topic: "Pikiran Cemas & Berputar",
    quote: "Konselingnya terarah dan bikin adem. Kami latihan cara menenangkan diri yang langsung ngebantu waktu rasa cemas tiba-tiba muncul di malam hari.",
  },
]

const FAQS = [
  {
    question: "Apa bedanya Konselor Sebaya dan Psikolog Klinis?",
    answer:
      "Konselor Sebaya adalah Sarjana Psikologi terlatih yang siap mendampingi stres harian, rasa jenuh belajar atau bekerja, kebingungan arah hidup usia muda, serta jadi teman curhat yang aman dan suportif. Sementara Psikolog Klinis adalah tenaga profesional berizin resmi (Surat Tanda Registrasi dari Kementerian Kesehatan) untuk membantu penanganan keluhan emosional yang lebih mendalam, seperti cemas berlebih, depresi, pemulihan trauma masa lalu, hingga evaluasi kesehatan psikologis.",
  },
  {
    question: "Berapa lama durasi satu sesi konseling di Solulu?",
    answer:
      "Setiap sesi berlangsung selama 90 menit penuh lewat panggilan video privat (Zoom). Durasi 90 menit memberi waktu yang cukup buat bercerita tanpa terburu-buru, menemukan akar persoalan, dan menyusun langkah pemulihan bareng konselor.",
  },
  {
    question: "Apakah saya harus bikin akun atau download aplikasi khusus?",
    answer:
      "Nggak perlu sama sekali. Kamu bisa langsung pesan jadwal tanpa harus registrasi akun. Cukup pilih konselor dan jadwal yang cocok, lalu isi nama (boleh nama panggilan atau samaran), nomor WhatsApp, dan email. Tautan sesi privatnya bisa langsung dibuka lewat peramban di HP maupun laptop.",
  },
  {
    question: "Gimana kalau saya berhalangan hadir pada jam yang dijadwalkan?",
    answer:
      "Kamu bisa mengajukan ganti jadwal secara mandiri lewat tautan sesimu selambat-lambatnya 12 jam sebelum sesi dimulai, biar waktu konselor bisa dialihkan dengan baik bagi yang membutuhkan.",
  },
  {
    question: "Bagaimana Solulu menjaga kerahasiaan cerita dan data pribadi saya?",
    answer:
      "Kerahasiaan adalah komitmen utama kami. Kamu bebas pakai nama samaran. Sesi panggilan video bersifat privat tanpa rekaman sistem, dan seluruh datamu dilindungi ketat sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022).",
  },
]

export default async function HomePage() {
  const pricing = await getPlatformPricing()
  const featuredRes = await getFeaturedCounselorsForHomepageAction()
  const testimonialsRes = await getFeaturedTestimonialsForHomepageAction()

  const displayTestimonials =
    testimonialsRes.success && testimonialsRes.data && testimonialsRes.data.length > 0
      ? testimonialsRes.data.map((t) => ({
          title: t.quoteHighlight,
          author: t.anonymousDisplay || t.clientName || "Klien Solulu",
          topic: t.topic,
          quote: t.comment,
        }))
      : TESTIMONIALS

  const featuredCounselors =
    featuredRes.success && featuredRes.data && featuredRes.data.length > 0
      ? featuredRes.data.map((c) => ({
          id: c.id,
          name: c.fullName,
          role:
            c.title ||
            (c.counselorType === "psychologist"
              ? "Psikolog Klinis Berizin Resmi"
              : "Konselor Sebaya (Teman Cerita)"),
          type: c.counselorType as "peer" | "psychologist",
          education:
            c.education ||
            (c.counselorType === "psychologist"
              ? "S2 Profesi Psikologi • Izin Kemenkes STR Terverifikasi"
              : "Sarjana Psikologi • Konselor Sebaya"),
          specializations:
            c.specializations && c.specializations.length > 0
              ? c.specializations.slice(0, 3)
              : ["Kecemasan & Stres", "Pengembangan Diri"],
          avatar:
            c.avatarR2Url ||
            (c.counselorType === "psychologist"
              ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
              : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"),
          rating: "4.9",
          experience: "4+ Tahun",
          availableSoon: "Tersedia Minggu Ini",
        }))
      : FEATURED_COUNSELORS

  const heroCounselorsList = featuredCounselors.slice(0, 4).map((c) => ({
    name: c.name,
    src: c.avatar,
  }))

  const peerActivePrice = pricing.peer.isSaleActive ? pricing.peer.promoPrice : pricing.peer.basePrice
  const peerHasDiscount = pricing.peer.isSaleActive && pricing.peer.promoPrice < pricing.peer.basePrice
  const psychologistActivePrice = pricing.psychologist.isSaleActive
    ? pricing.psychologist.promoPrice
    : pricing.psychologist.basePrice
  const psychologistHasDiscount =
    pricing.psychologist.isSaleActive && pricing.psychologist.promoPrice < pricing.psychologist.basePrice

  return (
    <PublicShell>
      {/* 1. Hero Section: Focused, Empathetic, Contemporary */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 border-b border-border/40 bg-radial-[at_50%_0%] from-purple-100/70 via-background to-background dark:from-purple-950/30 dark:via-background dark:to-background">
        {/* Authored Breathing Ambient Aura (Napas Tenang) */}
        <div
          className="absolute -top-20 sm:-top-28 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] md:w-[780px] h-[260px] sm:h-[380px] bg-gradient-to-b from-purple-400/20 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/25 dark:via-purple-950/15"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6 sm:gap-7">
          {/* Subtle Trust Anchor with Heart icon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-purple-300 text-xs font-semibold shadow-2xs animate-hero-fade-up">
            <Heart className="size-3.5 fill-primary/30 text-primary dark:text-purple-300 animate-float-subtle" aria-hidden="true" />
            <span>Layanan Konseling &amp; Teman Cerita Privat</span>
          </div>

          {/* Simple, to-the-point, contemporary headline */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance animate-hero-fade-up [animation-delay:120ms]">
            Ruang Aman untuk Bercerita
            <span className="block mt-1 font-semibold text-primary dark:text-purple-300">
              #CeritaDiSolulu
            </span>
          </h1>

          {/* Subtitle with friendly tone */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal text-pretty animate-hero-fade-up [animation-delay:220ms]">
            Ngobrol privat 90 menit bareng <strong>Psikolog Klinis Berizin Resmi</strong> atau <strong>Teman Cerita Terlatih</strong>. Sesi lebih lega tanpa diburu waktu, bisa langsung pilih jadwal tanpa ribet bikin akun.
          </p>

          {/* Actions & Social Proof */}
          <div className="flex flex-col items-center gap-4 pt-1 w-full sm:w-auto animate-hero-fade-up [animation-delay:320ms]">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              {/* Standardized Hero Primary: size="pill-lg" (48px, even padding) */}
              <Button
                asChild
                variant="public"
                size="pill-lg"
                className="w-full sm:w-auto shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
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
                className="w-full sm:w-auto active:scale-[0.98] transition-all duration-200"
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
                {heroCounselorsList.map((c, i) => (
                  <Avatar key={i} className="size-7.5 border-2 border-background ring-1 ring-primary/20 shadow-xs hover:scale-110 hover:z-10 transition-transform duration-200">
                    <AvatarImage src={c.src} alt={c.name} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary dark:bg-purple-950 dark:text-purple-300">
                      {c.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" aria-hidden="true" />
                <span>
                  Dipercaya oleh <strong className="font-semibold text-foreground">500+ klien</strong> di seluruh Indonesia
                </span>
              </div>
            </div>
          </div>

          {/* Structured Trust Grid: Balanced 4-card layout with top icon and tactile hover */}
          <div className="w-full max-w-4xl pt-10 border-t border-border/60 animate-hero-fade-up [animation-delay:420ms]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left items-stretch">
              {TRUST_PILLARS.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-4.5 rounded-2xl bg-card/85 backdrop-blur-xs border border-border/80 shadow-2xs hover:border-primary/40 hover:-translate-y-1 hover:shadow-xs transition-all duration-200 flex flex-col gap-3.5 justify-between group"
                  >
                    <div className="size-9.5 sm:size-10 rounded-xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15 group-hover:scale-105 group-hover:bg-primary/15 transition-transform duration-200">
                      <IconComp className="size-4.5 sm:size-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 justify-end">
                      <span className="font-heading font-semibold text-xs sm:text-sm text-foreground tracking-tight line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug line-clamp-1">
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

      {/* 2. Kenapa Memilih Solulu: Asymmetric Bento Grid (Section 11.D Lever 5) */}
      <section id="tentang" className="py-20 sm:py-24 md:py-28 border-b border-border/40 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
          <ScrollReveal variant="fade-up" className="text-center flex flex-col gap-2.5 max-w-xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Kenapa Cerita di Solulu?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Pendampingan yang bikin kamu merasa aman, didengar seutuhnya, dan privasimu selalu terjaga.
            </p>
          </ScrollReveal>

          {/* Asymmetric Bento Grid with rich visual rhythm and no empty cells */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {/* Bento Cell 1: 90 Minutes Hero Spotlight (Col-span 2 on Desktop) */}
            <ScrollReveal variant="fade-up" delay={0} className="md:col-span-2 flex flex-col">
              <div className="h-full p-7 sm:p-8 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.03] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6 shadow-2xs">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="size-12 sm:size-13 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
                      <Clock className="size-6" aria-hidden="true" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:text-purple-300 border border-primary/20">
                      <Sparkles className="size-3 text-primary dark:text-purple-300" aria-hidden="true" />
                      <span>Keunggulan Utama Solulu</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading font-semibold text-lg sm:text-xl md:text-2xl text-foreground tracking-tight text-balance">
                      Durasi 90 Menit Penuh
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl text-pretty">
                      Bukan sesi 45 menit yang serba buru-buru. Kamu punya waktu cukup buat cerita sampai tuntas dan cari jalan keluar bareng.
                    </p>
                  </div>
                </div>

                {/* Graphic Comparison Timeline */}
                <div className="p-4 sm:p-5 rounded-2xl bg-background/80 border border-border/60 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Layanan Biasa (45-50 Menit)</span>
                      <span className="text-muted-foreground text-xs">Terasa buru-buru</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="w-1/2 h-full bg-muted-foreground/30 rounded-full" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary dark:text-purple-300 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-primary dark:bg-purple-400 animate-pulse" />
                        <span>Sesi di Solulu (90 Menit)</span>
                      </span>
                      <span className="font-semibold text-primary dark:text-purple-300 text-xs tabular-nums">2x Lebih Lega</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-primary/20 overflow-hidden relative">
                      <div className="w-full h-full bg-primary rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground pt-0.5">
                      Cukup waktu buat cerita tuntas, urai isi kepala, sampai bikin rencana langkah nyata.
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Bento Cell 2: 100% Rahasia & Anonim (Col-span 1) */}
            <ScrollReveal variant="fade-up" delay={80} className="md:col-span-1 flex flex-col">
              <div className="h-full p-7 sm:p-8 rounded-3xl border border-border/80 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 shadow-2xs">
                <div className="flex flex-col gap-4">
                  <div className="size-12 sm:size-13 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
                    <Lock className="size-6" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading font-semibold text-lg sm:text-xl text-foreground tracking-tight text-balance">
                      100% Rahasia &amp; Aman
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                      Privasimu nomor satu. Bebas pakai nama samaran di panggilan video privat tanpa rekaman sistem, aman sesuai aturan perlindungan data pribadi.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground/80 border border-border/60">
                    Tanpa Rekaman Sistem
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:text-purple-300 border border-primary/20">
                    Sesuai UU Pelindungan Data Pribadi
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Bento Cell 3: Mendengar Tanpa Menghakimi (Col-span 1) */}
            <ScrollReveal variant="fade-up" delay={120} className="md:col-span-1 flex flex-col">
              <div className="h-full p-7 sm:p-8 rounded-3xl border border-border/80 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 shadow-2xs">
                <div className="flex flex-col gap-4">
                  <div className="size-12 sm:size-13 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
                    <Heart className="size-6" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading font-semibold text-lg sm:text-xl text-foreground tracking-tight text-balance">
                      Didengar Tanpa Dihakimi
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                      Ruang yang tenang dan setara. Apa pun ceritamu, nggak ada hal yang salah, berlebihan, atau sepele buat diobrolin bersama.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;Semua perasaanmu itu valid dan berharga buat didengar.&rdquo;
                </div>
              </div>
            </ScrollReveal>

            {/* Bento Cell 4: Rencana Pemulihan Nyata (Col-span 2 on Desktop) */}
            <ScrollReveal variant="fade-up" delay={160} className="md:col-span-2 flex flex-col">
              <div className="h-full p-7 sm:p-8 rounded-3xl border border-border/80 bg-gradient-to-bl from-card via-card to-primary/[0.03] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6 shadow-2xs">
                <div className="flex flex-col gap-4">
                  <div className="size-12 sm:size-13 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
                    <Sparkles className="size-6" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading font-semibold text-lg sm:text-xl md:text-2xl text-foreground tracking-tight text-balance">
                      Bukan Sekadar Curhat
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl text-pretty">
                      Konselor bakal bantu kamu mengurai benang kusut di kepala dan nemuin langkah kecil yang realistis buat dijalani sehari-hari.
                    </p>
                  </div>
                </div>

                {/* Actionable Steps Roadmap Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-background/80 border border-border/60 flex items-center gap-2.5">
                    <span className="size-6 rounded-full bg-primary/10 text-primary dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <span className="text-xs font-medium text-foreground">Urai Pola Pikir</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-background/80 border border-border/60 flex items-center gap-2.5">
                    <span className="size-6 rounded-full bg-primary/10 text-primary dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <span className="text-xs font-medium text-foreground">Latihan Tenangkan Diri</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-background/80 border border-border/60 flex items-center gap-2.5">
                    <span className="size-6 rounded-full bg-primary/10 text-primary dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <span className="text-xs font-medium text-foreground">Langkah Kecil yang Nyata</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 3. Topik yang Sering Dikonsultasikan: Standardized py-20 sm:py-24 md:py-28 padding */}
      <section id="layanan" className="py-20 sm:py-24 md:py-28 border-b border-border/40 bg-muted/25 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8 text-center items-center">
          <ScrollReveal variant="fade-up" className="flex flex-col gap-2.5 max-w-xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
              Cerita yang Sering Dibawa ke Sesi
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Bawa apa pun yang lagi mengganjal di pikiranmu. Nggak ada masalah yang terlalu kecil atau memalukan buat diobrolin.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 w-full text-left">
            {TOPIC_CATEGORIES.map((cat, idx) => (
              <ScrollReveal
                key={idx}
                variant="fade-up"
                delay={idx * 70}
                className="flex flex-col"
              >
                <div className="h-full p-7 sm:p-8 rounded-2xl bg-card border border-border/80 flex flex-col gap-4 shadow-2xs hover:border-purple-500/30 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-purple-600" aria-hidden="true" />
                    <span className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider">
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {cat.topics.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 border border-border/60 text-xs font-medium text-foreground/90 transition-colors cursor-default"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal variant="fade" delay={150}>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Punya unek-unek lain di luar topik di atas? Konselor kami siap mendengarkan cerita unikmu.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. Pilihan Layanan & Biaya (Pricing): Balanced card proportions, tactile hover lift */}
      <section id="harga" className="py-20 sm:py-24 md:py-28 border-b border-border/40 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
          <ScrollReveal variant="fade-up" className="text-center flex flex-col items-center gap-2.5 max-w-xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pilihan Layanan &amp; Biaya
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Tarif pasti dan transparan untuk 90 menit penuh, tanpa biaya pendaftaran atau biaya tambahan tersembunyi.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch pt-6 sm:pt-7 max-w-4xl mx-auto w-full">
            {/* Tier 1: Konseling Sebaya */}
            <ScrollReveal variant="fade-up" delay={0} className="flex flex-col">
              <Card className="h-full relative border border-border/80 shadow-xs flex flex-col justify-between rounded-2xl bg-card hover:border-primary/40 hover:shadow-sm hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:text-purple-300 shrink-0 ring-1 ring-primary/15">
                      <HeartHandshake className="size-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <CardTitle className="font-heading text-lg sm:text-xl font-bold text-foreground">
                        Konseling Sebaya
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                        Teman Cerita &amp; Pendengar Aktif (Sarjana Psikologi Terlatih)
                      </CardDescription>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex flex-col gap-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums whitespace-nowrap">
                        {formatRupiah(peerActivePrice)}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0 whitespace-nowrap"> / 90 menit</span>
                    </div>
                    {peerHasDiscount && (
                      <div className="pt-0.5 pb-2">
                        <span className="text-sm sm:text-base font-medium text-muted-foreground line-through tabular-nums">
                          {formatRupiah(pricing.peer.basePrice)}
                        </span>
                      </div>
                    )}
                    <div className="h-5 flex items-center">
                      <span className="text-xs text-muted-foreground">1 sesi privat tanpa perlu beli paket langganan</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 sm:px-7 flex flex-col gap-4 text-xs sm:text-sm text-muted-foreground flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Sarjana Psikologi (S.Psi) terverifikasi resmi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Mendengarkan dengan hangat, tanpa menghakimi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Bantu petakan perasaan dan pikiran yang lagi kusut</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Panggilan Zoom privat tanpa rekaman otomatis</span>
                    </li>
                  </ul>

                  <div className="mt-auto pt-4 border-t border-border/60">
                    <div className="rounded-xl bg-muted/40 p-3.5 text-xs sm:text-sm text-foreground/80 leading-relaxed border border-border/40 min-h-[76px] flex flex-col justify-center">
                      <div>
                        <strong className="text-foreground">Cocok buat kamu yang:</strong> Lagi stres sehari-hari, butuh teman curhat yang aman, bingung arah masa depan, atau lagi penyesuaian di tempat baru.
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-7 pt-2">
                  <Button
                    asChild
                    variant="public-secondary"
                    size="pill"
                    className="w-full active:scale-[0.98] transition-all duration-200"
                    id="btn-pricing-peer"
                  >
                    <Link href="/counselors?type=peer">
                      <span>Pilih Konselor Sebaya</span>
                      <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>

            {/* Tier 2: Psikolog Klinis (Featured Flagship) */}
            <ScrollReveal variant="fade-up" delay={100} className="flex flex-col">
              <Card className="h-full relative border-2 border-primary dark:border-purple-400 shadow-[0_12px_36px_-10px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_36px_-10px_rgba(124,58,237,0.3)] hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-2xl bg-card overflow-visible">
                {/* Floating Pill Badge: whitespace-nowrap and solid contrast with subtle shimmer */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30 whitespace-nowrap inline-flex items-center gap-1.5 z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                  <Sparkles className="size-3 text-primary-foreground/90 shrink-0 relative z-10" aria-hidden="true" />
                  <span className="relative z-10">Rekomendasi Tenaga Profesional</span>
                </div>

                <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
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
                        {formatRupiah(psychologistActivePrice)}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0 whitespace-nowrap"> / 90 menit</span>
                    </div>
                    {psychologistHasDiscount && (
                      <div className="pt-0.5 pb-2">
                        <span className="text-sm sm:text-base font-medium text-muted-foreground line-through tabular-nums">
                          {formatRupiah(pricing.psychologist.basePrice)}
                        </span>
                      </div>
                    )}
                    <div className="h-5 flex items-center">
                      <span className="text-xs text-primary dark:text-purple-300 font-medium">1 sesi mendalam bersama psikolog berizin Kementerian Kesehatan</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 sm:px-7 flex flex-col gap-4 text-xs sm:text-sm text-muted-foreground flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="font-medium text-foreground">Psikolog klinis berpendidikan S2 Profesi resmi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Izin resmi praktik dari Kementerian Kesehatan</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Metode terapi ilmiah untuk bantu pulihkan pikiran dan emosi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="size-4 text-primary dark:text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Rencana langkah pemulihan yang bertahap dan terarah</span>
                    </li>
                  </ul>

                  <div className="mt-auto pt-4 border-t border-border/60">
                    <div className="rounded-xl bg-primary/10 p-3.5 text-xs sm:text-sm text-foreground/90 leading-relaxed border border-primary/20 min-h-[76px] flex flex-col justify-center">
                      <div>
                        <strong className="text-primary dark:text-purple-300">Cocok buat kamu yang:</strong> Merasa cemas berlebih, mood lama murung, punya luka masa lalu, atau ada keluhan yang mulai ganggu aktivitas harian.
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-7 pt-2">
                  <Button
                    asChild
                    variant="public"
                    size="pill"
                    className="w-full shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] transition-all"
                    id="btn-pricing-psychologist"
                  >
                    <Link href="/counselors?type=psychologist">
                      <span>Pilih Psikolog Klinis</span>
                      <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 5. Mitra Konselor Berpengalaman: Standardized py-20 sm:py-24 md:py-28 & uniform card padding p-6 */}
      <section id="partner" className="py-20 sm:py-24 md:py-28 border-b border-border/40 bg-muted/25 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-10">
          <ScrollReveal variant="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-lg">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
                Mitra Konselor Berpengalaman
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                Semua konselor kami sudah diverifikasi ijazah profesi dan izin resminya dari Kementerian Kesehatan, jadi kamu bisa ngobrol dengan tenang dan nyaman.
              </p>
            </div>

            {/* Standardized Header Action: size="pill-sm" (h-9, px-4) */}
            <Button
              asChild
              variant="public-secondary"
              size="pill-sm"
              className="shrink-0 active:scale-[0.98]"
              id="btn-counselors-all"
            >
              <Link href="/counselors">
                <span>Lihat Semua Konselor</span>
                <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {featuredCounselors.map((c, cIdx) => {
              const cPriceData = pricing[c.type]
              const cActivePrice = cPriceData.isSaleActive ? cPriceData.promoPrice : cPriceData.basePrice
              const cHasDiscount = cPriceData.isSaleActive && cPriceData.promoPrice < cPriceData.basePrice
              const cRateFormatted = formatRupiah(cActivePrice)
              const cOriginalRateFormatted = formatRupiah(cPriceData.basePrice)

              return (
                <ScrollReveal
                  key={c.id}
                  variant="fade-up"
                  delay={cIdx * 80}
                  className="flex flex-col"
                >
                  <Card
                    className="h-full group p-0 py-0 gap-0 ring-0 border border-border/80 shadow-xs hover:border-purple-500/40 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between rounded-2xl bg-card overflow-hidden"
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
                        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
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
                          <BadgeCheck className="size-4.5 text-primary dark:text-purple-300 shrink-0" aria-label="Terverifikasi" />
                        </div>
                        <p className="text-xs font-medium text-primary dark:text-purple-300 line-clamp-1">
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
                            className="text-xs font-medium text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/40 whitespace-nowrap"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

                      {/* Rate / Fee Row */}
                      <div className="pt-3.5 mt-auto border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Tarif per sesi (90 menit):</span>
                        <div className="flex flex-col items-end">
                          <strong className="text-foreground font-heading font-bold text-base sm:text-lg tabular-nums">
                            {cRateFormatted}
                          </strong>
                          {cHasDiscount && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums leading-tight">
                              {cOriginalRateFormatted}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    {/* 3. Action Button */}
                    <CardFooter className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                      <Button
                        asChild
                        variant="public"
                        size="pill"
                        className="w-full shadow-2xs hover:shadow active:scale-[0.98] transition-all"
                        id={`btn-counselor-${c.id}`}
                      >
                        <Link href={`/counselors?id=${c.id}`}>
                          <span>Pilih Jadwal Konseling</span>
                          <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. Pengalaman Klien di Solulu: Standardized py-20 sm:py-24 md:py-28 & uniform card padding p-6 */}
      <section id="testimoni" className="py-20 sm:py-24 md:py-28 border-b border-border/40 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
          <ScrollReveal variant="fade-up" className="text-center flex flex-col gap-2 max-w-lg mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Cerita Mereka yang Pernah Konseling
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Cerita jujur dari klien yang sudah mencoba sesi (nama dan identitas disamarkan demi menjaga privasi).
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {displayTestimonials.map((t, idx) => (
              <ScrollReveal
                key={idx}
                variant="fade-up"
                delay={idx * 80}
                className="flex flex-col"
              >
                <div className="h-full p-7 rounded-2xl bg-card border border-border/80 flex flex-col justify-between gap-4 shadow-2xs hover:border-primary/35 hover:-translate-y-1 hover:shadow-sm transition-all duration-200">
                  {/* 1. Header with testimonial headline & Quote icon */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground leading-snug">
                      {t.title}
                    </h3>
                    <Quote className="size-5 text-primary/30 shrink-0 mt-0.5" aria-hidden="true" />
                  </div>

                  {/* 2. Pure Distilled Quote */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* 3. Essential Author Context & Topic Pill */}
                  <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-xs sm:text-sm text-foreground">
                      {t.author}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground/90">
                      {t.topic}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pertanyaan yang Sering Diajukan: Standardized py-20 sm:py-24 md:py-28 & uniform padding p-6 */}
      <section id="faq" className="py-20 sm:py-24 md:py-28 border-b border-border/40 bg-muted/25 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <ScrollReveal variant="fade-up" className="text-center flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
              Biar kamu makin yakin, ini jawaban seputar cara konseling, pemilihan jadwal, dan privasimu.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={80}>
            <FaqAccordion faqs={FAQS} />
          </ScrollReveal>

          {/* Quick Support Callout */}
          <ScrollReveal variant="fade" delay={150} className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Masih punya pertanyaan sebelum memesan jadwal?{" "}
              <a
                href="https://wa.me/6285144909949?text=Halo%20Solulu!%20Saya%20ingin%20tanya%20tentang%20sesi%20konseling."
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary dark:text-purple-300 font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Tanya langsung lewat WhatsApp kami
              </a>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. Call To Action Banner: Standardized py-20 sm:py-24 md:py-28 & size="pill-lg" (48px) */}
      <section id="privasi" className="py-20 sm:py-24 md:py-28 border-b border-border/40 bg-background scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal variant="scale-up" duration={600}>
            <div className="rounded-3xl bg-radial-[at_50%_0%] from-purple-800 via-purple-950 to-slate-950 text-white p-10 sm:p-14 md:p-16 text-center flex flex-col items-center gap-6 shadow-xl relative overflow-hidden border border-purple-700/40">
              {/* Ambient Calming Radiance */}
              <div
                className="absolute -top-24 -right-24 size-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none animate-calm-breath"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-24 -left-24 size-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none animate-calm-breath [animation-delay:3.5s]"
                aria-hidden="true"
              />

              <div className="size-13 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200 ring-1 ring-white/15 relative z-10">
                <Heart className="size-6 fill-purple-300/30 text-purple-200" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-2.5 max-w-xl relative z-10">
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-balance text-white">
                  Siap Buat Lebih Lega Hari Ini?
                </h2>
                <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-normal text-pretty">
                  Kamu nggak perlu nunggu masalah numpuk sampai kewalahan buat cari teman bicara. Pilih konselor dan jadwal yang paling nyaman buatmu sekarang.
                </p>
              </div>

              {/* Standardized Footer CTA: size="pill-lg" (48px, even padding, matching Hero) */}
              <Button
                asChild
                variant="public-white"
                size="pill-lg"
                className="shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                id="btn-footer-cta"
              >
                <Link href="/counselors">
                  <span>Pilih Jadwal Konseling Sekarang</span>
                  <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-purple-200/80 font-medium tabular-nums pt-2 border-t border-white/10 w-full max-w-lg">
                <span>90 Menit Penuh</span>
                <span>•</span>
                <span>Panggilan Video Privat Tanpa Rekaman</span>
                <span>•</span>
                <span>100% Rahasia</span>
                <span>•</span>
                <span>Tanpa Perlu Bikin Akun</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicShell>
  )
}
