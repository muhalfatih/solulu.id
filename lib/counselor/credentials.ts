/**
 * Counselor Credential Expiry Radar Utility
 *
 * Implements automated expiry monitoring for Clinical Psychologist credentials
 * (STR - Surat Tanda Registrasi & SIPP - Surat Izin Praktik Psikologi).
 * In accordance with Solulu SOP:
 * - Credentials expiring in < 60 days trigger automated radar warning badges.
 * - Credentials expiring in <= 30 days or already expired trigger critical radar alerts.
 */

export interface CredentialExpiryStatus {
  status: "expired" | "expiring_critical" | "expiring_warning" | "valid" | "none"
  daysRemaining: number | null
  isExpiringSoon: boolean // true if <= 60 days and > 0
  isExpired: boolean // true if <= 0
  label: string
  formattedDate: string | null
  badgeVariant: "destructive" | "warning" | "default" | "secondary" | "outline"
}

export interface CounselorRadarAlert {
  hasRadarAlert: boolean
  alertSeverity: "critical" | "warning" | null
  alertMessage: string | null
  strStatus: CredentialExpiryStatus
  sippStatus: CredentialExpiryStatus
}

/**
 * Calculates days remaining and expiration status for a given date.
 * Allows passing an optional `referenceDate` for deterministic unit testing.
 */
export function calculateCredentialExpiry(
  expiresAt: string | Date | null | undefined,
  referenceDate?: Date
): CredentialExpiryStatus {
  if (!expiresAt) {
    return {
      status: "none",
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      label: "Tidak Dicantumkan",
      formattedDate: null,
      badgeVariant: "secondary",
    }
  }

  const expDate = new Date(expiresAt)
  if (isNaN(expDate.getTime())) {
    return {
      status: "none",
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      label: "Format Tanggal Tidak Valid",
      formattedDate: null,
      badgeVariant: "secondary",
    }
  }

  const ref = referenceDate ? new Date(referenceDate) : new Date()
  // Strip hours/minutes to compare purely on date boundaries (UTC/Local day basis)
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime()
  const expMidnight = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime()

  const diffTime = expMidnight - refMidnight
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24))

  const formattedDate = expDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  if (daysRemaining <= 0) {
    const daysAgo = Math.abs(daysRemaining)
    return {
      status: "expired",
      daysRemaining,
      isExpiringSoon: false,
      isExpired: true,
      label: daysAgo === 0 ? "Kedaluwarsa Hari Ini" : `Kedaluwarsa (${daysAgo} hari lalu)`,
      formattedDate,
      badgeVariant: "destructive",
    }
  }

  if (daysRemaining <= 30) {
    return {
      status: "expiring_critical",
      daysRemaining,
      isExpiringSoon: true,
      isExpired: false,
      label: `Kritis: Sisa ${daysRemaining} hari`,
      formattedDate,
      badgeVariant: "destructive",
    }
  }

  if (daysRemaining <= 60) {
    return {
      status: "expiring_warning",
      daysRemaining,
      isExpiringSoon: true,
      isExpired: false,
      label: `Peringatan: Sisa ${daysRemaining} hari`,
      formattedDate,
      badgeVariant: "warning",
    }
  }

  return {
    status: "valid",
    daysRemaining,
    isExpiringSoon: false,
    isExpired: false,
    label: `Aktif (${daysRemaining} hari)`,
    formattedDate,
    badgeVariant: "outline",
  }
}

/**
 * Computes overall radar alert for a counselor.
 * Peer counselors do not have mandatory STR/SIPP credentials.
 * Clinical psychologists are flagged if either STR or SIPP is expired or expiring in < 60 days.
 */
export function getCounselorRadarAlert(
  counselor: {
    counselorType: string
    strNumber?: string | null
    strExpiresAt?: string | Date | null
    sippNumber?: string | null
    sippExpiresAt?: string | Date | null
  },
  referenceDate?: Date
): CounselorRadarAlert {
  const isPsychologist = counselor.counselorType === "psychologist"

  const strStatus = calculateCredentialExpiry(counselor.strExpiresAt, referenceDate)
  const sippStatus = calculateCredentialExpiry(counselor.sippExpiresAt, referenceDate)

  // Only clinical psychologists require STR / SIPP compliance radar
  if (!isPsychologist) {
    return {
      hasRadarAlert: false,
      alertSeverity: null,
      alertMessage: null,
      strStatus,
      sippStatus,
    }
  }

  const isStrCritical = strStatus.status === "expired" || strStatus.status === "expiring_critical"
  const isSippCritical = sippStatus.status === "expired" || sippStatus.status === "expiring_critical"

  const isStrWarning = strStatus.status === "expiring_warning"
  const isSippWarning = sippStatus.status === "expiring_warning"

  const hasCritical = isStrCritical || isSippCritical
  const hasWarning = isStrWarning || isSippWarning

  const hasRadarAlert = hasCritical || hasWarning
  const alertSeverity = hasCritical ? "critical" : hasWarning ? "warning" : null

  let alertMessage: string | null = null
  if (hasCritical) {
    const alerts: string[] = []
    if (strStatus.status === "expired") alerts.push("STR Kedaluwarsa")
    else if (strStatus.status === "expiring_critical") alerts.push(`STR Kritis (${strStatus.daysRemaining}h)`)

    if (sippStatus.status === "expired") alerts.push("SIPP Kedaluwarsa")
    else if (sippStatus.status === "expiring_critical") alerts.push(`SIPP Kritis (${sippStatus.daysRemaining}h)`)

    alertMessage = alerts.join(" • ")
  } else if (hasWarning) {
    const alerts: string[] = []
    if (isStrWarning) alerts.push(`STR Berakhir dlm ${strStatus.daysRemaining} hari`)
    if (isSippWarning) alerts.push(`SIPP Berakhir dlm ${sippStatus.daysRemaining} hari`)
    alertMessage = alerts.join(" • ")
  }

  return {
    hasRadarAlert,
    alertSeverity,
    alertMessage,
    strStatus,
    sippStatus,
  }
}
