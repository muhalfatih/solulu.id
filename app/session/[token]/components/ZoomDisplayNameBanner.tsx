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
      className="rounded-3xl border border-violet-200/90 dark:border-violet-900/50 bg-gradient-to-br from-violet-100/60 via-violet-50/40 to-background dark:from-violet-950/40 dark:via-background dark:to-background p-6 sm:p-7 shadow-[0_16px_40px_-12px_rgba(124,58,237,0.08)] flex flex-col gap-4 relative overflow-hidden transition-all print:hidden"
    >
      {/* Decorative calm background accent */}
      <div
        className="absolute -top-12 -right-12 size-40 rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="default"
            className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1 shadow-2xs"
          >
            <Sparkles data-icon="inline-start" className="size-3 mr-1" />
            Wajib di Ruang Zoom
          </Badge>

          {booking.zoomAllocationMode === "breakout_room" && (
            <Badge
              variant="outline"
              className="rounded-full border-violet-300 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs px-3 py-1 font-medium"
            >
              Mode Breakout Room
            </Badge>
          )}
        </div>

        <span className="text-xs font-mono font-medium text-muted-foreground self-start sm:self-auto bg-card px-3 py-1 rounded-full border border-violet-100 dark:border-border/60">
          Kode Reservasi: <strong className="text-foreground">{booking.bookingCode}</strong>
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-white/95 dark:bg-card/95 shadow-xs">
        <div className="flex-1 flex items-center gap-2.5 min-w-0 px-1">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Nama Profil:
          </span>
          <code
            id="zoom-display-name-value"
            className="font-mono text-sm sm:text-base font-bold text-primary dark:text-violet-300 truncate select-all"
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
          className="shrink-0 text-xs h-9 px-4 rounded-full font-semibold border-violet-200 dark:border-violet-900/60 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check data-icon="inline-start" className="size-3.5 text-emerald-500 mr-1" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy data-icon="inline-start" className="size-3.5 mr-1" />
              <span>Salin Nama Zoom</span>
            </>
          )}
        </Button>
      </div>

      {/* Breakout Room Indicator & Direct Entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-violet-100 dark:border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
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
