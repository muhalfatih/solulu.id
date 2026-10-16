import { formatIndonesianDate } from "./time"

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export const PRIVACY_SAFE_SUCCESS_MESSAGE =
  "Jika data Anda terdaftar, tautan sesi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau folder spam/promosi."

export interface ActiveBookingMatch {
  accessToken: string
  patientName: string
  patientEmail: string
  counselorName: string
  date: string
  timeRange: string
  status: string
}

export interface SessionRecoveryDependencies {
  getClientIp?: () => Promise<string>
  rateLimiter?: (ip: string) => Promise<{ success: boolean; remaining: number }>
  findActiveBookings?: (
    email: string,
    phone: string
  ) => Promise<ActiveBookingMatch[]>
  sendRecoveryEmail?: (
    email: string,
    sessions: ActiveBookingMatch[]
  ) => Promise<boolean>
}

export interface RecoverSessionResponse {
  success: boolean
  message?: string
  error?: string
  rateLimited?: boolean
  debugMatchesFound?: number
}

export interface SessionBookingData {
  id: string
  accessToken: string
  bookingCode: string // e.g. "SL-4821"
  patientName: string
  patientEmail: string
  patientPhone: string
  initialNotes: string | null
  status: "pending_payment" | "confirmed" | "completed" | "cancelled"
  zoomJoinUrl: string | null
  zoomMeetingId: string | null
  zoomAllocationMode?: "standalone" | "breakout_room" | string | null
  breakoutRoomName?: string | null
  createdAt: Date | string

  // Dual Payment & Manual Transfer (Booking Awal)
  paymentMethod?: string
  manualPaymentProofR2Key?: string | null
  manualPaymentStatus?: string | null

  // Extend Session (>90 Menit: Rp 35k Sebaya / Rp 50k Psikolog per 30 Menit)
  isExtended: boolean
  extensionMinutes: number
  extensionFee: number
  extensionFeeFormatted?: string
  extensionPaymentStatus: "NONE" | "PENDING" | "PAID"
  extensionPaymentMethod?: string | null
  extensionProofR2Key?: string | null
}

export interface SessionCounselorData {
  id: string
  fullName: string
  title: string
  counselorType: "peer" | "psychologist"
  counselorTypeDisplay: string
  bio: string
  specializations: string[]
  avatarR2Url: string | null
}

export interface SessionScheduleData {
  id: string
  date: string
  startTime: string
  endTime: string
  timeRange: string
  formattedDate: string
}

export interface SessionTransactionData {
  id: string
  paymentProvider: string
  paymentMethod: string | null
  referenceNumber: string | null
  grossAmount: number
  discountAmount: number
  netAmount: number
  netAmountFormatted: string
  status: string
}

/**
 * Strict Client-Safe Session Report View (CONFIDENTIALITY GUARD)
 * internal_notes and attachment_r2_keys are strictly excluded at both the type level
 * and database select level to guarantee zero privacy leak to clients or third parties.
 */
export interface ClientSessionReportView {
  id: string
  mainIssue: string
  summary: string
  actionPlan: string | null
  followUpRecommendation: string | null
  createdAt: string
}

export interface SessionPlatformSettings {
  isManualPaymentEnabled: boolean
  manualPaymentInstructions: string
  bcaAccountNumber: string
  bcaAccountName: string
}

export interface SessionPageData {
  booking: SessionBookingData
  counselor: SessionCounselorData
  schedule: SessionScheduleData
  transaction: SessionTransactionData | null
  report?: ClientSessionReportView | null
  hasReport?: boolean
  platformSettings?: SessionPlatformSettings
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

