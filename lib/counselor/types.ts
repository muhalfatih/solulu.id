export interface CounselorAuthContext {
  id: string
  counselorId?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export interface CounselorActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export interface CounselorUpcomingSessionView {
  id: string
  accessToken: string
  bookingCode: string
  patientName: string
  patientEmail: string
  patientPhone: string
  initialNotes: string | null
  date: string
  startTime: string
  endTime: string
  timeRange: string
  status: "pending_payment" | "confirmed" | "completed" | "cancelled" | "rescheduled"
  zoomStartUrl: string | null
  zoomMeetingId: string | null
  zoomHostKey: string | null
  zoomAccountNumber: number | null
  zoomAllocationMode: "standalone" | "breakout_room" | string | null
  breakoutRoomName: string | null
  counselorType: "peer" | "psychologist"
  counselorName: string
  isExtended: boolean
  extensionMinutes: number
  extensionFee: string | number
  extensionPaymentStatus: string
  customRates?: { peerRate?: number; psychologistRate?: number }
  srqScore: number | null
  hasSuicidalThoughts: boolean
  bypassedRecommendation: boolean
  hasReport: boolean
  reportId: string | null
  actualDurationMinutes: number | null
  timerStartedAt: string | null
  timerStoppedAt: string | null
  operatorAdmittedAt: string | null
}

export interface CounselorProfileView {
  id: string
  userId: string
  fullName: string
  title: string
  counselorType: "peer" | "psychologist"
  bio: string
  specializations: string[]
  avatarR2Url: string | null
  isActive: boolean
  email?: string
}

export interface SessionReportDetailView {
  id: string
  bookingId: string
  counselorId: string
  mainIssue?: string
  summary: string
  actionPlan: string | null
  internalNotes?: string | null
  followUpRecommendation: string | null
  attachmentR2Keys: string[]
  actualDurationMinutes?: number | null
  timerStartedAt?: string | null
  timerStoppedAt?: string | null
  createdAt: string
  booking: {
    id: string
    patientName: string
    patientEmail: string
    patientPhone: string
    date: string
    timeRange: string
    startTime?: string
    endTime?: string
    initialNotes: string | null
    srqScore: number | null
    hasSuicidalThoughts: boolean
    bypassedRecommendation: boolean
    operatorAdmittedAt?: string | null
  }
}
