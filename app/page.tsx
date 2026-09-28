import * as React from "react"
import Link from "next/link"
import {
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
  Compass,
  PhoneCall,
  Search,
  ExternalLink,
  Lock,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata = {
  title: "Solulu — Telekonseling Kesehatan Mental Hangat & Terpercaya",
  description:
    "Ruang digital yang menenangkan untuk telekonseling kesehatan mental bersama Psikolog Klinis dan Konselor Sebaya. Skrining mandiri SRQ-20, reservasi instan, dan privasi medis terjamin.",
}

const FEATURED_COUNSELORS = [
  {
    id: "c-1",
    name: "Sarah Annisa, M.Psi., Psikolog",
    role: "Psikolog Klinis Dewasa",
    type: "psychologist" as const,
    specializations: ["Kecemasan (Anxiety)", "Trauma", "Burnout Karir"],
    rate: "Rp 150.000",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    rating: 4.9,
    experience: "4+ Tahun",
  },
  {
    id: "c-2",
    name: "Rian Hidayat, S.Psi",
    role: "Konselor Sebaya Senior",
    type: "peer" as const,
    specializations: ["Quarter-life Crisis", "Stres Akademik", "Relasi"],
    rate: "Rp 50.000",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    rating: 4.8,
    experience: "3+ Tahun",
  },
  {
    id: "c-3",
    name: "Dr. Nadia Larasati, M.Psi",
    role: "Psikolog Klinis & ACT Practitioner",
    type: "psychologist" as const,
    specializations: ["Depresi Ringan-Sedang", "Regulasi Emosi", "Grief"],
    rate: "Rp 150.000",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    rating: 5.0,
    experience: "6+ Tahun",
  },
]

const TESTIMONIALS = [
  {
    initials: "D.A.",
    topic: "Kecemasan Berbicara & Kerja",
    counselor: "Sarah Annisa, M.Psi",
    stars: 5,
    quote: "Rasanya sangat didengar tanpa sedikit pun dihakimi. Durasi 90 menit membuat saya tidak merasa terburu-buru menceritakan beban yang dipendam berbulan-bulan.",
  },
  {
    initials: "A.P.",
    topic: "Quarter-life Crisis & Burnout",
    counselor: "Rian Hidayat, S.Psi",
    stars: 5,
    quote: "Pendampingan dari teman sebaya terasa seperti mengobrol dengan sahabat yang paham teori psikologi. Latihan journaling yang diajarkan sangat membantu hari-hari saya.",
  },
  {
    initials: "M.F.",
    topic: "Regulasi Emosi & Overthinking",
    counselor: "Dr. Nadia Larasati, M.Psi",
    stars: 5,
    quote: "Teknik pernapasan dan grounding yang dilatih bersama psikolog langsung saya praktikkan saat serangan panik. Sangat bersyukur menemukan Solulu.",
  },
]

const FAQS = [
  {
    question: "Apa perbedaan antara Konselor Sebaya dan Psikolog Klinis?",
    answer:
      "Psikolog Klinis adalah profesional lulusan Magister Profesi Psikologi yang memiliki Surat Tanda Registrasi (STR) aktif dan berwenang menangani gangguan psikologis klinis (seperti kecemasan berat, depresi, trauma). Sementara Konselor Sebaya adalah lulusan Sarjana Psikologi (S.Psi) terlatih yang berfokus pada pendampingan suportif untuk keluhan stres harian, quarter-life crisis, dan tempat bercerita tanpa vonis klinis.",
  },
  {
    question: "Berapa lama durasi satu sesi konseling di Solulu?",
    answer:
      "Setiap sesi konseling di Solulu berdurasi penuh 90 menit. Kami percaya bahwa waktu 90 menit adalah durasi ideal untuk membangun kenyamanan (*rapport*), mengeksplorasi akar masalah, serta menyusun rencana aksi penanganan mandiri.",
  },
  {
    question: "Apakah saya harus mengunduh aplikasi khusus untuk mengikuti sesi?",
    answer:
      "Tidak perlu. Solulu menggunakan tautan Zoom terenkripsi yang dapat diakses langsung melalui peramban web (*browser*) ponsel atau laptop Anda tanpa registrasi akun yang rumit.",
  },
  {
    question: "Bagaimana jika saya berhalangan hadir pada jam yang dijadwalkan?",
    answer:
      "Anda dapat mengajukan perubahan jadwal (*reschedule*) secara mandiri minimal 12 jam sebelum sesi dimulai (Aturan H-12). Jika kurang dari 12 jam, jadwal terkunci untuk menghormati alokasi waktu konselor.",
  },
  {
    question: "Bagaimana Solulu menjamin kerahasiaan data dan cerita saya?",
    answer:
      "Kami menerapkan perlindungan privasi medis berlapis sesuai UU PDP No. 27/2022. Seluruh catatan klinis dilindungi oleh Row Level Security (RLS) dan dokumen pendukung dienkripsi pada penyimpanan awan privat. Sesi telekonseling tidak pernah direkam secara otomatis.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-tight">Solulu</span>
              <span className="text-xs text-muted-foreground font-medium">Ruang Tenang &amp; Pulih</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link href="/counselors" className="hover:text-foreground transition-colors">
              Katalog Konselor
            </Link>
            <Link href="/screening" className="hover:text-foreground transition-colors flex items-center gap-1">
              <span>Skrining SRQ-20</span>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 py-0 px-1.5">
                Gratis
              </Badge>
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Biaya Layanan
            </Link>
            <Link href="/cek-sesi" className="hover:text-foreground transition-colors">
              Cek Tautan Sesi
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" className="text-xs font-semibold h-9 gap-1.5" id="btn-hero-nav-cta">
              <Link href="/counselors">
                <span>Mulai Konseling</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: "The Grounding Sanctuary" */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-24 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6">
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 gap-1.5 py-1 px-3"
          >
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekosistem Telekonseling Hangat, Terjangkau &amp; Bebas Stigma</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] max-w-4xl">
            Ruang Aman untuk Bercerita, Pulih, dan Bertumbuh
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Dapatkan pendampingan psikologis terpercaya bersama <strong>Psikolog Klinis ber-STR</strong> dan <strong>Konselor Sebaya</strong>. Sesi penuh 90 menit tanpa biaya tersembunyi dan tanpa birokrasi rumit.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto text-xs font-semibold h-11 px-6 gap-2" id="btn-hero-primary">
              <Link href="/screening">
                <Compass className="size-4" />
                <span>Mulai Skrining Mandiri (SRQ-20)</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-xs font-medium h-11 px-6 gap-2" id="btn-hero-secondary">
              <Link href="/counselors">
                <HeartHandshake className="size-4 text-primary" />
                <span>Pilih Mitra Konselor Langsung</span>
              </Link>
            </Button>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 w-full max-w-4xl text-xs text-muted-foreground">
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <Clock className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-left font-medium text-foreground">Sesi Penuh 90 Menit</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-left font-medium text-foreground">Privasi Medis Terjaga</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <Video className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-left font-medium text-foreground">Zoom S2S Privat</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <PhoneCall className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-left font-medium text-foreground">Hotline Krisis 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Clinical Screening Teaser Banner (SRQ-20) */}
      <section className="py-14 border-b border-border/60 bg-muted/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Card className="border border-primary/30 shadow-md bg-gradient-to-br from-card to-primary/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-xl">
              <Badge variant="outline" className="w-fit text-xs bg-primary/10 text-primary border-primary/20">
                Skrining Standar Kemenkes &amp; WHO
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Tidak Yakin Memilih Layanan yang Tepat?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Jawab 20 pertanyaan sederhana untuk mengenali tingkat tekanan emosional Anda. Dapatkan rekomendasi informatif apakah Anda lebih membutuhkan teman cerita di <strong>Konselor Sebaya</strong> atau intervensi mendalam bersama <strong>Psikolog Klinis</strong>.
              </p>
            </div>

            <Button asChild className="h-11 px-6 text-xs font-semibold shrink-0 gap-2" id="btn-screening-banner">
              <Link href="/screening">
                <span>Isi Skrining Gratis (2 Menit)</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* 4. Counselor Showcase Section */}
      <section className="py-16 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-xl">
              <Badge variant="outline" className="w-fit text-xs bg-primary/5 text-primary border-primary/20">
                Tenaga Pendamping Pilihan
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mitra Konselor Hangat &amp; Berpengalaman
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Setiap konselor telah melalui proses verifikasi STR/Ijazah resmi dan pelatihan mendalam agar Anda merasa aman sepanjang perjalanan konseling.
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-medium gap-1.5 shrink-0">
              <Link href="/counselors">
                <span>Lihat Semua Konselor</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_COUNSELORS.map((c) => (
              <Card key={c.id} className="border border-border/80 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="size-12 rounded-xl object-cover border border-border shadow-xs shrink-0"
                    />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sm tracking-tight text-foreground truncate">
                        {c.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{c.role}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        c.type === "psychologist"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {c.type === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}
                    </Badge>
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <Star className="size-3.5 text-amber-500 fill-amber-500" />
                      <span>{c.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {c.specializations.map((spec) => (
                      <span key={spec} className="text-xs px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/60">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tarif per sesi (90 mnt):</span>
                    <strong className="text-foreground text-sm font-bold">{c.rate}</strong>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/60">
                  <Button asChild size="sm" className="w-full text-xs font-semibold h-9 gap-1.5">
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

      {/* 5. How It Works (3 Langkah Sederhana) */}
      <section className="py-16 border-b border-border/60 bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-12 text-center items-center">
          <div className="flex flex-col gap-2 max-w-xl">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-primary/5 text-primary border-primary/20">
              Alur Ramah &amp; Mudah
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              3 Langkah Menuju Ruang Konseling Anda
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Kami memangkas birokrasi registrasi agar pertolongan pertama kesehatan mental dapat hadir secepat mungkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
              <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base tracking-tight text-foreground">
                Pilih Jadwal &amp; Konselor
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tentukan waktu luang Anda dan pilih konselor yang memiliki pendekatan serta fokus topik sesuai keluhan yang dialami.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
              <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base tracking-tight text-foreground">
                Reservasi Tamu Tanpa Akun
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cukup cantumkan nama, WhatsApp, dan email. Bayar instan via QRIS atau Virtual Account tanpa repot membuat kata sandi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
              <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base tracking-tight text-foreground">
                Masuk Ruang Zoom Privat
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Akses halaman sesi privat Anda dengan hitung mundur waktu. Ruang Zoom aman akan terbuka otomatis saat sesi dimulai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Curated Client Testimonials Section */}
      <section className="py-16 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              Cerita Pemulihan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Kata Mereka yang Telah Melangkah
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ulasan asli dari klien yang telah menyelesaikan sesi konseling bersama mitra kami (nama disamarkan demi privasi).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="border border-border/80 shadow-xs bg-muted/20 flex flex-col justify-between p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {t.initials}
                      </div>
                      <span className="font-bold text-xs text-foreground">{t.initials}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="size-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  <span className="text-xs font-medium text-primary">
                    Topik: {t.topic}
                  </span>

                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/60 text-xs text-muted-foreground">
                  Konselor: <strong className="text-foreground">{t.counselor}</strong>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Photo Gallery Preview & Consent Banner */}
      <section className="py-14 border-b border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-6 text-center items-center">
          <div className="flex flex-col gap-2 max-w-lg">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-primary/10 text-primary border-primary/20">
              Dokumentasi &amp; Edukasi Komunitas
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Gerakan Kesadaran Kesehatan Mental Bersama
            </h2>
          </div>

          {/* Sample Community Gallery Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="rounded-xl overflow-hidden border border-border shadow-xs aspect-video relative group">
              <img
                src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80"
                alt="Webinar Kesehatan Mental"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-medium">Webinar Regulasi Burnout Mahasiswa</span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border shadow-xs aspect-video relative group">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
                alt="Workshop Mindfulness Offline"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-medium">Workshop Mindfulness &amp; Relaksasi</span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border shadow-xs aspect-video relative group">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"
                alt="Diskusi Komunitas"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-medium">Sesi Pendampingan Kelompok Sebaya</span>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground gap-1.5 py-1 px-3">
            <Lock className="size-3 text-primary" />
            <span>Seluruh dokumentasi telah disensor dan memperoleh izin eksplisit peserta (Etika Privasi Solulu)</span>
          </Badge>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) */}
      <section className="py-16 border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <Badge variant="outline" className="w-fit mx-auto text-xs bg-primary/5 text-primary border-primary/20">
              Pusat Bantuan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jawaban lengkap seputar mekanisme telekonseling, durasi sesi, dan jaminan keamanan data Anda.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group p-4 rounded-xl border border-border/80 bg-card open:border-primary/40 transition-colors"
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

      {/* 9. Crisis Support Banner */}
      <section className="py-10 bg-destructive/10 border-b border-destructive/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <PhoneCall className="size-6 text-destructive shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-destructive text-sm">
                Butuh Bantuan Krisis Mendesak?
              </span>
              <span className="text-muted-foreground leading-relaxed">
                Jika Anda atau kerabat sedang dalam kondisi darurat yang mengancam keselamatan, hubungi hotline 24/7 di bawah ini:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button asChild size="sm" variant="destructive" className="h-8 text-xs font-semibold">
              <a href="tel:119">Kemenkes: 119 ext 8</a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium border-destructive/30 text-destructive hover:bg-destructive/10">
              <a href="https://wa.me/628113855472" target="_blank" rel="noopener noreferrer">
                Lisa Hotline: 0811-3855-472
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Global Sanctuary Footer */}
      <footer className="bg-card text-foreground border-t border-border/80 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
                  S
                </div>
                <span className="font-bold text-base tracking-tight">Solulu</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Ekosistem telekonseling kesehatan mental yang mudah diakses, ramah di kantong, dan bebas hambatan birokrasi.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-foreground">Layanan Klien</span>
              <Link href="/counselors" className="text-muted-foreground hover:text-foreground transition-colors">
                Katalog Konselor
              </Link>
              <Link href="/screening" className="text-muted-foreground hover:text-foreground transition-colors">
                Skrining SRQ-20
              </Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Biaya Layanan
              </Link>
              <Link href="/cek-sesi" className="text-muted-foreground hover:text-foreground transition-colors">
                Cek Tautan Sesi
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-foreground">Kemitraan</span>
              <Link href="/apply" className="text-muted-foreground hover:text-foreground transition-colors">
                Daftar Mitra Konselor
              </Link>
              <Link href="/counselor/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Portal Konselor
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Masuk Petugas / Admin
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-foreground">Kepatuhan &amp; Hukum</span>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Syarat &amp; Ketentuan
              </Link>
              <span className="text-muted-foreground">Kepatuhan UU PDP No. 27/2022</span>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground">
            <p>© 2026 Solulu Indonesia. Hak cipta dilindungi undang-undang.</p>
            <p>Dibuat dengan kepedulian mendalam untuk kesehatan jiwa Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
