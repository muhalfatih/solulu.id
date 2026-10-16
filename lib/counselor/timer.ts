export type TimerStageKey =
  | "normal"
  | "warning_85"
  | "grace_period"
  | "extension"
  | "hard_stop"

export interface TimerStageInfo {
  key: TimerStageKey
  label: string
  color: "green" | "amber" | "blue" | "orange" | "red"
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  badgeClassName: string
  containerClassName: string
  glowClassName: string
  progressBarColor: string
  description: string
  toastMessage?: string
}

export interface ExtendFeeCalculation {
  isExtended: boolean
  extensionMinutes: number
  fee: number
  formattedFee: string
}

export const STAGE_CONFIG: Record<TimerStageKey, TimerStageInfo> = {
  normal: {
    key: "normal",
    label: "Sesi Berjalan (Normal)",
    color: "green",
    badgeVariant: "outline",
    badgeClassName: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30",
    containerClassName: "border-emerald-500/40 bg-card",
    glowClassName: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    progressBarColor: "bg-emerald-500",
    description: "Sesi berlangsung dalam durasi standar 90 menit (0–84 menit).",
  },
  warning_85: {
    key: "warning_85",
    label: "Peringatan Waktu (Batas 90m)",
    color: "amber",
    badgeVariant: "outline",
    badgeClassName: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 animate-pulse",
    containerClassName: "border-amber-500/50 bg-amber-500/[0.02]",
    glowClassName: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    progressBarColor: "bg-amber-500",
    description: "5 menit menuju batas standar 90 menit (85–89 menit). Mulai lakukan sintesis & penutup sesi.",
    toastMessage: "Peringatan Waktu: 5 menit menuju batas standar 90 menit.",
  },
  grace_period: {
    key: "grace_period",
    label: "Masa Toleransi (Gratis 5m)",
    color: "blue",
    badgeVariant: "outline",
    badgeClassName: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/35",
    containerClassName: "border-sky-500/50 bg-sky-500/[0.02]",
    glowClassName: "shadow-[0_0_20px_rgba(14,165,233,0.3)]",
    progressBarColor: "bg-sky-500",
    description: "Masa tenggang toleransi (menit 90–95). Tidak dikenakan biaya perpanjangan tambahan.",
    toastMessage: "Masa Toleransi: Sesi memasuki menit 90–95 tanpa biaya tambahan.",
  },
  extension: {
    key: "extension",
    label: "Perpanjangan Sesi (+30m)",
    color: "orange",
    badgeVariant: "outline",
    badgeClassName: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/40 animate-pulse",
    containerClassName: "border-orange-500/60 bg-orange-500/[0.03]",
    glowClassName: "shadow-[0_0_25px_rgba(249,115,22,0.35)]",
    progressBarColor: "bg-orange-500",
    description: "Sesi melewati toleransi (menit 96–119). Terhitung 1 blok perpanjangan 30 menit.",
    toastMessage: "Perpanjangan Sesi: Sesi melewati menit 95. Biaya perpanjangan 30 menit otomatis dihitung.",
  },
  hard_stop: {
    key: "hard_stop",
    label: "Batas Maksimal 120 Menit",
    color: "red",
    badgeVariant: "destructive",
    badgeClassName: "bg-rose-600 text-white border-rose-700 animate-bounce",
    containerClassName: "border-rose-500 ring-2 ring-rose-500/40 bg-rose-500/[0.04]",
    glowClassName: "shadow-[0_0_30px_rgba(244,63,94,0.45)]",
    progressBarColor: "bg-rose-600",
    description: "Batas maksimal slot 120 menit telah tercapai. Timer dihentikan otomatis, harap akhiri sesi.",
    toastMessage: "Batas Maksimal Tercapai: Durasi sesi telah mencapai 120 menit. Harap akhiri sesi sekarang.",
  },
}

/**
 * Returns the operational stage for the floating timer based on elapsed seconds.
 * SOP Boundaries:
 * - 0 to 84m (0 to 5099s): Green (Normal standard session)
 * - 85 to 89m (5100 to 5399s): Amber (5m warning before 90m target)
 * - 90 to 95m (5400 to 5759s): Blue (5m grace period, Rp 0)
 * - 96 to 119m (5760 to 7199s): Orange (Extension block 1: 30m, fee billed)
 * - 120m+ (7200s+): Red (Hard stop, slot limit reached)
 */
export function getTimerStage(elapsedSeconds: number): TimerStageInfo {
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  if (elapsedMinutes >= 120) {
    return STAGE_CONFIG.hard_stop
  }
  if (elapsedMinutes >= 96) {
    return STAGE_CONFIG.extension
  }
  if (elapsedMinutes >= 90) {
    return STAGE_CONFIG.grace_period
  }
  if (elapsedMinutes >= 85) {
    return STAGE_CONFIG.warning_85
  }
  return STAGE_CONFIG.normal
}

/**
 * Computes extend session fee based on duration and counselor type.
 * SOP Rules:
 * - <= 95 minutes: Rp 0 (standard duration or within 5-minute grace period).
 * - 96–120 minutes: 1 block of 30 minutes:
 *   - Konselor Sebaya (peer): Rp 35.000 (default)
 *   - Psikolog Klinis (psychologist): Rp 50.000 (default)
 */
export function calculateExtendFee(
  durationMinutes: number,
  counselorType: "peer" | "psychologist",
  customRates?: { peerRate?: number; psychologistRate?: number }
): ExtendFeeCalculation {
  if (durationMinutes <= 95) {
    return {
      isExtended: false,
      extensionMinutes: 0,
      fee: 0,
      formattedFee: "Rp 0",
    }
  }

  const peerRate = customRates?.peerRate ?? 35000
  const psychologistRate = customRates?.psychologistRate ?? 50000
  const fee = counselorType === "psychologist" ? psychologistRate : peerRate

  const formattedFee = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(fee)

  return {
    isExtended: true,
    extensionMinutes: 30,
    fee,
    formattedFee,
  }
}

/**
 * Formats total seconds into MM:SS display format.
 * Example:
 * - 0s -> "00:00"
 * - 5100s (85m) -> "85:00"
 * - 5760s (96m) -> "96:00"
 * - 7200s (120m) -> "120:00"
 */
export function formatTimerDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  const paddedMinutes = String(minutes).padStart(2, "0")
  const paddedSeconds = String(seconds).padStart(2, "0")

  return `${paddedMinutes}:${paddedSeconds}`
}

/**
 * Calculates progress percentage towards the 120-minute maximum boundary.
 */
export function getTimerProgressPercentage(elapsedSeconds: number): number {
  const maxSeconds = 120 * 60 // 7200s
  const capped = Math.min(Math.max(0, elapsedSeconds), maxSeconds)
  return Math.round((capped / maxSeconds) * 100)
}
