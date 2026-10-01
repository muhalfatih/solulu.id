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
import { ThemeToggle } from "@/components/theme-toggle"

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
    <div className="theme-public min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#7c3aed]" />
            Solulu
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 md:py-20 flex flex-col items-center justify-center">
        <Card className="w-full rounded-2xl border-border/80 shadow-sm text-center">
          <CardHeader className="flex flex-col items-center gap-3 pb-4">
            <div className="size-16 rounded-full bg-purple-500/10 flex items-center justify-center text-[#7c3aed] ring-8 ring-purple-500/5 mb-1">
              <Compass className="size-8" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold tracking-tight font-heading">
              Tautan Sesi Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-balance">
              Kami tidak dapat menemukan jadwal sesi konseling yang cocok dengan tautan ini.
              Hal ini dapat terjadi jika tautan belum lengkap, sesi telah kedaluwarsa, atau terdapat kesalahan penulisan.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 pt-2">
            {token && (
              <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5 text-xs text-muted-foreground font-mono break-all">
                Token: {token}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <Button asChild variant="public" size="pill" className="w-full">
                <Link href="/cek-sesi" className="flex items-center justify-center gap-2">
                  <Search data-icon="inline-start" />
                  <span>Cari Sesi Saya di /cek-sesi</span>
                </Link>
              </Button>

              <Button asChild variant="public-secondary" size="pill" className="w-full">
                <a href={helpDeskUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <MessageSquare data-icon="inline-start" />
                  <span>Bantuan Tim Solulu via WhatsApp</span>
                </a>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 pt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" /> Kembali ke Beranda Solulu
            </Link>
            <p className="text-[11px] text-muted-foreground/80">
              Solulu menjamin privasi dan kerahasiaan setiap interaksi Anda.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
