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
  const waCounselorMissingUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Admin Solulu, saya sedang berada di ruang sesi dengan token ${booking.accessToken} (Klien: ${patientName}), namun konselor belum bergabung atau ada kendala di ruang Zoom. Mohon bantuannya.`
  )}`

  return (
    <Card className="rounded-3xl border border-violet-100/90 dark:border-border/80 bg-card/95 backdrop-blur-sm shadow-[0_16px_40px_-12px_rgba(124,58,237,0.06)] hover:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.10)] transition-all relative overflow-hidden gap-0">
      <CardHeader className="p-6 sm:p-8 border-b border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status Ruang Sesi
            </span>
            {state === "UPCOMING_LOCKED" && (
              <Badge variant="outline" className="rounded-full border-violet-200/80 bg-violet-50/70 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-medium px-3.5 py-1 text-xs shadow-2xs">
                <Clock data-icon="inline-start" className="size-3.5 mr-1 text-primary" /> Terjadwal • Menunggu Jam Sesi
              </Badge>
            )}
            {state === "ROOM_OPEN_PREPARING" && (
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium px-3.5 py-1 text-xs shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1.5" />
                Ruang Zoom Telah Dibuka
              </Badge>
            )}
            {state === "IN_PROGRESS" && (
              <Badge className="rounded-full bg-emerald-600 text-white font-medium shadow-xs px-3.5 py-1 text-xs">
                <span className="size-2 rounded-full bg-white animate-pulse inline-block mr-1.5" />
                Sesi Sedang Berlangsung
              </Badge>
            )}
            {state === "ENDED" && (
              <Badge variant="secondary" className="rounded-full font-normal text-muted-foreground px-3.5 py-1 text-xs">
                <CheckCircle2 data-icon="inline-start" className="size-3.5 mr-1" /> Sesi Telah Selesai
              </Badge>
            )}
            {booking.status === "cancelled" && (
              <Badge variant="destructive" className="rounded-full font-medium px-3.5 py-1 text-xs">
                Sesi Dibatalkan
              </Badge>
            )}
          </div>
          <CardTitle className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Ruang Telekonseling 1-on-1
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex items-center gap-1.5 flex-wrap">
            <span>{schedule.formattedDate}</span>
            <span>•</span>
            <span className="font-medium text-foreground">{schedule.timeRange}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-primary font-medium">(Durasi 90 Menit Penuh)</span>
          </CardDescription>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-[11px] text-muted-foreground">Zona Waktu Sesi</span>
          <span className="text-xs font-semibold tracking-tight text-primary font-mono bg-violet-50 dark:bg-violet-950/50 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-900/50 shadow-2xs">
            WIB (UTC+7)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
        {/* Live Countdown Display with Modular Lavender Cubes */}
        {state !== "ENDED" && booking.status !== "cancelled" && (
          <div className="rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-gradient-to-b from-violet-50/70 via-background/60 to-violet-50/30 dark:from-violet-950/20 dark:via-background/40 dark:to-violet-950/10 p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xs">
            <span className="text-xs sm:text-sm font-semibold text-primary dark:text-violet-300 uppercase tracking-wider">
              {countdown.label}
            </span>

            {/* Countdown Digits in Modular Soft Blocks */}
            <div className="flex items-center gap-2 sm:gap-3 font-mono select-none">
              {countdown.days > 0 ? (
                <div className="rounded-2xl bg-white dark:bg-card border border-violet-100 dark:border-violet-900/50 px-6 py-4 shadow-2xs">
                  <span className="text-3xl sm:text-5xl font-bold tracking-tight text-primary dark:text-violet-300">
                    {countdown.formatted}
                  </span>
                </div>
              ) : (
                <>
                  {/* Jam */}
                  <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-card border border-violet-100 dark:border-violet-900/50 p-3 sm:p-4 min-w-[70px] sm:min-w-[84px] shadow-2xs">
                    <span className="text-3xl sm:text-5xl font-bold tracking-tight text-primary dark:text-violet-300 tabular-nums">
                      {String(countdown.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-sans uppercase font-medium text-muted-foreground tracking-wider mt-1">
                      Jam
                    </span>
                  </div>

                  <span className="text-xl sm:text-2xl font-bold text-violet-300 dark:text-violet-700 -translate-y-2">:</span>

                  {/* Menit */}
                  <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-card border border-violet-100 dark:border-violet-900/50 p-3 sm:p-4 min-w-[70px] sm:min-w-[84px] shadow-2xs">
                    <span className="text-3xl sm:text-5xl font-bold tracking-tight text-primary dark:text-violet-300 tabular-nums">
                      {String(countdown.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-sans uppercase font-medium text-muted-foreground tracking-wider mt-1">
                      Menit
                    </span>
                  </div>

                  <span className="text-xl sm:text-2xl font-bold text-violet-300 dark:text-violet-700 -translate-y-2">:</span>

                  {/* Detik */}
                  <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-card border border-violet-100 dark:border-violet-900/50 p-3 sm:p-4 min-w-[70px] sm:min-w-[84px] shadow-2xs">
                    <span className="text-3xl sm:text-5xl font-bold tracking-tight text-primary dark:text-violet-300 tabular-nums">
                      {String(countdown.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-sans uppercase font-medium text-muted-foreground tracking-wider mt-1">
                      Detik
                    </span>
                  </div>
                </>
              )}
            </div>

            {state === "UPCOMING_LOCKED" && (
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Tautan ruang Zoom akan terbuka otomatis tepat pada pukul{" "}
                <span className="font-semibold text-foreground">{unlockTimeString} WIB</span>{" "}
                (H-10 menit sebelum konseling).
              </p>
            )}
            {state === "ROOM_OPEN_PREPARING" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 max-w-md font-medium leading-relaxed">
                Pintu masuk Zoom sudah dibuka untuk uji koneksi dan headset sebelum sesi resmi dimulai.
              </p>
            )}
            {state === "IN_PROGRESS" && (
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Sesi sedang berlangsung hingga pukul{" "}
                <span className="font-semibold text-foreground">{schedule.endTime.slice(0, 5)} WIB</span>.
              </p>
            )}
          </div>
        )}

        {/* Fulfillment Pending Notice (US-24) */}
        {isFulfillmentPending && (
          <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
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
                    className="rounded-full border-amber-500/40 hover:bg-amber-500/20 text-xs h-8"
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
                  className="rounded-full border-amber-500/40 hover:bg-amber-500/20 text-xs h-8"
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
          <div className="rounded-2xl border border-violet-100 dark:border-border/60 bg-muted/20 p-6 sm:p-7 text-center flex flex-col items-center gap-3">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
              Sesi Telekonseling Selesai
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
              Sesi konseling berdurasi 90 menit telah selesai. Terima kasih telah mempercayakan
              ruang bercerita dan proses pemulihan Anda bersama Solulu.
            </p>

            {/* In case session had disruption / Counselor No-Show */}
            <div className="mt-3 pt-3 border-t border-border/50 w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Sesi terganggu atau konselor tidak hadir?</span>
              <a
                href={waCounselorMissingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-semibold text-primary hover:text-primary underline-offset-4 hover:underline rounded-full"
                >
                  Klaim Reschedule / Refund 100%
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Primary Action Button (US-16, US-17) */}
        {booking.status !== "cancelled" && state !== "ENDED" && !isFulfillmentPending && (
          <div className="flex flex-col gap-3">
            {isZoomActive && booking.zoomJoinUrl ? (
              <Button
                asChild
                variant="public"
                size="pill-lg"
                id="btn-join-zoom"
                className="w-full h-13 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all active:scale-[0.98] group rounded-full"
              >
                <a
                  href={booking.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Video data-icon="inline-start" className="size-5" />
                  <span>Masuk Ruang Zoom Sekarang</span>
                  <ExternalLink data-icon="inline-end" className="size-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Button>
            ) : (
              <Button
                disabled
                size="pill-lg"
                id="btn-join-zoom-locked"
                variant="outline"
                className="w-full h-13 text-sm sm:text-base text-muted-foreground/80 cursor-not-allowed border-dashed bg-muted/20 rounded-full font-medium"
              >
                <Lock data-icon="inline-start" className="size-4 mr-1.5" />
                <span>Masuk Ruang Zoom (Terkunci)</span>
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              {isZoomActive
                ? `Bergabunglah menggunakan nama profil sesuai pemesanan: "${patientName}".`
                : `Tombol aktif otomatis pada pukul ${unlockTimeString} WIB. Tidak perlu me-refresh halaman manual.`}
            </p>

            {/* Counselor Assistance Notice (Case 2A: Counselor Delay / No-Show) */}
            {(state === "IN_PROGRESS" || state === "ROOM_OPEN_PREPARING") && (
              <div className="mt-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Konselor belum hadir atau kendala mikrofon/Zoom?</span>
                </div>
                <a
                  href={waCounselorMissingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-full border-amber-500/30 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  >
                    Lapor Bantuan CS
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 bg-violet-50/30 dark:bg-muted/10 p-5 sm:p-6 flex items-center justify-between text-xs text-muted-foreground rounded-b-3xl">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="size-3.5 text-primary" />
          Kerahasiaan Sesi Dijamin Terenkripsi
        </span>
        {booking.zoomMeetingId && (
          <span className="font-mono text-xs bg-card px-3 py-1 rounded-full border border-violet-100 dark:border-border/60 font-medium">
            Meeting ID: {booking.zoomMeetingId}
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
