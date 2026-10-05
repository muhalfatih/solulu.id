"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { PublicShell } from "@/components/public/public-shell"

interface BookingSuccessClientProps {
  data: {
    booking: {
      id: string
      accessToken: string
      patientName: string
      patientEmail: string
      patientPhone: string
      status: string
    }
    counselor: {
      id: string
      fullName: string
      title: string
      counselorType: string
      counselorTypeDisplay: string
      avatarR2Url: string | null
    }
    schedule: {
      id: string
      date: string
      startTime: string
      endTime: string
      timeRange: string
    }
    transaction: {
      id: string
      paymentProvider: string
      paymentMethod: string | null
      referenceNumber: string | null
      grossAmount: number
      discountAmount: number
      netAmount: number
      netAmountFormatted: string
      status: string
    } | null
  }
}

export default function BookingSuccessClient({ data }: BookingSuccessClientProps) {
  const { booking, counselor, schedule, transaction } = data
  const [copiedLink, setCopiedLink] = React.useState(false)

  const sessionUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/${booking.accessToken}`
      : `/session/${booking.accessToken}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"

  const helpDeskUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Tim Solulu, saya ingin bertanya terkait sesi konseling dengan token: ${booking.accessToken}`
  )}`

  return (
    <PublicShell>
      <div className="relative flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 md:py-20 flex flex-col items-center">
        {/* Calming Ambient Breathing Aura */}
        <div
          className="absolute -top-16 sm:-top-24 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] md:w-[720px] h-[280px] sm:h-[380px] bg-gradient-to-b from-purple-400/15 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/20 dark:via-purple-950/10"
          aria-hidden="true"
        />

        {/* Celebration Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3.5">
          <div className="size-18 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5 shadow-2xs">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
            <Sparkles className="size-3.5" />
            <span>Status Pemesanan: Terkonfirmasi</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance leading-[1.2]">
              Pemesanan Sesi Berhasil Terkonfirmasi
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty">
              Terima kasih, <span className="font-semibold text-foreground">{booking.patientName}</span>. Ruang telekonseling privat Anda telah disiapkan.
            </p>
          </div>
        </div>

        {/* Primary CTA: Buka Halaman Sesi Saya Sekarang */}
        <div className="w-full mb-8">
          <Button
            asChild
            variant="public"
            size="pill-lg"
            className="w-full h-12 sm:h-13 text-sm sm:text-base font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg active:scale-[0.99] transition-all"
            id="btn-open-session"
          >
            <Link href={`/session/${booking.accessToken}`}>
              <span>Buka Halaman Sesi Saya Sekarang</span>
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2.5">
            Anda dapat langsung mengakses ruang sesi tanpa perlu registrasi akun atau kata sandi.
          </p>
        </div>

        {/* Session Details Card */}
        <Card className="w-full rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all mb-6 overflow-hidden gap-0">
          <CardHeader className="p-6 sm:p-7 border-b border-border/40">
            <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Rincian Jadwal Konseling
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              Informasi lengkap jadwal dan akses ruang telekonseling privat 90 menit Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 flex flex-col gap-5 text-xs sm:text-sm">
            {/* Counselor */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/60">
              <Avatar className="size-12 rounded-xl border border-border/80 shrink-0">
                {counselor.avatarR2Url ? (
                  <AvatarImage src={counselor.avatarR2Url} alt={counselor.fullName} />
                ) : null}
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {counselor.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-foreground truncate">{counselor.fullName}</span>
                  <Badge variant="outline" className="rounded-full text-[10px] font-medium border-primary/20 text-primary bg-primary/5 py-0">
                    {counselor.counselorTypeDisplay}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">{counselor.title}</span>
              </div>
            </div>

            {/* Time details */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Tanggal Sesi:</span>
                </span>
                <span className="font-semibold text-foreground">{schedule.date}</span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Waktu Konseling:</span>
                </span>
                <span className="font-semibold text-foreground">{schedule.timeRange}</span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Video className="size-3.5 text-primary" />
                  <span>Platform Pertemuan:</span>
                </span>
                <span className="font-semibold text-foreground">Zoom Meeting Privat (90 Menit Penuh)</span>
              </div>

              {transaction?.referenceNumber && (
                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Kode Referensi:</span>
                  <span className="font-mono font-medium text-foreground">
                    {transaction.referenceNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Session Link Copy Box */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Tautan Sesi Rahasia Anda:</span>
                <span className="text-[11px] text-muted-foreground">Simpan tautan ini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background px-3 py-2 rounded-xl border border-border/80 text-xs font-mono truncate text-muted-foreground">
                  {sessionUrl}
                </div>
                <Button
                  type="button"
                  variant="public-secondary"
                  size="pill-sm"
                  onClick={handleCopyLink}
                  className="h-9 px-3.5 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" data-icon="inline-start" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" data-icon="inline-start" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preparation Tips Card */}
        <Card className="w-full rounded-2xl border border-border/80 shadow-xs bg-muted/20 hover:shadow-sm transition-all mb-6 overflow-hidden gap-0">
          <CardHeader className="p-6 sm:p-7 border-b border-border/40">
            <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Sparkles className="size-4.5 text-primary" />
              <span>Panduan Menjelang Sesi</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              Langkah sederhana agar proses konseling berjalan nyaman dan optimal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 flex flex-col gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Akses Zoom Aktif H-10 Menit:</strong> Tombol Masuk Ruang Zoom pada halaman sesi akan berubah menjadi hijau dan dapat diklik 10 menit sebelum jadwal dimulai.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Tempat yang Nyaman &amp; Privat:</strong> Pastikan Anda berada di ruangan yang tenang agar proses konseling berjalan aman dan leluasa.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Tersedia Pemulihan Tautan:</strong> Jika Anda kehilangan tautan, buka menu <code>/cek-sesi</code> menggunakan email Anda.
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-6 sm:p-7 border-t border-border/40 bg-muted/10">
            <a
              href={helpDeskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1.5 font-medium"
            >
              <HelpCircle className="size-4" />
              <span>Ada pertanyaan? Hubungi Bantuan Solulu via WhatsApp</span>
            </a>
          </CardFooter>
        </Card>
      </div>
    </PublicShell>
  )
}

