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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm tracking-tight text-foreground">
            Solulu
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col items-center">
        {/* Celebration Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Pemesanan Sesi Berhasil Terkonfirmasi
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
              Terima kasih, <span className="font-semibold text-foreground">{booking.patientName}</span>. Ruang telekonseling privat Anda telah disiapkan.
            </p>
          </div>
        </div>

        {/* Primary CTA: Buka Halaman Sesi Saya Sekarang */}
        <div className="w-full mb-8">
          <Button
            asChild
            size="lg"
            className="w-full h-12 text-sm font-semibold gap-2 shadow-xs cursor-pointer"
          >
            <Link href={`/session/${booking.accessToken}`}>
              <span>Buka Halaman Sesi Saya Sekarang</span>
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Anda dapat langsung mengakses ruang sesi tanpa perlu registrasi akun atau kata sandi.
          </p>
        </div>

        {/* Session Details Card */}
        <Card className="w-full border-border/60 mb-6">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">Rincian Jadwal Konseling</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4 text-xs">
            {/* Counselor */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
              <Avatar className="size-11 border border-border/80">
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
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{counselor.fullName}</span>
                  <Badge variant="outline" className="text-[9px] py-0">
                    {counselor.counselorTypeDisplay}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">{counselor.title}</span>
              </div>
            </div>

            {/* Time details */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Tanggal:</span>
                </span>
                <span className="font-semibold text-foreground">{schedule.date}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Waktu Konseling:</span>
                </span>
                <span className="font-semibold text-foreground">{schedule.timeRange}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Video className="size-3.5 text-primary" />
                  <span>Platform Pertemuan:</span>
                </span>
                <span className="font-semibold text-foreground">Zoom Meeting Privat (90 Menit)</span>
              </div>

              {transaction?.referenceNumber && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Kode Referensi:</span>
                  <span className="font-mono font-medium text-foreground">
                    {transaction.referenceNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Session Link Copy Box */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">Tautan Sesi Rahasia Anda:</span>
                <span className="text-[10px] text-muted-foreground">Simpan tautan ini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background px-2.5 py-1.5 rounded-lg border border-border/80 text-[11px] font-mono truncate text-muted-foreground">
                  {sessionUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 text-xs shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3 text-emerald-600" data-icon="inline-start" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" data-icon="inline-start" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preparation Tips Card */}
        <Card className="w-full border-border/60 mb-6 bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Panduan Menjelang Sesi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Akses Zoom Aktif H-10 Menit:</strong> Tombol Masuk Ruang Zoom pada halaman sesi akan berubah menjadi hijau dan dapat diklik 10 menit sebelum jadwal dimulai.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Tempat yang Nyaman & Privat:</strong> Pastikan Anda berada di ruangan yang tenang agar proses konseling berjalan aman dan leluasa.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Tersedia Pemulihan Tautan:</strong> Jika Anda kehilangan tautan, buka menu <code>/cek-sesi</code> menggunakan email Anda.
              </span>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/40">
            <a
              href={helpDeskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <HelpCircle className="size-3.5" />
              <span>Ada pertanyaan? Hubungi Bantuan Solulu via WhatsApp</span>
            </a>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
