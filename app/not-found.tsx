import Link from "next/link"
import { Compass, Home, Search, HeartHandshake, PhoneCall, ArrowRight } from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <PublicShell hideWhatsApp>
      <div className="relative overflow-hidden flex-1 flex items-center justify-center py-16 sm:py-20 lg:py-28 px-4 sm:px-6 bg-radial-[at_50%_0%] from-purple-100/70 via-background to-background dark:from-purple-950/25 dark:via-background dark:to-background border-b border-border/40 min-h-[calc(100vh-16rem)]">
        {/* Authored Breathing Ambient Aura (Napas Tenang) */}
        <div
          className="absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] md:w-[780px] h-[260px] sm:h-[380px] bg-gradient-to-b from-purple-400/20 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/25 dark:via-purple-950/15"
          aria-hidden="true"
        />

        <div className="max-w-lg w-full mx-auto rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xs p-6 sm:p-10 shadow-xl shadow-purple-500/5 text-center flex flex-col items-center gap-6">
          {/* Brand Icon Badge */}
          <div className="size-16 sm:size-18 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-8 ring-purple-500/5 flex items-center justify-center shadow-xs">
            <Compass className="size-8 sm:size-9" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold shadow-2xs">
              <span>404 - Halaman Tidak Ditemukan</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
              Wah, Halamannya Nggak Ketemu
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Halaman yang kamu cari mungkin sudah berpindah alamat atau tautannya kurang pas. Yuk, kembali ke ruang aman Solulu.
            </p>
          </div>

          {/* Quick Recovery Options */}
          <div className="w-full flex flex-col gap-2.5 pt-1">
            <Button
              asChild
              variant="public"
              size="pill-lg"
              className="w-full shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98] transition-all font-semibold"
            >
              <Link href="/">
                <Home className="size-4 mr-2" />
                <span>Kembali ke Beranda Solulu</span>
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
              <Button
                asChild
                variant="outline"
                size="pill"
                className="w-full text-xs font-medium border-border/80 hover:bg-muted/40"
              >
                <Link href="/cek-sesi">
                  <Search className="size-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                  <span>Cek Tautan Sesi</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="pill"
                className="w-full text-xs font-medium border-border/80 hover:bg-muted/40"
              >
                <Link href="/counselors">
                  <HeartHandshake className="size-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                  <span>Pilih Konselor</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Emergency Hotline Alert */}
          <div className="w-full p-4 rounded-xl border border-border/80 bg-muted/20 text-xs flex flex-col gap-1.5 text-left">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <PhoneCall className="size-3.5 text-purple-600 dark:text-purple-400" />
              Butuh Bantuan Krisis Cepat?
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Jika kamu atau kerabat sedang dalam kondisi darurat mental, hubungi Layanan Kesehatan Jiwa Kemenkes di{" "}
              <strong className="text-foreground">119 ext 8</strong> atau Hotline LISA di{" "}
              <strong className="text-foreground">0811-3855-472</strong>.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
