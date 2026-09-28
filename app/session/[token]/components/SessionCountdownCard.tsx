"use client"

import * as React from "react"
import {
  Video,
  Lock,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  calculateSessionTimeInfo,
  getSessionCountdown,
  type SessionTimeInfo,
  type CountdownDisplay,
} from "@/lib/session/time"
import type { SessionBookingData, SessionScheduleData } from "@/lib/session/types"

interface SessionCountdownCardProps {
  booking: SessionBookingData
  schedule: SessionScheduleData
  patientName: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function SessionCountdownCard({
  booking,
  schedule,
  patientName,
  onRefresh,
  isRefreshing = false,
}: SessionCountdownCardProps) {
  // Compute initial time state
  const [now, setNow] = React.useState<Date>(() => new Date())
  const [timeInfo, setTimeInfo] = React.useState<SessionTimeInfo>(() =>
    calculateSessionTimeInfo(schedule.date, schedule.startTime, schedule.endTime, new Date())
  )
  const [countdown, setCountdown] = React.useState<CountdownDisplay>(() =>
    getSessionCountdown(timeInfo, new Date())
  )

  // 1-second interval live ticker
  React.useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date()
      setNow(current)
      const updatedInfo = calculateSessionTimeInfo(
        schedule.date,
        schedule.startTime,
        schedule.endTime,
        current
      )
      setTimeInfo(updatedInfo)
      setCountdown(getSessionCountdown(updatedInfo, current))
    }, 1000)

    return () => clearInterval(interval)
  }, [schedule.date, schedule.startTime, schedule.endTime])

  const { state, isZoomActive, zoomUnlockTime } = timeInfo
  const unlockTimeString = `${String(zoomUnlockTime.getHours()).padStart(2, "0")}:${String(
    zoomUnlockTime.getMinutes()
  ).padStart(2, "0")}`

  const isFulfillmentPending =
    booking.status === "confirmed" && !booking.zoomJoinUrl

  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"
  const waPendingUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Tim Solulu, saya sedang menunggu tautan Zoom di ruang sesi dengan token: ${booking.accessToken}`
  )}`

  return (
    <Card className="border-border/80 shadow-sm relative overflow-hidden bg-card">
      {/* Visual Accent Top Bar */}
      <div
        className={`h-1.5 w-full transition-colors ${
          isZoomActive
            ? "bg-emerald-500 animate-pulse"
            : state === "ENDED"
            ? "bg-muted-foreground/30"
            : "bg-primary/20"
        }`}
      />

      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status Ruang Sesi
            </span>
            {state === "UPCOMING_LOCKED" && (
              <Badge variant="outline" className="border-border/80 text-foreground font-normal">
                <Clock data-icon="inline-start" /> Terjadwal • Menunggu Jam Sesi
              </Badge>
            )}
            {state === "ROOM_OPEN_PREPARING" && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1.5" />
                Ruang Zoom Telah Dibuka
              </Badge>
            )}
            {state === "IN_PROGRESS" && (
              <Badge className="bg-emerald-600 text-white font-medium shadow-xs">
                <span className="size-2 rounded-full bg-white animate-pulse inline-block mr-1.5" />
                Sesi Sedang Berlangsung
              </Badge>
            )}
            {state === "ENDED" && (
              <Badge variant="secondary" className="font-normal text-muted-foreground">
                <CheckCircle2 data-icon="inline-start" /> Sesi Telah Selesai
              </Badge>
            )}
            {booking.status === "cancelled" && (
              <Badge variant="destructive" className="font-medium">
                Sesi Dibatalkan
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl md:text-2xl font-semibold tracking-tight">
            Ruang Telekonseling 1-on-1
          </CardTitle>
          <CardDescription>
            {schedule.formattedDate} • {schedule.timeRange} (Durasi 90 Menit)
          </CardDescription>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Waktu Server & Sesi</span>
          <span className="text-sm font-medium tracking-tight text-foreground">
            WIB (UTC+7)
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-2">
        {/* Live Countdown Display */}
        {state !== "ENDED" && booking.status !== "cancelled" && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {countdown.label}
            </span>

            {/* Countdown Digits */}
            <div className="flex items-center gap-2 font-mono text-3xl sm:text-5xl font-bold tracking-tight text-foreground select-none">
              {countdown.days > 0 ? (
                <span>{countdown.formatted}</span>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <span>{String(countdown.hours).padStart(2, "0")}</span>
                    <span className="text-[10px] font-sans uppercase font-normal text-muted-foreground tracking-wider">
                      Jam
                    </span>
                  </div>
                  <span className="text-muted-foreground/60 -translate-y-2">:</span>
                  <div className="flex flex-col items-center">
                    <span>{String(countdown.minutes).padStart(2, "0")}</span>
                    <span className="text-[10px] font-sans uppercase font-normal text-muted-foreground tracking-wider">
                      Menit
                    </span>
                  </div>
                  <span className="text-muted-foreground/60 -translate-y-2">:</span>
                  <div className="flex flex-col items-center">
                    <span>{String(countdown.seconds).padStart(2, "0")}</span>
                    <span className="text-[10px] font-sans uppercase font-normal text-muted-foreground tracking-wider">
                      Detik
                    </span>
                  </div>
                </>
              )}
            </div>

            {state === "UPCOMING_LOCKED" && (
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Tautan ruang Zoom akan terbuka otomatis tepat pada pukul{" "}
                <span className="font-semibold text-foreground">{unlockTimeString} WIB</span>{" "}
                (H-10 menit sebelum konseling).
              </p>
            )}
            {state === "ROOM_OPEN_PREPARING" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 max-w-md font-medium">
                Pintu masuk Zoom sudah dibuka untuk uji koneksi dan headset sebelum sesi resmi dimulai.
              </p>
            )}
            {state === "IN_PROGRESS" && (
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Sesi sedang berlangsung hingga pukul{" "}
                <span className="font-semibold text-foreground">{schedule.endTime.slice(0, 5)} WIB</span>.
              </p>
            )}
          </div>
        )}

        {/* Fulfillment Pending Notice (US-24) */}
        {isFulfillmentPending && (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertCircle data-icon="inline-start" className="text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">Zoom sedang disiapkan</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed text-amber-800 dark:text-amber-300 flex flex-col gap-3">
              <span>
                Sistem kami sedang menyiapkan ruang pertemuan aman Anda. Tautan Zoom akan
                otomatis terbit beberapa saat sebelum jadwal sesi dimulai. Jangan khawatir, hak sesi Anda telah
                terkonfirmasi lunas.
              </span>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="border-amber-500/40 hover:bg-amber-500/20 text-xs h-8"
                  >
                    <RefreshCw
                      data-icon="inline-start"
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                    {isRefreshing ? "Memeriksa..." : "Cek Ulang Ruang Zoom"}
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-500/40 hover:bg-amber-500/20 text-xs h-8"
                >
                  <a href={waPendingUrl} target="_blank" rel="noopener noreferrer">
                    Bantuan WhatsApp
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Ended State Notice */}
        {state === "ENDED" && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-6 text-center flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-semibold text-base text-foreground">
              Sesi Telekonseling Selesai
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Sesi konseling berdurasi 90 menit telah selesai. Terima kasih telah mempercayakan
              ruang bercerita dan proses pemulihan Anda bersama Solulu.
            </p>
          </div>
        )}

        {/* Primary Action Button (US-16, US-17) */}
        {booking.status !== "cancelled" && state !== "ENDED" && !isFulfillmentPending && (
          <div className="flex flex-col gap-2">
            {isZoomActive && booking.zoomJoinUrl ? (
              <Button
                asChild
                size="lg"
                id="btn-join-zoom"
                className="w-full h-13 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/25 transition-all group"
              >
                <a
                  href={booking.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Video data-icon="inline-start" />
                  <span>Masuk Ruang Zoom Sekarang</span>
                  <ExternalLink data-icon="inline-end" />
                </a>
              </Button>
            ) : (
              <Button
                disabled
                size="lg"
                id="btn-join-zoom-locked"
                variant="outline"
                className="w-full h-13 text-base text-muted-foreground/80 cursor-not-allowed border-dashed bg-muted/20"
              >
                <Lock data-icon="inline-start" />
                <span>Masuk Ruang Zoom (Terkunci)</span>
              </Button>
            )}

            <p className="text-[11px] text-center text-muted-foreground">
              {isZoomActive
                ? `Bergabunglah menggunakan nama profil sesuai pemesanan: "${patientName}".`
                : `Tombol aktif otomatis pada pukul ${unlockTimeString} WIB. Tidak perlu me-refresh halaman manual.`}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-muted/15 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          Kerahasiaan Sesi Dijamin Terenkripsi
        </span>
        {booking.zoomMeetingId && (
          <span className="font-mono text-[11px]">
            Meeting ID: {booking.zoomMeetingId}
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
