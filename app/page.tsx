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
  Calendar,
  Video,
  Star,
  Users,
  Lock,
  ChevronDown,
  Smile,
  ShieldAlert,
  HelpCircle,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { PublicShell } from "@/components/public/public-shell"

export const metadata = {
  title: "Solulu — Ruang Konseling Online Mental Health & Self Care",
  description:
    "Ruang aman dan privat untuk konseling online bersama Psikolog Profesional dan Partner Cerita/Konselor Sebaya. Durasi penuh 90 menit, appointment < 24 jam, 100% rahasia.",
}

const FEATURED_COUNSELORS = [
  {
    id: "c-1",
    name: "Sarah Annisa, M.Psi., Psikolog",
    role: "Psikolog Profesional",
    type: "psychologist" as const,
    education: "Magister Profesi Psikologi Klinis • STR Aktif",
    specializations: ["Kecemasan (Anxiety)", "Trauma", "Burnout Karir", "Regulasi Emosi"],
    rate: "Rp 130.000",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    rating: 4.9,
    experience: "4+ Tahun",
  },
  {
    id: "c-2",
    name: "Rian Hidayat, S.Psi",
    role: "Partner Cerita / Konselor",
    type: "peer" as const,
    education: "S1 Psikologi • Fasilitator Konseling Sebaya",
    specializations: ["Quarter-life Crisis", "Stres Kuliah & Kerja", "Relasi Asmara", "Self-Love"],
    rate: "Rp 85.000",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    rating: 4.8,
    experience: "3+ Tahun",
  },
  {
    id: "c-3",
    name: "Dr. Nadia Larasati, M.Psi",
    role: "Psikolog Profesional",
    type: "psychologist" as const,
    education: "Magister Psikologi Klinis • ACT Practitioner",
    specializations: ["Depresi Ringan-Sedang", "Insecurity", "Grief & Kehilangan", "Penerimaan Diri"],
    rate: "Rp 130.000",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    rating: 5.0,
    experience: "6+ Tahun",
  },
]

const TOPICS = [
  "Overthinking",
  "Homesick & Anak Rantau",
  "Quarter-life Crisis",
  "Burnout Pekerjaan",
  "Toxic Relationship",
  "Hubungan & Keluarga",
  "Pengembangan Diri & Insecurity",
  "Stres Akademik & Skripsi",
]

const WHY_SOLULU = [
  {
    title: "Aman & Rahasia",
    desc: "Tanpa nama asli, percakapan dan identitasmu sepenuhnya terjaga secara privat.",
    icon: Lock,
  },
  {
    title: "Nyaman & Hangat",
    desc: "Seperti curhat ke bestie yang mengerti, bebas rasa sungkan dan cemas.",
    icon: Smile,
  },
  {
    title: "Bukan Menghakimi",
    desc: "Kami hadir untuk mendengarkan dengan penuh empati, bukan untuk menilai atau memvonis.",
    icon: Heart,
  },
  {
    title: "Solutif & Reflektif",
    desc: "Bukan cuma didengar, tapi dibantu merapikan benang kusut pikiran dengan solusi terarah.",
    icon: Sparkles,
  },
  {
    title: "Fleksibel & Cepat",
    desc: "Janji temu tersedia kurang dari 24 jam via Zoom privat tanpa perlu registrasi akun.",
    icon: Clock,
  },
]

const TESTIMONIALS = [
  {
    initials: "D.A.",
    author: "Mahasiswa, 21 tahun",
    topic: "Kecemasan Berbicara & Kerja",
    highlight: "Tidak merasa sendirian lagi",
    counselor: "Sarah Annisa, M.Psi",
    quote: "Awalnya ragu mau cerita ke orang lain, tapi partner ceritanya beneran bikin nyaman. Sekarang nggak merasa sendirian lagi dan durasi 90 menit bikin lega.",
  },
  {
    initials: "A.P.",
    author: "Karyawan Swasta, 26 tahun",
    topic: "Quarter-life Crisis & Burnout",
    highlight: "Punya arah keluar dari masalah",
    counselor: "Rian Hidayat, S.Psi",
    quote: "Burnout kerja bikin aku hampir menyerah. Setelah sesi di Solulu, aku diajak melihat masalah dari sudut pandang yang lebih jernih dan terstruktur.",
  },
  {
    initials: "M.F.",
    author: "Fresh Graduate, 23 tahun",
    topic: "Regulasi Emosi & Overthinking",
    highlight: "Pulih perlahan dari luka emosional",
    counselor: "Dr. Nadia Larasati, M.Psi",
    quote: "Healing yang sebenarnya. Bukan cuma didengar, tapi diajak refleksi bareng sampai nemu titik terangnya. Teknik grounding-nya sangat membantu.",
  },
]

