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
  HeartHandshake,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export const metadata = {
  title: "Biaya & Paket Layanan Telekonseling",
  description:
    "Transparansi biaya telekonseling 90 menit bersama Psikolog Klinis dan Konselor Sebaya di Solulu. Tanpa biaya tersembunyi, opsi bayar QRIS & Virtual Account.",
}

export default function PublicPricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
              S
            </div>
            <span className="font-bold text-base tracking-tight">Solulu</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/counselors"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Katalog Konselor
            </Link>
            <Link
              href="/screening"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Skrining SRQ-20
            </Link>
            <Button asChild size="sm" className="h-8 text-xs font-medium">
              <Link href="/counselors">Mulai Konseling</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col gap-14">
        {/* Title Section */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            Transparansi Biaya Layanan
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Investasi Terjangkau untuk Kesehatan Jiwa Anda
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Semua sesi berdurasi penuh <strong>90 menit</strong> untuk eksplorasi masalah yang mendalam tanpa terburu-buru. Tanpa biaya pendaftaran tersembunyi.
          </p>
        </div>

        {/* Pricing Cards Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Tier 1: Konselor Sebaya */}
          <Card className="border border-border/80 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                  Dukungan Teman Sebaya
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3 text-primary" /> 90 Menit
                </span>
              </div>
              <CardTitle className="text-2xl font-bold pt-2">Konselor Sebaya</CardTitle>
              <CardDescription className="text-xs">
                Didampingi lulusan Sarjana Psikologi (S.Psi) terlatih untuk mendampingi stres harian &amp; tempat curhat aman.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">Rp 50.000</span>
                <span className="text-xs text-muted-foreground">/ sesi (90 mnt)</span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Konseling suportif berbasis active listening &amp; empathy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pendampingan quarter-life crisis, stres kuliah, dan relasi</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Latihan regulasi emosi dasar &amp; journaling terarah</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Ruang aman tanpa stigma dan kerahasiaan terjaga</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border/60">
              <Button asChild variant="outline" className="w-full text-xs font-semibold h-10 gap-2">
                <Link href="/counselors?type=peer">
                  <span>Pilih Konselor Sebaya</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tier 2: Psikolog Klinis */}
          <Card className="border-2 border-primary/50 shadow-md flex flex-col justify-between relative bg-card">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="text-xs bg-primary text-primary-foreground font-semibold px-3 shadow-xs">
                Rekomendasi Klinis Mendalam
              </Badge>
            </div>

            <CardHeader className="pb-4 pt-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                  Profesional Berlisensi (STR)
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3 text-primary" /> 90 Menit
                </span>
              </div>
              <CardTitle className="text-2xl font-bold pt-2">Psikolog Klinis</CardTitle>
              <CardDescription className="text-xs">
                Didampingi Psikolog Klinis Dewasa/Anak ber-STR resmi untuk penanganan masalah psikologis terstruktur.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">Rp 150.000</span>
                <span className="text-xs text-muted-foreground">/ sesi (90 mnt)</span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Asesmen psikologis komprehensif &amp; evaluasi riwayat keluhan</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pendekatan berbasis bukti ilmiah: CBT, ACT, Mindfulness, DBT</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Penanganan gangguan kecemasan (GAD/Panic), depresi, dan trauma</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Rencana aksi terstruktur &amp; catatan sesi klinis privat</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border/60">
              <Button asChild className="w-full text-xs font-semibold h-10 gap-2 bg-primary text-primary-foreground">
                <Link href="/counselors?type=psychologist">
                  <span>Pilih Psikolog Klinis</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Methods Supported */}
        <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Metode Pembayaran Mudah &amp; Otomatis
            </span>
            <p className="text-xs text-muted-foreground">
              Dukungan pembayaran instan melalui Xendit Invoice maupun Transfer Bank Manual.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-background border border-border">QRIS</span>
            <span className="px-2.5 py-1 rounded-md bg-background border border-border">BCA VA</span>
            <span className="px-2.5 py-1 rounded-md bg-background border border-border">Mandiri VA</span>
            <span className="px-2.5 py-1 rounded-md bg-background border border-border">BRI VA</span>
            <span className="px-2.5 py-1 rounded-md bg-background border border-border">Transfer Bank</span>
          </div>
        </div>

        {/* Pricing FAQ */}
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pt-4">
          <div className="text-center flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Pertanyaan Seputar Biaya Layanan</h2>
            <p className="text-xs text-muted-foreground">Informasi penting mengenai diskon, kode voucher, dan tata cara pembayaran.</p>
          </div>

          <div className="flex flex-col gap-3 text-xs leading-relaxed">
            <div className="p-4 rounded-xl border border-border/80 bg-background flex flex-col gap-1.5">
              <span className="font-semibold text-foreground">Apakah saya bisa menggunakan kode voucher diskon?</span>
              <p className="text-muted-foreground">
                Ya! Jika Anda memiliki kode promosi atau voucher kerja sama, Anda dapat memasukkannya di halaman ringkasan reservasi (*checkout*). Diskon akan langsung memotong total pembayaran Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-background flex flex-col gap-1.5">
              <span className="font-semibold text-foreground">Bagaimana jika saya berhalangan hadir pada jam yang dijadwalkan?</span>
              <p className="text-muted-foreground">
                Anda dapat mengajukan perubahan jadwal (*reschedule*) secara gratis maksimal 1 kali, asalkan diajukan minimal 12 jam sebelum sesi dimulai (Aturan H-12). Hubungi Admin atau gunakan fitur pada sesi Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-background flex flex-col gap-1.5">
              <span className="font-semibold text-foreground">Apakah ada jaminan uang kembali bila konselor tidak hadir?</span>
              <p className="text-muted-foreground">
                Tentu. Apabila mitra konselor tidak hadir karena keadaan darurat tak terduga, tim kami akan menawarkan opsi pergantian jadwal prioritas atau pengembalian dana 100%.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-8 mt-auto text-xs text-muted-foreground text-center">
        <p>© 2026 Solulu Indonesia. Semua harga dalam Rupiah (IDR) dan sudah termasuk pajak.</p>
      </footer>
    </div>
  )
}
