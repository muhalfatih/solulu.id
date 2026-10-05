import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  CreditCard,
  QrCode,
  HelpCircle,
  BadgeCheck,
  CalendarCheck,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { PublicShell } from "@/components/public/public-shell"
import { getPlatformPricing } from "@/lib/pricing/platform-pricing"
import { formatRupiah } from "@/lib/booking/checkout"

export const metadata = {
  title: "Biaya & Pilihan Layanan Konseling | Solulu",
  description:
    "Biaya transparan konseling 90 menit bareng Psikolog Klinis dan Konselor Sebaya di Solulu. Tanpa biaya tersembunyi, bayar mudah via QRIS & Virtual Account.",
}

export default async function PublicPricingPage() {
  const pricing = await getPlatformPricing()
  const peerActivePrice = pricing.peer.isSaleActive ? pricing.peer.promoPrice : pricing.peer.basePrice
  const peerHasDiscount = pricing.peer.isSaleActive && pricing.peer.promoPrice < pricing.peer.basePrice
  const psychologistActivePrice = pricing.psychologist.isSaleActive
    ? pricing.psychologist.promoPrice
    : pricing.psychologist.basePrice
  const psychologistHasDiscount =
    pricing.psychologist.isSaleActive && pricing.psychologist.promoPrice < pricing.psychologist.basePrice
  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 flex flex-col gap-14 sm:gap-16">
        {/* 1. Hero & Value Proposition */}
        <section className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold shadow-2xs">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Biaya Terbuka &amp; Ramah di Kantong #CeritaDiSolulu</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance">
            Biaya Jelas, Tanpa Biaya Tersembunyi
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty max-w-2xl">
            Setiap sesi konseling berlangsung penuh <strong className="text-foreground font-semibold">90 menit</strong> lewat panggilan video privat. Waktunya cukup panjang buat kamu cerita sampai tuntas dan nemuin langkah nyata ke depan.
          </p>

          {/* Quick Value Pillars */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/70 text-foreground/90 font-medium shadow-2xs">
              <Clock className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>90 Menit Penuh</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/70 text-foreground/90 font-medium shadow-2xs">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Rahasia &amp; Boleh Pakai Nama Samaran</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/70 text-foreground/90 font-medium shadow-2xs">
              <QrCode className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Bayar Cepat via QRIS &amp; VA</span>
            </span>
          </div>
        </section>

        {/* 2. Dual Pricing Cards Comparison */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full items-stretch">
          {/* Tier 1: Konselor Sebaya */}
          <Card className="border border-border/80 shadow-xs flex flex-col justify-between rounded-2xl hover:border-purple-500/40 hover:shadow-sm transition-all bg-card overflow-hidden">
            <CardHeader className="p-7 pb-4">
              <div className="flex items-center justify-between mb-3.5">
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span>Dukungan Teman Sebaya</span>
                </span>
                <span className="h-7 px-2.5 rounded-full bg-secondary text-xs font-semibold text-purple-700 dark:text-purple-300 border border-border/60 inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>90 Menit</span>
                </span>
              </div>
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold pt-1 text-foreground">
                Konseling Sebaya
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal text-muted-foreground text-pretty leading-relaxed pt-1">
                Didampingi Sarjana Psikologi (S.Psi) terlatih buat bantu urai stres sehari-hari, rasa bimbang di usia 20-an, atau sekadar jadi teman curhat yang aman.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 flex flex-col gap-6">
              {/* Price display */}
              <div className="flex flex-col gap-1 pb-2 border-b border-border/60">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground tabular-nums">
                    {formatRupiah(peerActivePrice)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    / sesi (90 menit)
                  </span>
                </div>
                {peerHasDiscount && (
                  <div className="pt-0.5 pb-2">
                    <span className="text-sm sm:text-base font-medium text-muted-foreground line-through tabular-nums">
                      {formatRupiah(pricing.peer.basePrice)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground text-xs">
                    Tarif tetap tanpa harus langganan paket
                  </span>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="flex flex-col gap-3.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium text-pretty leading-relaxed">
                    Pendampingan hangat, mendengarkan aktif tanpa rasa takut dihakimi
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Cocok buat urusan kuliah, skripsi, adaptasi kerja baru, dan masalah asmara
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Latihan tenangkan diri, olah napas sederhana, dan cara urai emosi
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Ruang Zoom privat satu-lawan-satu dengan privasi 100% aman
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-7 pt-4 border-t border-border/60">
              <Button
                asChild
                variant="public-secondary"
                size="pill"
                className="w-full"
                id="btn-pricing-peer"
              >
                <Link href="/counselors?type=peer">
                  <span>Pilih Konselor Sebaya</span>
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tier 2: Psikolog Klinis (Flagship / Recommended) */}
          <Card className="border-2 border-purple-500/80 ring-4 ring-purple-500/10 shadow-lg flex flex-col justify-between rounded-2xl relative bg-card md:-translate-y-2 transition-all hover:shadow-xl overflow-hidden bg-gradient-to-b from-purple-500/[0.03] via-card to-card">
            <CardHeader className="p-7 pb-4">
              <div className="flex items-center justify-between mb-3.5">
                <span className="inline-flex items-center gap-1.5 h-7 px-3.5 rounded-full bg-[#7c3aed] text-white text-xs font-semibold shadow-xs">
                  <Sparkles className="size-3" />
                  <span>Rekomendasi Tenaga Profesional</span>
                </span>
                <span className="h-7 px-2.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-500/20 inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>90 Menit</span>
                </span>
              </div>
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold pt-1 text-foreground">
                Psikolog Klinis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal text-muted-foreground text-pretty leading-relaxed pt-1">
                Didampingi Magister Psikologi Profesi (M.Psi., Psikolog) berizin resmi Kementerian Kesehatan buat penanganan emosional yang lebih mendalam.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 flex flex-col gap-6">
              {/* Price display */}
              <div className="flex flex-col gap-1 pb-2 border-b border-border/60">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground tabular-nums">
                    {formatRupiah(psychologistActivePrice)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    / sesi (90 menit)
                  </span>
                </div>
                {psychologistHasDiscount && (
                  <div className="pt-0.5 pb-2">
                    <span className="text-sm sm:text-base font-medium text-muted-foreground line-through tabular-nums">
                      {formatRupiah(pricing.psychologist.basePrice)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground text-xs">
                    Tarif resmi tetap tanpa biaya admin tambahan
                  </span>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="flex flex-col gap-3.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-foreground font-semibold text-pretty leading-relaxed">
                    Pemetaan mendalam terhadap akar masalah dan keluhan yang kamu rasakan
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Pendekatan terapi ilmiah buat bantu pulihkan pikiran dan emosi
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Penanganan rasa cemas berlebih, serangan panik, depresi, dan trauma
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-pretty leading-relaxed">
                    Rencana langkah pemulihan terarah dan catatan evaluasi sesi buat panduanmu
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-7 pt-4 border-t border-border/60">
              <Button
                asChild
                variant="public"
                size="pill"
                className="w-full"
                id="btn-pricing-psychologist"
              >
                <Link href="/counselors?type=psychologist">
                  <span>Pilih Psikolog Klinis</span>
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* 4. Payment Methods Supported */}
        <section className="p-7 sm:p-8 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-2 max-w-md">
            <span className="font-heading font-bold text-base sm:text-lg text-foreground flex items-center gap-2.5">
              <CreditCard className="size-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Pilihan Pembayaran Cepat &amp; Otomatis</span>
            </span>
            <p className="text-xs sm:text-sm text-muted-foreground text-pretty leading-relaxed">
              Bisa bayar instan kapan saja selama 24 jam lewat QRIS (semua e-wallet dan m-banking), Virtual Account bank nasional, atau transfer manual.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Enkripsi Aman 256-bit</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Verifikasi Otomatis</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center gap-1.5 shadow-2xs">
              <QrCode className="size-3.5 text-purple-600" />
              <span>QRIS (Semua E-Wallet)</span>
            </span>
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center shadow-2xs">
              BCA VA
            </span>
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center shadow-2xs">
              Mandiri VA
            </span>
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center shadow-2xs">
              BRI VA
            </span>
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center shadow-2xs">
              BNI VA
            </span>
            <span className="h-8 px-3 rounded-full bg-secondary border border-border/70 text-foreground inline-flex items-center shadow-2xs">
              Transfer Manual
            </span>
          </div>
        </section>

        {/* 5. Pricing FAQ */}
        <section className="flex flex-col gap-8 max-w-3xl mx-auto w-full pt-2">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
              Pertanyaan Seputar Biaya Layanan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
              Informasi jelas seputar voucer diskon, ganti jadwal, jaminan privasi, dan kepastian sesi.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-xs sm:text-sm leading-relaxed">
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-2xs hover:border-purple-500/30 transition-colors flex flex-col gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Apakah saya bisa menggunakan kode voucer diskon?</span>
              </span>
              <p className="text-muted-foreground text-pretty pl-6 leading-relaxed">
                Bisa banget! Kalau kamu punya kode promo, voucer komunitas, atau kerja sama kampus, kamu tinggal masukkan kodenya saat mengisi data pemesanan. Potongan harga bakal otomatis memotong total biaya sebelum pembayaran.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-2xs hover:border-purple-500/30 transition-colors flex flex-col gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <CalendarCheck className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Bagaimana kalau saya berhalangan hadir pada jam yang dijadwalkan?</span>
              </span>
              <p className="text-muted-foreground text-pretty pl-6 leading-relaxed">
                Kamu bisa mengajukan ganti jadwal secara gratis maksimal 1 kali, asalkan diajukan paling lambat 12 jam sebelum sesi dimulai. Ini penting biar jadwal konselor kami bisa dialokasikan dengan baik buat yang membutuhkan.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-2xs hover:border-purple-500/30 transition-colors flex flex-col gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Apakah ada jaminan kalau konselor mendadak berhalangan?</span>
              </span>
              <p className="text-muted-foreground text-pretty pl-6 leading-relaxed">
                Tentu ada. Kalau konselor mendadak berhalangan karena kondisi darurat, tim Solulu bakal langsung nawarin pilihan jadwal prioritas pengganti di waktu terdekat atau pengembalian dana 100% tanpa potongan apa pun.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-2xs hover:border-purple-500/30 transition-colors flex flex-col gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <Lock className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Bagaimana tautan sesi Zoom dikirimkan setelah pembayaran?</span>
              </span>
              <p className="text-muted-foreground text-pretty pl-6 leading-relaxed">
                Tautan Zoom privat bakal otomatis dikirimkan ke email kamu segera setelah pembayaran terkonfirmasi. Kamu juga bisa mengecek tautan sesimu kapan saja lewat menu &ldquo;Cek Sesi&rdquo; cukup dengan memasukkan alamat email yang terdaftar.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Bottom Reassurance & Final CTA Banner */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-900 to-[#7c3aed] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight">
              Siap Memulai Cerita Tanpa Ragu?
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 max-w-lg leading-relaxed text-pretty">
              Temukan konselor yang cocok dan amankan jadwalmu hari ini. 100% terjaga kerahasiaannya tanpa perlu ribet registrasi akun.
            </p>
          </div>
          <Button
            asChild
            className="h-11 px-6 text-sm font-semibold rounded-full bg-white text-purple-950 hover:bg-purple-50 shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
          >
            <Link href="/counselors">
              <span>Pilih Konselor Sekarang</span>
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </section>
      </div>
    </PublicShell>
  )
}

