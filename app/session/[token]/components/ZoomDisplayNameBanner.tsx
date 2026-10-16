"use client"

import * as React from "react"
import { Copy, Check, Video, ExternalLink, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { SessionBookingData } from "@/lib/session/types"

interface ZoomDisplayNameBannerProps {
  booking: SessionBookingData
  counselorName: string
}

export function ZoomDisplayNameBanner({
  booking,
  counselorName,
}: ZoomDisplayNameBannerProps) {
  const [copied, setCopied] = React.useState(false)

  // Zoom Display Name format per Master SOP: [Kode Booking] - [Nama Panggilan / Lengkap]
  const requiredDisplayName = `${booking.bookingCode} - ${booking.patientName}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requiredDisplayName)
      setCopied(true)
      toast.success("Format nama Zoom berhasil disalin ke clipboard", {
        description: requiredDisplayName,
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Gagal menyalin format nama Zoom")
    }
  }

  return (
    <div
      id="zoom-display-name-banner"
      className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all print:hidden"
    >
      {/* Decorative calm background accent */}
      <div
        className="absolute -top-12 -right-12 size-36 rounded-full bg-primary/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="default"
            className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 shadow-2xs"
          >
            <Sparkles data-icon="inline-start" className="size-3" />
            Wajib di Ruang Zoom
          </Badge>

          {booking.zoomAllocationMode === "breakout_room" && (
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 text-primary dark:text-purple-300 text-xs px-2.5 py-0.5"
            >
              Mode Breakout Room
            </Badge>
          )}
        </div>

        <span className="text-[11px] font-mono font-medium text-muted-foreground self-start sm:self-auto">
          Kode Reservasi: {booking.bookingCode}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Atur Nama Tampilan Zoom Anda
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
          Operator klinik memandu antrean di <em>Waiting Room</em>. Agar Anda langsung dikenali dan
          segera dipindahkan ke ruang privat bersama <strong className="text-foreground">{counselorName}</strong>,
          pastikan nama profil Zoom Anda diubah persis menjadi format berikut:
        </p>
      </div>

      {/* Prominent Name Box with 1-Click Copy */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 sm:p-3.5 rounded-xl border border-primary/25 bg-background/90 shadow-2xs">
        <div className="flex-1 flex items-center gap-2.5 min-w-0 px-1">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Nama Profil:
          </span>
          <code
            id="zoom-display-name-value"
            className="font-mono text-sm sm:text-base font-bold text-primary dark:text-purple-300 truncate select-all"
          >
            {requiredDisplayName}
          </code>
        </div>

        <Button
          type="button"
          variant={copied ? "default" : "outline"}
          size="sm"
          onClick={handleCopy}
          id="btn-copy-zoom-name"
          className="shrink-0 text-xs h-9 font-medium border-primary/30 hover:bg-primary/10"
        >
          {copied ? (
            <>
              <Check data-icon="inline-start" className="size-3.5 text-emerald-500" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy data-icon="inline-start" className="size-3.5" />
              <span>Salin Nama Zoom</span>
            </>
          )}
        </Button>
      </div>

      {/* Breakout Room Indicator & Direct Entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Info className="size-3.5 text-primary shrink-0" />
          <span>
            {booking.breakoutRoomName ? (
              <>
                Ruang Privat Konseling:{" "}
                <strong className="text-foreground font-mono">{booking.breakoutRoomName}</strong>
              </>
            ) : (
              "Sesi 1-on-1 mandiri terenkripsi end-to-end."
            )}
          </span>
        </div>

        {booking.zoomJoinUrl && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-primary hover:text-primary underline-offset-4 hover:underline gap-1.5 self-start sm:self-auto p-0 hover:bg-transparent"
          >
            <a
              href={booking.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="link-open-zoom-direct"
              className="inline-flex items-center gap-1.5"
            >
              <Video className="size-3.5" data-icon="inline-start" />
              <span>Buka Tautan Zoom Langsung</span>
              <ExternalLink className="size-3" data-icon="inline-end" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
