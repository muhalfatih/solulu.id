import * as React from "react"
import Link from "next/link"
import { Compass, Search, MessageSquare, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { PublicShell } from "@/components/public/public-shell"

interface SessionInvalidViewProps {
  token?: string
  error?: string
}

export function SessionInvalidView({ token, error }: SessionInvalidViewProps) {
  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"

  const helpDeskUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Tim Solulu, saya tidak dapat membuka tautan ruang sesi: ${token || "(tanpa token)"}`
  )}`

  return (
    <PublicShell>
      <div className="relative flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center justify-center">
        {/* Calming Ambient Breathing Aura */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[300px] bg-gradient-to-b from-violet-400/20 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-violet-800/20 dark:via-purple-950/10"
          aria-hidden="true"
        />

        <Card className="w-full rounded-3xl border border-violet-100 dark:border-border/80 shadow-[0_20px_50px_-12px_rgba(124,58,237,0.12)] bg-card/95 backdrop-blur-sm overflow-hidden text-center gap-0">
          <CardHeader className="flex flex-col items-center gap-3 p-6 sm:p-8 border-b border-border/40">
            <div className="size-16 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 flex items-center justify-center border border-violet-200/80 dark:border-violet-900/60 shadow-2xs mb-1">
              <Compass className="size-8" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight font-heading text-foreground">
              Tautan Sesi Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed text-pretty text-muted-foreground pt-1">
              Kami tidak dapat menemukan jadwal sesi konseling yang cocok dengan tautan ini.
              Hal ini dapat terjadi jika tautan belum lengkap, sesi telah kedaluwarsa, atau terdapat kesalahan penulisan.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
            {token && (
              <div className="rounded-2xl bg-violet-50/50 dark:bg-muted/40 border border-violet-100 dark:border-border/60 p-3 text-xs text-muted-foreground font-mono break-all">
                Token / Kode: {token}
              </div>
            )}
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button asChild variant="public" size="pill" className="w-full h-11">
                <Link href="/cek-sesi" className="flex items-center justify-center gap-2">
                  <Search data-icon="inline-start" className="size-4" />
                  <span>Cari Sesi Saya di /cek-sesi</span>
                </Link>
              </Button>

              <Button asChild variant="public-secondary" size="pill" className="w-full h-11">
                <a href={helpDeskUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <MessageSquare data-icon="inline-start" className="size-4" />
                  <span>Bantuan Tim Solulu via WhatsApp</span>
                </a>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/40 p-6 sm:p-8 bg-violet-50/20 dark:bg-muted/10 flex flex-col gap-2 text-xs text-muted-foreground rounded-b-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-semibold text-primary"
            >
              <ArrowLeft className="size-3.5" /> Kembali ke Beranda Solulu
            </Link>
            <p className="text-[11px] text-muted-foreground/80">
              Solulu menjamin privasi dan kerahasiaan setiap interaksi Anda.
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicShell>
  )
}