const FAQS = [
  {
    question: "Apa perbedaan antara Partner Cerita/Konselor dan Psikolog Profesional?",
    answer:
      "Partner Cerita / Konselor adalah lulusan Sarjana Psikologi (S.Psi) terlatih yang berfokus pada pendampingan suportif untuk keluhan stres harian, quarter-life crisis, burnout, dan ruang curhat hangat. Sementara Psikolog Profesional adalah lulusan Magister Profesi Psikologi dengan Surat Tanda Registrasi (STR) aktif yang berwenang memberikan intervensi klinis mendalam (seperti kecemasan akut, depresi, trauma masa lalu).",
  },
  {
    question: "Berapa lama durasi satu sesi konseling di Solulu?",
    answer:
      "Setiap sesi konseling di Solulu berdurasi penuh 90 menit melalui tautan Zoom Meeting privat. Durasi 90 menit memberikan ruang yang lega untuk bercerita tanpa terburu-buru, mengeksplorasi akar masalah, dan merumuskan langkah penanganan.",
  },
  {
    question: "Apakah saya harus mendaftar akun atau menginstal aplikasi khusus?",
    answer:
      "Tidak perlu. Solulu menerapkan sistem guest-first checkout. Anda cukup memilih jadwal, memasukkan nama (boleh inisial/nama samaran), WhatsApp, dan email. Ruang Zoom privat dapat diakses langsung dari peramban web ponsel atau laptop Anda.",
  },
  {
    question: "Bagaimana jika saya berhalangan hadir pada jam yang dijadwalkan?",
    answer:
      "Anda dapat mengajukan perubahan jadwal (reschedule) secara mandiri melalui halaman sesi hingga minimal 12 jam sebelum sesi dimulai (Aturan H-12), untuk menghormati alokasi waktu mitra konselor kami.",
  },
  {
    question: "Bagaimana Solulu menjamin kerahasiaan data dan cerita saya?",
    answer:
      "Kerahasiaan dan privasi adalah komitmen utama kami. Seluruh data dilindungi sesuai ketentuan UU PDP No. 27/2022. Sesi telekonseling Zoom bersifat privat dan tidak pernah direkam secara otomatis oleh sistem.",
  },
]

