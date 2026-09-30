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
import { PublicShell } from "@/components/public/public-shell"

export const metadata = {
  title: "Biaya & Paket Layanan Telekonseling",
  description:
    "Transparansi biaya telekonseling 90 menit bersama Psikolog Klinis dan Konselor Sebaya di Solulu. Tanpa biaya tersembunyi, opsi bayar QRIS & Virtual Account.",
}

export default function PublicPricingPage() {
  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 flex flex-col gap-16">
        {/* Title Section */}
        <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1] text-balance">
            Biaya Layanan Terbuka &amp; Terjangkau
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
            Semua sesi telekonseling berdurasi penuh <strong>90 menit</strong> agar kamu punya ruang yang cukup untuk mengurai masalah dan merumuskan langkah pemulihan nyata.
          </p>
        </div>

        {/* Pricing Cards Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full items-stretch">
          {/* Tier 1: Konselor Sebaya */}
          <Card className="border border-border/80 shadow-xs flex flex-col justify-between rounded-3xl hover:border-purple-500/40 hover:shadow-md transition-all bg-card">
            <CardHeader className="p-7 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                  Dukungan Teman Sebaya
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 tabular-nums">
                  <Clock className="size-3.5 text-purple-600" /> 90 Menit
                </span>
              </div>
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold pt-1 text-foreground">Konselor Sebaya</CardTitle>
              <CardDescription className="text-xs font-medium text-pretty">
                Didampingi lulusan Sarjana Psikologi (S.Psi) terlatih untuk mendampingi stres harian &amp; tempat curhat aman.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 flex flex-col gap-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground tabular-nums">Rp 50.000</span>
                <span className="text-xs text-muted-foreground font-medium tabular-nums">/ sesi (90 mnt)</span>
              </div>

              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium text-pretty">Pendampingan suportif dengan menyimak aktif dan penuh penerimaan</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-pretty">Pendampingan quarter-life crisis, stres kuliah, dan relasi</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-pretty">Latihan regulasi emosi dasar &amp; journaling terarah</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-pretty">Ruang cerita aman tanpa stigma dengan kerahasiaan terjaga</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-7 pt-4 border-t border-border/60">
              <Button asChild variant="outline" className="w-full text-sm font-bold h-12 rounded-full gap-2 border-border/80 hover:bg-secondary">
                <Link href="/counselors?type=peer">
                  <span>Pilih Konselor Sebaya</span>
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tier 2: Psikolog Klinis (Flagship) */}
          <Card className="border-2 border-purple-600 dark:border-purple-400 shadow-xl flex flex-col justify-between rounded-3xl relative bg-card md:-translate-y-2 transition-all hover:shadow-2xl">
            <CardHeader className="p-7 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                  Rekomendasi Klinis
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 tabular-nums">
                  <Clock className="size-3.5 text-purple-600" /> 90 Menit
                </span>
              </div>
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold pt-1 text-foreground">Psikolog Klinis</CardTitle>
              <CardDescription className="text-xs font-medium text-pretty">
                Didampingi Psikolog Klinis Dewasa/Anak ber-STR resmi untuk penanganan masalah psikologis terstruktur.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 flex flex-col gap-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground tabular-nums">Rp 150.000</span>
                <span className="text-xs text-muted-foreground font-medium tabular-nums">/ sesi (90 mnt)</span>
              </div>

              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="font-semibold text-foreground text-pretty">Pemeriksaan psikologis awal dan evaluasi riwayat keluhan</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-pretty">Pendekatan berbasis bukti ilmiah: CBT, ACT, Mindfulness, DBT</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-pretty">Penanganan kecemasan mendalam, panic attack, depresi, &amp; trauma</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-pretty">Rencana aksi terstruktur &amp; catatan sesi klinis privat</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-7 pt-4 border-t border-border/60">
              <Button asChild className="w-full text-sm font-bold h-12 rounded-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                <Link href="/counselors?type=psychologist">
                  <span>Pilih Psikolog Klinis</span>
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Methods Supported */}
        <div className="p-8 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-1.5">
            <span className="font-heading font-bold text-base text-foreground flex items-center gap-2.5">
              <CreditCard className="size-5 text-purple-600" />
              Metode Pembayaran Otomatis &amp; Instan
            </span>
            <p className="text-xs text-muted-foreground text-pretty">
              Dukungan pembayaran aman melalui QRIS, Virtual Account bank nasional, atau Transfer Manual.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground">QRIS</span>
            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground">BCA VA</span>
            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground">Mandiri VA</span>
            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground">BRI VA</span>
            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground">Transfer Bank</span>
          </div>
        </div>

        {/* Pricing FAQ */}
        <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pt-4">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">Pertanyaan Seputar Biaya Layanan</h2>
            <p className="text-xs text-muted-foreground text-pretty">Informasi penting mengenai voucher diskon, reschedule, dan jaminan sesi.</p>
          </div>

          <div className="flex flex-col gap-3.5 text-xs leading-relaxed">
            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-2">
              <span className="font-heading font-bold text-sm text-foreground text-balance">Apakah saya bisa menggunakan kode voucher diskon?</span>
              <p className="text-muted-foreground text-pretty">
                Ya! Jika Anda memiliki kode promosi atau voucher kerja sama kampus/organisasi, Anda dapat memasukkannya di halaman ringkasan reservasi (*checkout*). Diskon akan langsung memotong total pembayaran Anda.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-2">
              <span className="font-heading font-bold text-sm text-foreground text-balance">Bagaimana jika saya berhalangan hadir pada jam yang dijadwalkan?</span>
              <p className="text-muted-foreground text-pretty">
                Anda dapat mengajukan perubahan jadwal (*reschedule*) secara gratis maksimal 1 kali, asalkan diajukan minimal 12 jam sebelum sesi dimulai (Aturan H-12) demi menghormati alokasi waktu konselor kami.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-2">
              <span className="font-heading font-bold text-sm text-foreground text-balance">Apakah ada jaminan bila konselor berhalangan hadir?</span>
              <p className="text-muted-foreground text-pretty">
                Tentu. Apabila mitra konselor berhalangan karena keadaan darurat tak terduga, tim Solulu akan segera menawarkan opsi pergantian jadwal prioritas atau pengembalian dana 100%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
