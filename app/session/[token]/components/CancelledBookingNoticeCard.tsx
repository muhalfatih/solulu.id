"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, Calendar, MessageCircle, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import type { SessionBookingData, SessionScheduleData, SessionCounselorData } from "@/lib/session/types"

interface CancelledBookingNoticeCardProps {
  booking: SessionBookingData
  schedule: SessionScheduleData
  counselor: SessionCounselorData
}

export function CancelledBookingNoticeCard({
  booking,
  schedule,
  counselor,
}: CancelledBookingNoticeCardProps) {
  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"

  const waHelpMessage = `Halo Admin Solulu, pemesanan sesi saya (${booking.accessToken}) berstatus dibatalkan:
- Nama: ${booking.patientName}
- Konselor: ${counselor.fullName}
- Jadwal: ${schedule.formattedDate} (${schedule.timeRange})

Mohon bantuan untuk verifikasi kendala pembayaran / penjadwalan ulang sesi. Terima kasih!`

  const whatsappUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(waHelpMessage)}`

  return (
    <Card className="rounded-2xl border border-rose-500/25 bg-card shadow-xs overflow-hidden gap-0">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full bg-rose-500/60" />

      {/* Header */}
      <CardHeader className="p-6 sm:p-7 border-b border-border/40 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status Pemesanan
          </span>
          <Badge className="rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-medium px-2.5 py-0.5 text-xs shadow-2xs">
            <AlertCircle className="size-3 mr-1 inline-block" />
            Sesi Dibatalkan / Kedaluwarsa
          </Badge>
        </div>
        <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Pemberitahuan Pembatalan Sesi
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Slot jadwal yang sebelumnya Anda pesan telah dibebaskan kembali karena batas waktu pembayaran habis atau verifikasi belum sesuai.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 flex flex-col gap-5">
        {/* Previous Schedule Context Box */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                Jadwal: {counselor.fullName}
              </span>
              <span className="text-muted-foreground">
                {schedule.formattedDate} • {schedule.timeRange}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded border border-border/40 self-start sm:self-auto">
            Token: {booking.accessToken.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Empathy Guarantee Box */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4.5 flex items-start gap-3 text-xs leading-relaxed">
          <HeartHandshake className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Sudah Mentransfer Dana? Hak Anda 100% Aman</span>
            <p>
              Jika Anda sudah melakukan transfer sebelum batas waktu atau mendapati kendala teknis, tim kami akan membantu mengonfirmasi manual atau memproses pengembalian dana (refund 100%) tanpa potongan.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="p-6 sm:p-7 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
          <span>Privasi &amp; Transparansi Solulu</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs h-9 px-4 font-semibold gap-2 border-border/80 shadow-2xs hover:bg-muted/60"
            >
              <MessageCircle className="size-3.5 text-emerald-600" />
              <span>Hubungi CS WhatsApp</span>
            </Button>
          </a>

          <Button
            asChild
            className="w-full sm:w-auto text-xs h-9 px-4 font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Link href="/counselors">
              <span>Pesan Jadwal Baru</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
