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
  srqScore: number | null
  hasSuicidalThoughts: boolean
  bypassedRecommendation: boolean
  hasReport: boolean
  reportId: string | null
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
}

export interface SessionReportDetailView {
  id: string
  bookingId: string
  counselorId: string
  summary: string
  actionPlan: string
  followUpRecommendation: string | null
  attachmentR2Keys: string[]
  createdAt: string
  booking: {
    id: string
    patientName: string
    patientEmail: string
    patientPhone: string
    date: string
    timeRange: string
    initialNotes: string | null
    srqScore: number | null
    hasSuicidalThoughts: boolean
    bypassedRecommendation: boolean
  }
}
