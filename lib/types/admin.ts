/**
 * Type contracts for Admin Portal domain entities.
 * Decoupled from any mock data sources.
 */

export interface StatMetric {
  label: string
  value: string
  subtext: string
  trend?: string
  trendUp?: boolean
}

export interface ZoomAccount {
  id: string
  name: string
  email: string
  status: "in_session" | "idle" | "error"
  currentMeeting?: {
    code: string
    counselor: string
    patient: string
    timeRange: string
  }
  safetyLock: {
    isLocked: boolean
    reason: string
    upcomingCount: number
  }
  tokenExpiresIn: string
}

export interface CounselorApplicant {
  id: string
  name: string
  email: string
  phone: string
  type: "Psikolog Klinis" | "Konselor Sebaya"
  appliedAt: string
  status: "pending" | "approved" | "rejected"
  strNumber?: string
  education: string
  bio: string
  documents: {
    ktp: boolean
    cv: boolean
    diploma: boolean
    str?: boolean
  }
  docKeys?: {
    ktp?: string | null
    cv?: string | null
    diploma?: string | null
    str?: string | null
  }
}

export interface BookingSession {
  id: string
  code: string
  patientName: string
  patientContact: string
  counselorName: string
  counselorType: "Psikolog Klinis" | "Konselor Sebaya"
  date: string
  timeRange: string
  hoursUntilSession: number
  status: "in_session" | "confirmed" | "completed" | "cancelled" | "pending_payment"
  zoomRoom: string
  zoomJoinUrl: string
  zoomAccountId?: string | null
  zoomSlotNumber?: 1 | 2 | null
  zoomAccountName?: string | null
  srqScore: number
  hasSuicidalThoughts: boolean
  waiverSigned?: boolean
  paymentMethod: string
  paymentProvider?: "xendit" | "manual"
  referenceNumber?: string
  adminNotes?: string
  amount: number
  voucherCode?: string
}

export interface ActiveCounselor {
  id: string
  name: string
  title: string
  type: "Psikolog Klinis" | "Konselor Sebaya"
  email: string
  phone: string
  strNumber?: string
  totalSessions: number
  isActive: boolean
  joinedDate: string
  specializations: string[]
  avatarR2Url?: string | null
  education?: string
}

export interface VoucherItem {
  code: string
  discount: string
  usedQuota: number
  totalQuota: number
  status: "active" | "exhausted" | "expired"
  expiryDate: string
}

export interface GalleryItem {
  id: string
  imageUrl: string
  aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16"
  dimensions?: string
  fileSize?: string
  title?: string
  caption?: string
  date?: string
  category?: string
  isCensoredAndConsented?: boolean
  uploadedBy?: string
  placement?: "hero" | "events" | "community" | "archive"
  venue?: string
  isFeaturedOnHome?: boolean
}

export interface TestimonialItem {
  id: string
  clientName: string
  isAnonymous: boolean
  anonymousDisplay: string
  avatarBg?: string
  sessionCode?: string
  counselorName?: string
  counselorType?: "Psikolog Klinis" | "Konselor Sebaya" | string
  rating?: number
  quoteHighlight: string
  comment: string
  topic: string
  submittedAt: string
  isActive: boolean
  status?: "pending" | "approved" | "archived"
  isFeatured?: boolean
  consentGiven?: boolean
  hasSensitiveDetails?: boolean
  platformRating?: number
}
