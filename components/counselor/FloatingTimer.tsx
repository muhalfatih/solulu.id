"use client"

import * as React from "react"
import {
  Timer,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  KeyRound,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  X,
  CreditCard,
  Video,
  ChevronDown,
  ChevronUp,
  FastForward,
  Sparkles,
  Loader2,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getTimerStage,
  calculateExtendFee,
  formatTimerDisplay,
  getTimerProgressPercentage,
  type TimerStageInfo,
} from "@/lib/counselor/timer"
import {
  recordSessionExtensionAction,
  recordSessionTimerAction,
  counselorAdmitClientAction,
  counselorUnadmitClientAction,
} from "@/app/counselor/actions"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"
import { cn } from "@/lib/utils"

export interface FloatingTimerProps {
  session: CounselorUpcomingSessionView
  onClose: () => void
  onCompleteSession: (session: CounselorUpcomingSessionView) => void
}

export function FloatingTimer({ session, onClose, onCompleteSession }: FloatingTimerProps) {
  // Timer state (seconds elapsed)
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0)
  const [isRunning, setIsRunning] = React.useState<boolean>(true)
  const [isMinimized, setIsMinimized] = React.useState<boolean>(false)
  const [showSimControls, setShowSimControls] = React.useState<boolean>(false)
  const [copiedKey, setCopiedKey] = React.useState<boolean>(false)
  const [isSavingExtension, setIsSavingExtension] = React.useState<boolean>(false)
  const [extensionRecorded, setExtensionRecorded] = React.useState<boolean>(session.isExtended)
  const [recordedFee, setRecordedFee] = React.useState<number | null>(
    session.extensionFee && Number(session.extensionFee) > 0
      ? Number(session.extensionFee)
      : null
  )
  const [isClientAdmitted, setIsClientAdmitted] = React.useState<boolean>(Boolean(session.operatorAdmittedAt))
  const [isAdmittingClient, setIsAdmittingClient] = React.useState<boolean>(false)
  const autoAdmittedOnceRef = React.useRef<boolean>(false)

  // Track stages for notification triggers
  const lastTriggeredStageRef = React.useRef<string>("normal")
  const startTimeRef = React.useRef<number>(Date.now())

  // Auto-admit when timer mounts/starts if not already admitted
  React.useEffect(() => {
    if (!autoAdmittedOnceRef.current && !session.operatorAdmittedAt) {
      autoAdmittedOnceRef.current = true
      recordSessionTimerAction(session.id, {
        actualDurationMinutes: 0,
        timerStartedAt: new Date(startTimeRef.current).toISOString(),
      })
        .then(() => setIsClientAdmitted(true))
        .catch(() => {})
    }
  }, [session.id, session.operatorAdmittedAt])

  const handleToggleAdmitClient = async () => {
    setIsAdmittingClient(true)
    try {
      if (!isClientAdmitted) {
        const res = await counselorAdmitClientAction({ bookingId: session.id })
        if (res.success) {
          setIsClientAdmitted(true)
          toast.success("Kehadiran klien berhasil dikonfirmasi.")
        } else {
          toast.error(res.error || "Gagal mengonfirmasi kehadiran klien.")
        }
      } else {
        const res = await counselorUnadmitClientAction({ bookingId: session.id })
        if (res.success) {
          setIsClientAdmitted(false)
          toast.info("Status kehadiran klien dibatalkan.")
        } else {
          toast.error(res.error || "Gagal membatalkan kehadiran klien.")
        }
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.")
    } finally {
      setIsAdmittingClient(false)
    }
  }

  // Current stage & fee calculation
  const currentStage: TimerStageInfo = React.useMemo(
    () => getTimerStage(elapsedSeconds),
    [elapsedSeconds]
  )
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const feeCalculation = React.useMemo(
    () => calculateExtendFee(elapsedMinutes, session.counselorType, session.customRates),
    [elapsedMinutes, session.counselorType, session.customRates]
  )

  // Host Key fallback
  const hostKey = session.zoomHostKey || "849201"

  // 1. Tick Interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          // Hard stop at 120 minutes (7200 seconds)
          if (prev >= 120 * 60) {
            setIsRunning(false)
            return 120 * 60
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // 2. Stage Transition Alert & Toast Triggers
  React.useEffect(() => {
    const stageKey = currentStage.key

    if (stageKey !== lastTriggeredStageRef.current) {
      lastTriggeredStageRef.current = stageKey

      // At minute 85: emits visual warning and toast notification
      if (stageKey === "warning_85") {
        toast.warning(currentStage.toastMessage || "5 menit menuju batas standar 90 menit.", {
          id: "timer-alert-85m",
          duration: 6000,
          description: "Mulai persiapkan ringkasan dan penutup sesi bersama pasien.",
        })
      }
      // At minute 90: indicates 5-minute grace period
      else if (stageKey === "grace_period") {
        toast.info("Masa Toleransi Dimulai (90–95m)", {
          id: "timer-alert-90m",
          duration: 5000,
          description: "Toleransi 5 menit tanpa dikenakan biaya perpanjangan tambahan.",
        })
      }
      // At minute 96: automatically computes extension fee
      else if (stageKey === "extension") {
        toast.warning(
          `Sesi Diperpanjang: ${feeCalculation.formattedFee} (${session.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"})`,
          {
            id: "timer-alert-96m",
            duration: 8000,
            description: "Durasi melebihi 95 menit. Klik 'Catat Perpanjangan' untuk memperbarui billing database.",
          }
        )
      }
      // At minute 120: halts timer and prompts session termination
      else if (stageKey === "hard_stop") {
        setIsRunning(false)
        toast.error("Batas Maksimal 120 Menit Tercapai", {
          id: "timer-alert-120m",
          duration: 10000,
          description: "Batas waktu slot ruangan telah berakhir. Harap akhiri sesi konseling sekarang.",
        })
      }
    }
  }, [currentStage, feeCalculation, session.counselorType])

  // Copy Host Key
  const handleCopyHostKey = async () => {
    try {
      await navigator.clipboard.writeText(hostKey)
      setCopiedKey(true)
      toast.success("Host Key disalin ke clipboard", {
        description: `Gunakan PIN ${hostKey} untuk Claim Host di Zoom.`,
      })
      setTimeout(() => setCopiedKey(false), 2000)
    } catch {
      toast.error("Gagal menyalin Host Key.")
    }
  }

  // Record Extension in DB
  const handleRecordExtension = async () => {
    setIsSavingExtension(true)
    try {
      const res = await recordSessionExtensionAction(session.id)
      if (res.success) {
        setExtensionRecorded(true)
        if (res.data?.fee) {
          setRecordedFee(res.data.fee)
        }
        toast.success("Perpanjangan Sesi Tercatat", {
          description: `Biaya perpanjangan Rp ${res.data?.fee.toLocaleString("id-ID")} berhasil disimpan ke database.`,
        })
      } else {
        toast.error(res.error || "Gagal mencatat perpanjangan sesi.")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan perpanjangan.")
    } finally {
      setIsSavingExtension(false)
    }
  }

  // Record timer duration when ending
  const handleEndSession = async () => {
    setIsRunning(false)
    try {
      await recordSessionTimerAction(session.id, {
        actualDurationMinutes: elapsedMinutes,
        timerStartedAt: new Date(startTimeRef.current).toISOString(),
        timerStoppedAt: new Date().toISOString(),
      })
    } catch {
      // non-blocking
    }
    onCompleteSession(session)
  }

  // Fast-Forward Helpers for Testing & Browser Automation
  const jumpToSeconds = (seconds: number) => {
    setElapsedSeconds(seconds)
    setIsRunning(true)
  }

  // Minimized Compact Pill
  if (isMinimized) {
    return (
      <aside
        id="floating-timer-minimized"
        aria-label="Timer Sesi Konseling (Minimalis)"
        className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3",
          currentStage.containerClassName,
          currentStage.glowClassName
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2.5 rounded-full",
              isRunning ? `${currentStage.progressBarColor} animate-ping` : "bg-muted-foreground"
            )}
            aria-hidden="true"
          />
          <span className="font-mono font-bold text-sm tracking-wider text-foreground tabular-nums">
            {formatTimerDisplay(elapsedSeconds)}
          </span>
        </div>

        <Badge variant={currentStage.badgeVariant} className={cn("text-[10px] py-0 px-2 font-semibold", currentStage.badgeClassName)}>
          {currentStage.label}
        </Badge>

        <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
          {session.patientName}
        </span>

        <div className="flex items-center gap-1 border-l border-border/60 pl-2">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsRunning(!isRunning)}
            aria-label={isRunning ? "Jeda timer" : "Lanjutkan timer"}
            id="btn-timer-toggle-play-min"
          >
            {isRunning ? <Pause className="size-3.5" data-icon="inline-start" /> : <Play className="size-3.5 text-emerald-600" data-icon="inline-start" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsMinimized(false)}
            aria-label="Perbesar tampilan timer"
            id="btn-timer-maximize"
          >
            <Maximize2 className="size-3.5" data-icon="inline-start" />
          </Button>
        </div>
      </aside>
    )
  }

  // Full Expanded Clinical Console Widget
  return (
    <aside
      id="floating-timer-widget"
      role="region"
      aria-label="Floating Timer Konseling"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95",
        currentStage.containerClassName,
        currentStage.glowClassName
      )}
    >
      <Card className="border-0 bg-background/95 shadow-none overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-7 rounded-lg flex items-center justify-center font-bold text-xs text-white",
                currentStage.progressBarColor
              )}
              aria-hidden="true"
            >
              <Timer className="size-4" data-icon="inline-start" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 leading-none">
                Timer Praktik Sesi
                <Badge variant={currentStage.badgeVariant} className={cn("text-[10px] py-0 px-1.5 font-bold", currentStage.badgeClassName)}>
                  {currentStage.key === "normal" ? "Normal" : currentStage.label}
                </Badge>
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                {session.patientName} ({session.bookingCode})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setIsMinimized(true)}
              aria-label="Kecilkan widget timer"
              id="btn-timer-minimize"
            >
              <Minimize2 className="size-3.5" data-icon="inline-start" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={onClose}
              aria-label="Tutup widget timer"
              id="btn-timer-close"
            >
              <X className="size-3.5" data-icon="inline-start" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col gap-4">
          {/* Main Digital Clock & Stage Banner */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border/70 relative overflow-hidden text-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
              Durasi Sesi Berjalan
            </span>

            {/* Digital Clock MM:SS */}
            <div className="flex items-baseline justify-center gap-1">
              <span
                id="floating-timer-display"
                className={cn(
                  "font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums transition-colors duration-300",
                  currentStage.color === "green" && "text-emerald-700 dark:text-emerald-400",
                  currentStage.color === "amber" && "text-amber-700 dark:text-amber-400 animate-pulse",
                  currentStage.color === "blue" && "text-sky-700 dark:text-sky-400",
                  currentStage.color === "orange" && "text-orange-700 dark:text-orange-400 animate-pulse",
                  currentStage.color === "red" && "text-rose-600 dark:text-rose-400 animate-bounce"
                )}
              >
                {formatTimerDisplay(elapsedSeconds)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">/ 120:00</span>
            </div>

            {/* Stage Guidance Description */}
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs px-2">
              {currentStage.description}
            </p>

            {/* Progress Bar towards 120m limit */}
            <div className="w-full flex flex-col gap-1 pt-2">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>0m</span>
                <span className="text-amber-700 dark:text-amber-400">85m (Warning)</span>
                <span className="text-sky-700 dark:text-sky-400">90-95m (Grace)</span>
                <span className="text-orange-700 dark:text-orange-400">96m (Extend)</span>
                <span className="text-rose-700 dark:text-rose-400">120m (Stop)</span>
              </div>
              <Progress
                value={getTimerProgressPercentage(elapsedSeconds)}
                className="h-2 rounded-full bg-muted border border-border/60"
              />
            </div>
          </div>

          {/* 6-Digit Zoom Host Key Box */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/80 border border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="size-4" data-icon="inline-start" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Host Key Zoom (6 Digit)
                </span>
                <span className="font-mono text-base font-bold text-foreground tracking-wider" id="zoom-host-key-text">
                  {hostKey}
                </span>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs font-semibold border-border/80"
                    onClick={handleCopyHostKey}
                    id="btn-copy-host-key"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="size-3 text-emerald-600" data-icon="inline-start" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" data-icon="inline-start" />
                        <span>Salin Key</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Gunakan PIN ini di Zoom client: Participants &gt; Claim Host
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Client Attendance Confirmation Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/80">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                  isClientAdmitted
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}
              >
                <UserCheck className="size-4" data-icon="inline-start" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Kehadiran Klien
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0 px-1.5 font-bold",
                      isClientAdmitted
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    )}
                  >
                    {isClientAdmitted ? "Klien Hadir (Admitted)" : "Menunggu Klien"}
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-8 gap-1.5 text-xs font-semibold",
                isClientAdmitted
                  ? "text-muted-foreground hover:text-destructive border-border/80"
                  : "text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
              )}
              onClick={handleToggleAdmitClient}
              disabled={isAdmittingClient}
              id="btn-toggle-client-admit-timer"
            >
              {isAdmittingClient ? (
                <Loader2 className="size-3 animate-spin" data-icon="inline-start" />
              ) : (
                <UserCheck className="size-3" data-icon="inline-start" />
              )}
              <span>{isClientAdmitted ? "Batal Hadir" : "Konfirmasi Hadir"}</span>
            </Button>
          </div>

          {/* Extend Fee Section (Active when elapsedMinutes >= 96) */}
          {elapsedMinutes >= 96 && (
            <div
              className={cn(
                "p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all duration-300",
                extensionRecorded
                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-300"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 shrink-0" data-icon="inline-start" />
                  <span className="font-bold text-xs">
                    Perpanjangan Sesi (+30 Menit)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold py-0.5",
                    extensionRecorded
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                      : "border-orange-500/40 bg-orange-500/20 text-orange-800 dark:text-orange-200"
                  )}
                >
                  {extensionRecorded ? "Tercatat di DB" : "Perlu Dicatat"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>
                  Tarif ({session.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}):
                </span>
                <span className="font-bold font-mono text-sm">
                  {recordedFee != null
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(recordedFee)
                    : feeCalculation.formattedFee}
                </span>
              </div>

              {!extensionRecorded && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs font-semibold gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isSavingExtension}
                  onClick={handleRecordExtension}
                  id="btn-record-extension-db"
                >
                  {isSavingExtension ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-3.5" data-icon="inline-start" />
                      <span>Catat Perpanjangan ke Database</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Hard Stop Alert (Minute 120) */}
          {elapsedSeconds >= 120 * 60 && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="size-4 text-rose-600 shrink-0" data-icon="inline-start" />
                <span>Batas Maksimal 120 Menit Tercapai</span>
              </div>
              <p className="leading-relaxed">
                Sesi telah mencapai batas maksimal waktu slot ruangan (120 menit). Timer dihentikan otomatis. Harap segera akhiri sesi konseling untuk mempersiapkan slot berikutnya.
              </p>
            </div>
          )}

          {/* Controls: Play/Pause, Reset, Complete Session */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 text-xs font-semibold border-border/80"
              onClick={() => setIsRunning(!isRunning)}
              disabled={elapsedSeconds >= 120 * 60}
              id="btn-timer-play-pause"
            >
              {isRunning ? (
                <>
                  <Pause className="size-3.5" data-icon="inline-start" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 text-emerald-600" data-icon="inline-start" />
                  <span>Lanjutkan</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 text-xs text-muted-foreground border-border/80"
              onClick={() => {
                setElapsedSeconds(0)
                setIsRunning(false)
                toast.info("Timer di-reset ke 00:00")
              }}
              id="btn-timer-reset"
            >
              <RotateCcw className="size-3.5" data-icon="inline-start" />
              <span>Reset</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className={cn(
                "flex-1 h-9 gap-1.5 text-xs font-semibold shadow-xs",
                elapsedSeconds >= 120 * 60
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                  : "bg-primary text-primary-foreground"
              )}
              onClick={handleEndSession}
              id="btn-timer-end-session"
            >
              <CheckCircle2 className="size-3.5" data-icon="inline-start" />
              <span>Akhiri Sesi & Buat Catatan</span>
            </Button>
          </div>

          {/* QA / Dogfooding Simulation Fast-Forward Controls */}
          <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
            <button
              type="button"
              className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
              onClick={() => setShowSimControls(!showSimControls)}
              id="btn-toggle-sim-controls"
            >
              <span className="flex items-center gap-1.5">
                <FastForward className="size-3 text-primary" data-icon="inline-start" />
                <span>Simulasi Transisi Waktu (Uji SOP)</span>
              </span>
              {showSimControls ? <ChevronUp className="size-3" data-icon="inline-start" /> : <ChevronDown className="size-3" data-icon="inline-start" />}
            </button>

            {showSimControls && (
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-in fade-in">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] font-medium justify-start"
                  onClick={() => jumpToSeconds(84 * 60 + 55)}
                  id="btn-jump-85m"
                >
                  Ke 84:55 (Tes 85m Amber)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] font-medium justify-start"
                  onClick={() => jumpToSeconds(89 * 60 + 55)}
                  id="btn-jump-90m"
                >
                  Ke 89:55 (Tes 90m Grace)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] font-medium justify-start"
                  onClick={() => jumpToSeconds(95 * 60 + 55)}
                  id="btn-jump-96m"
                >
                  Ke 95:55 (Tes 96m Extend)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] font-medium justify-start"
                  onClick={() => jumpToSeconds(119 * 60 + 55)}
                  id="btn-jump-120m"
                >
                  Ke 119:55 (Tes 120m Stop)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