export default function HomePage() {
  return (
    <PublicShell>

      {/* 2. Hero Section: "Saatnya #CeritaDiSolulu" */}
      <section className="relative overflow-hidden pt-14 pb-20 md:py-24 border-b border-border/60 bg-gradient-to-b from-purple-500/5 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6">
          <Badge
            variant="outline"
            className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25 gap-1.5 py-1.5 px-4 rounded-full shadow-xs"
          >
            <Heart className="size-3.5 text-purple-600 dark:text-purple-400 fill-purple-600/30" />
            <span>Ruang Aman untuk Cerita</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] max-w-4xl">
            Saatnya{" "}
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              #CeritaDiSolulu
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Konseling online yang aman, cepat, dan penuh empati.
            <br className="hidden sm:block" />
            Pilih <strong>Partner Cerita</strong> atau <strong>Psikolog Profesional</strong> sesuai kebutuhanmu.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-xs sm:text-sm font-semibold h-12 px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-600/25 transition-transform hover:-translate-y-0.5"
              id="btn-hero-primary"
            >
              <Link href="/counselors">
                <span>Mulai Cerita Sekarang</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-xs sm:text-sm font-medium h-12 px-6 rounded-full border-border/80 hover:bg-purple-500/5 hover:text-purple-600 gap-2"
              id="btn-hero-secondary"
            >
              <Link href="#harga">
                <Sparkles className="size-4 text-purple-600" />
                <span>Lihat Pilihan Paket</span>
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Dipercaya oleh 500+ klien di seluruh Indonesia • Durasi penuh 90 menit per sesi
          </p>

          {/* Trust Value Badges (4 Pills from solulu.id) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 w-full max-w-3xl text-xs">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-purple-500/15 bg-card shadow-xs">
              <Clock className="size-4 text-purple-600 shrink-0" />
              <span className="font-medium text-foreground">Appointment &lt; 24 jam</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-purple-500/15 bg-card shadow-xs">
              <ShieldCheck className="size-4 text-purple-600 shrink-0" />
              <span className="font-medium text-foreground">100% Rahasia</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-purple-500/15 bg-card shadow-xs">
              <Sparkles className="size-4 text-purple-600 shrink-0" />
              <span className="font-medium text-foreground">Konselor &amp; Psikolog</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-purple-500/15 bg-card shadow-xs">
              <HeartHandshake className="size-4 text-purple-600 shrink-0" />
              <span className="font-medium text-foreground">Solutif &amp; Empatik</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tentang Solulu & Kenapa Solulu */}
      <section id="tentang" className="py-20 md:py-24 border-b border-border/60 bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-14">
          <div className="text-center flex flex-col gap-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
              Tentang Solulu
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Apa itu <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Solulu</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Solulu adalah ruang konseling non-klinis dan klinis yang aman dan privat, hadir untuk kamu yang ingin <strong>didengarkan</strong>, <strong>dipahami</strong>, dan <strong>diarahkan</strong> secara sehat.
            </p>
          </div>

          {/* Quote Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5 border border-purple-500/20 shadow-sm max-w-3xl mx-auto text-center flex flex-col gap-4">
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed">
              &ldquo;Kami percaya bahwa <strong>tidak semua orang yang ingin curhat sedang bermasalah</strong>. Banyak orang hanya ingin memahami diri, mengurai beban pikiran, dan bertumbuh.&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Di Solulu, kamu bukan sekadar bercerita. Kamu diajak merenung, memahami pola diri, dan melihat persoalan dengan perspektif yang lebih jernih.
            </p>
          </div>

          {/* 5 Pillars: Kenapa Solulu */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-foreground">
              Kenapa Memilih Solulu?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {WHY_SOLULU.map((item, idx) => {
                const IconComp = item.icon
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-center text-center gap-3 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <IconComp className="size-6" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{item.title}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Layanan & Topik Konseling */}
      <section id="layanan" className="py-20 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-10 items-center text-center">
          <div className="flex flex-col gap-3 max-w-2xl">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
              Layanan Kami
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Konselor Sebaya &amp; <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Psikolog Profesional</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Pilih Partner Cerita untuk ruang curhat hangat &amp; perspektif baru, atau Psikolog Profesional untuk pendampingan klinis yang lebih mendalam.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
            {TOPICS.map((topic, idx) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground hover:border-purple-500/40 hover:bg-purple-500/10 transition-colors cursor-default"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricelist Section (Pilih Pendampingmu) */}
      <section id="harga" className="py-20 border-b border-border/60 bg-muted/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
              Pricelist Layanan
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Pilih <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Pendampingmu</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tarif transparan tanpa biaya pendaftaran, tanpa biaya tersembunyi, dan sudah mencakup durasi penuh 90 menit per sesi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
            {/* Card 1: Partner Cerita / Konselor Sebaya */}
            <Card className="border border-border/80 shadow-xs flex flex-col justify-between rounded-3xl overflow-hidden hover:border-purple-500/40 transition-colors bg-card">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">
                    💜
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Konseling Single
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Partner Cerita / Konselor Sebaya
                    </CardDescription>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    Rp 85.000
                  </span>
                  <span className="text-xs text-muted-foreground"> / 90 menit</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex flex-col gap-3 text-xs text-muted-foreground flex-1">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Lulusan Sarjana Psikologi (S.Psi) terlatih</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Mendengarkan aktif dengan empati hangat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Refleksi diri &amp; pemetaan benang kusut</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Ruang Zoom privat tanpa rekaman otomatis</span>
                  </li>
                </ul>

                <div className="p-3 rounded-2xl bg-secondary/70 text-[11px] leading-relaxed mt-auto">
                  <strong className="text-foreground">Cocok untuk:</strong> Stres harian, curhat aman, quarter-life crisis, dan adaptasi lingkungan baru.
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-3">
                <Button asChild className="w-full h-11 text-xs font-semibold rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-2">
                  <Link href="/counselors?type=peer">
                    <span>Pilih Konselor Sebaya</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Card 2: Psikolog Profesional (Paling Populer) */}
            <Card className="border-2 border-purple-600 shadow-md flex flex-col justify-between rounded-3xl overflow-hidden relative bg-card">
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-2xl">
                Paling Populer
              </div>

              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">
                    🧠
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Sesi Psikolog
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Psikolog Profesional Ber-STR
                    </CardDescription>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    Rp 130.000
                  </span>
                  <span className="text-xs text-muted-foreground"> / 90 menit</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex flex-col gap-3 text-xs text-muted-foreground flex-1">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Magister Profesi Psikologi (M.Psi., Psikolog)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Surat Tanda Registrasi (STR) aktif Kemenkes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Metode CBT, ACT, dan regulasi emosi klinis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Rekomendasi penanganan &amp; rencana aksi</span>
                  </li>
                </ul>

                <div className="p-3 rounded-2xl bg-purple-500/10 text-[11px] leading-relaxed mt-auto text-purple-900 dark:text-purple-200">
                  <strong className="text-foreground">Cocok untuk:</strong> Kecemasan mendalam (anxiety), depresi, trauma emosional, dan penanganan klinis terstruktur.
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-3">
                <Button asChild className="w-full h-11 text-xs font-semibold rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm shadow-purple-600/25">
                  <Link href="/counselors?type=clinical">
                    <span>Pilih Psikolog Profesional</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Card 3: Paket 3 Sesi (Hemat) */}
            <Card className="border border-border/80 shadow-xs flex flex-col justify-between rounded-3xl overflow-hidden hover:border-purple-500/40 transition-colors bg-card relative">
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b border-l border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-2xl">
                Hemat Rp 30.000
              </div>

              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">
                    ✨
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Paket 3 Sesi
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pendampingan Intensif &amp; Berkala
                    </CardDescription>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    Rp 225.000
                  </span>
                  <span className="text-xs text-muted-foreground"> / 3x 90 menit</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex flex-col gap-3 text-xs text-muted-foreground flex-1">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>3 sesi penuh (@ 90 menit) pendampingan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Evaluasi progres bertahap dari sesi ke sesi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Fleksibel tentukan tanggal dan jam konsultasi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
                    <span>Dukungan konsisten agar proses pulih optimal</span>
                  </li>
                </ul>

                <div className="p-3 rounded-2xl bg-secondary/70 text-[11px] leading-relaxed mt-auto">
                  <strong className="text-foreground">Cocok untuk:</strong> Mengurai masalah kompleks, membangun kebiasaan emosional baru, dan proses pemulihan konsisten.
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-3">
                <Button asChild variant="outline" className="w-full h-11 text-xs font-semibold rounded-full border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 gap-2">
                  <Link href="/counselors">
                    <span>Ambil Paket 3 Sesi</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. Partner Cerita Pilihan (Counselor Showcase) */}
      <section id="partner" className="py-20 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-xl">
              <Badge variant="outline" className="w-fit text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
                Partner Cerita Kami
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Mitra Konselor Pilihan &amp; Berpengalaman
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Setiap mitra telah melalui verifikasi ijazah/STR resmi agar Anda merasa aman dan nyaman sepanjang sesi.
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-medium rounded-full gap-1.5 shrink-0">
              <Link href="/counselors">
                <span>Lihat Semua Konselor</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_COUNSELORS.map((c) => (
              <Card key={c.id} className="border border-border/80 shadow-xs flex flex-col justify-between rounded-3xl overflow-hidden hover:border-purple-500/40 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="size-14 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                    />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sm tracking-tight text-foreground truncate">
                        {c.name}
                      </span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">{c.role}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{c.education}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[11px] rounded-full ${
                        c.type === "psychologist"
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                      }`}
                    >
                      {c.type === "psychologist" ? "Psikolog Ber-STR" : "Konselor Sebaya"}
                    </Badge>
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <Star className="size-3.5 text-amber-500 fill-amber-500" />
                      <span>{c.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.specializations.map((spec) => (
                      <span key={spec} className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tarif sesi (90 mnt):</span>
                    <strong className="text-foreground text-sm font-bold">{c.rate}</strong>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/60 p-5">
                  <Button asChild size="sm" className="w-full text-xs font-semibold h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                    <Link href={`/counselors?id=${c.id}`}>
                      <span>Reservasi Sesi</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Curated Client Testimonials */}
      <section id="testimoni" className="py-20 border-b border-border/60 bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
              Testimoni Klien
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Cerita di Solulu = <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Hidup Lebih Ringan</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ulasan asli dari klien yang telah menyelesaikan sesi bersama mitra kami (nama disamarkan demi privasi).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="border border-border/80 shadow-xs bg-card rounded-3xl flex flex-col justify-between p-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      {t.highlight}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed pt-2">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>— {t.author}</span>
                  <span className="font-medium text-foreground">{t.counselor}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Privasi & Keamanan (Komitmen Solulu) */}
      <section id="privasi" className="py-20 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-8 items-center">
          <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
            Privasi &amp; Keamanan
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Privasi Klien adalah <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Prioritas Utama</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full">
            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 flex items-start gap-3.5">
              <Lock className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-semibold text-foreground block mb-0.5">Semua sesi privat &amp; rahasia</strong>
                <p className="text-xs text-muted-foreground">Percakapan hanya berlangsung antara kamu dan konselor penanggung jawab.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 flex items-start gap-3.5">
              <Smile className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-semibold text-foreground block mb-0.5">Tidak perlu nama asli</strong>
                <p className="text-xs text-muted-foreground">Gunakan nama samaran atau inisial jika membuatmu merasa lebih aman bercerita.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 flex items-start gap-3.5">
              <Video className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-semibold text-foreground block mb-0.5">Tidak ada rekaman tanpa izin</strong>
                <p className="text-xs text-muted-foreground">Sesi telekonseling Zoom tidak pernah direkam secara otomatis oleh sistem.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/60 flex items-start gap-3.5">
              <ShieldCheck className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-semibold text-foreground block mb-0.5">Kepatuhan UU PDP No. 27/2022</strong>
                <p className="text-xs text-muted-foreground">Seluruh data identitas dan catatan sesi dilindungi enkripsi standar industri.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions (FAQ) */}
      <section className="py-20 border-b border-border/60 bg-muted/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-3 py-1 rounded-full">
              Pusat Bantuan
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jawaban seputar mekanisme konseling, penjadwalan, dan privasi sesi Anda.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group p-5 rounded-2xl border border-border/80 bg-card open:border-purple-500/40 transition-colors"
              >
                <summary className="font-semibold text-xs sm:text-sm text-foreground cursor-pointer flex items-center justify-between list-none">
                  <span>{faq.question}</span>
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-2" />
                </summary>
                <p className="pt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Warm Call To Action Banner */}
      <section className="py-20 bg-gradient-to-b from-purple-500/10 to-purple-500/5 border-b border-purple-500/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6">
          <div className="size-16 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center text-3xl">
            💬
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Siap untuk <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Cerita</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Kamu tidak harus menunggu masalah menjadi berat untuk mencari bantuan. Kadang, kita hanya butuh ruang dan orang yang tepat untuk membantu mengurai apa yang sedang terjadi.
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2 shadow-lg shadow-purple-600/25"
          >
            <Link href="/counselors">
              <span>Mulai Cerita Sekarang</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

    </PublicShell>
  )
}
