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

/**
 * Demo mock sessions for testing, local previews, and browser verification
 */
export const DEMO_SESSIONS: Record<string, SessionPageData> = {
  // 1. Session upcoming tomorrow (locked)
  "demo-session-upcoming": {
    booking: {
      id: "b-upcoming",
      accessToken: "demo-session-upcoming",
      bookingCode: "SL-3001",
      patientName: "Budi Santoso",
      patientEmail: "budi.santoso@example.com",
      patientPhone: "081234567890",
      initialNotes: "Sering merasa lelah dan sulit berkonsentrasi pada pekerjaan beberapa pekan terakhir.",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/91234567890?pwd=solulu_demo_token",
      zoomMeetingId: "912 3456 7890",
      zoomAllocationMode: "standalone",
      breakoutRoomName: null,
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout). Berpengalaman lebih dari 6 tahun mendampingi pasien secara empatik.",
      specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout", "Regulasi Emosi"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-upcoming",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTime: "19:00:00",
      endTime: "20:30:00",
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: formatIndonesianDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      ),
    },
    transaction: {
      id: "t-upcoming",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-2026-UPCOMING",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: formatRupiah(180000),
      status: "PAID",
    },
    platformSettings: {
      isManualPaymentEnabled: true,
      manualPaymentInstructions: "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
      bcaAccountNumber: "123-456-7890",
      bcaAccountName: "Solulu Mental Health",
    },
  },

  // 2. Session ready now (starts in 5 minutes, Room Open / Preparing)
  "demo-session-ready": {
    booking: {
      id: "b-ready",
      accessToken: "demo-session-ready",
      bookingCode: "SL-4821",
      patientName: "Citra Lestari",
      patientEmail: "citra.lestari@example.com",
      patientPhone: "081987654321",
      initialNotes: "Butuh teman bicara mengenai dinamika keluarga dan batasan emosional personal.",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/99887766554?pwd=solulu_ready_token",
      zoomMeetingId: "998 8776 6554",
      zoomAllocationMode: "breakout_room",
      breakoutRoomName: "SL-4821 - Dimas Pratama",
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-2",
      fullName: "Dimas Pratama, S.Psi.",
      title: "Konselor Sebaya Bersertifikat",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      bio: "Pendamping sebaya terlatih dengan pendekatan non-judgmental, aktif mendampingi adaptasi kehidupan kampus, relasi pertemanan, dan mindfulness sehari-hari.",
      specializations: ["Stres Ringan", "Relasi & Batasan", "Pengembangan Diri", "Adaptasi Kampus"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-ready",
      date: new Date().toISOString().split("T")[0],
      startTime: (() => {
        const d = new Date(Date.now() + 5 * 60 * 1000)
        const utc = d.getTime() + d.getTimezoneOffset() * 60000
        const wib = new Date(utc + 7 * 3600000)
        return `${String(wib.getHours()).padStart(2, "0")}:${String(wib.getMinutes()).padStart(2, "0")}:00`
      })(),
      endTime: (() => {
        const d = new Date(Date.now() + 95 * 60 * 1000)
        const utc = d.getTime() + d.getTimezoneOffset() * 60000
        const wib = new Date(utc + 7 * 3600000)
        return `${String(wib.getHours()).padStart(2, "0")}:${String(wib.getMinutes()).padStart(2, "0")}:00`
      })(),
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: formatIndonesianDate(new Date().toISOString().split("T")[0]),
    },
    transaction: {
      id: "t-ready",
      paymentProvider: "manual",
      paymentMethod: "BCA Manual",
      referenceNumber: "TF-BCA-READY",
      grossAmount: 90000,
      discountAmount: 0,
      netAmount: 90000,
      netAmountFormatted: formatRupiah(90000),
      status: "PAID",
    },
    platformSettings: {
      isManualPaymentEnabled: true,
      manualPaymentInstructions: "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
      bcaAccountNumber: "123-456-7890",
      bcaAccountName: "Solulu Mental Health",
    },
  },

  // 3. Session fulfillment pending (US-24: Zoom sedang disiapkan)
  "demo-session-pending-zoom": {
    booking: {
      id: "b-pending-zoom",
      accessToken: "demo-session-pending-zoom",
      bookingCode: "SL-6014",
      patientName: "Rian Hidayat",
      patientEmail: "rian.hidayat@example.com",
      patientPhone: "081299887766",
      initialNotes: "Konsultasi perdana mengenai overthinking dan pola tidur yang terganggu.",
      status: "confirmed",
      zoomJoinUrl: null,
      zoomMeetingId: null,
      zoomAllocationMode: "standalone",
      breakoutRoomName: null,
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
      specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-pending-zoom",
      date: new Date().toISOString().split("T")[0],
      startTime: "20:00:00",
      endTime: "21:30:00",
      timeRange: "20:00 – 21:30 WIB",
      formattedDate: formatIndonesianDate(new Date().toISOString().split("T")[0]),
    },
    transaction: {
      id: "t-pending-zoom",
      paymentProvider: "xendit",
      paymentMethod: "GoPay",
      referenceNumber: "INV-2026-PENDING-ZOOM",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: formatRupiah(180000),
      status: "PAID",
    },
  },

  // 4. Session with payment pending verification (Waiting Room)
  "demo-session-pending": {
    booking: {
      id: "b-pending",
      accessToken: "demo-session-pending",
      bookingCode: "SL-9821",
      patientName: "Ahmad Fauzi",
      patientEmail: "ahmad.fauzi@example.com",
      patientPhone: "081234567899",
      initialNotes: "Kelelahan emosional dan merasa burnout dalam pekerjaan beberapa bulan terakhir.",
      status: "pending_payment",
      zoomJoinUrl: null,
      zoomMeetingId: null,
      zoomAllocationMode: "standalone",
      breakoutRoomName: null,
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
      specializations: ["Kecemasan & Stres", "Burnout & Kelelahan"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-pending",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTime: "19:00:00",
      endTime: "20:30:00",
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: formatIndonesianDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      ),
    },
    transaction: {
      id: "t-pending",
      paymentProvider: "manual",
      paymentMethod: "Bank BCA",
      referenceNumber: "SOL-MANUAL-98210",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: formatRupiah(180000),
      status: "PENDING",
    },
  },

  // 5. Session with extend bill pending (Dual Payment demo)
  "demo-session-extended": {
    booking: {
      id: "b-extended",
      accessToken: "demo-session-extended",
      bookingCode: "SL-5012",
      patientName: "Fitria Andini",
      patientEmail: "fitria.andini@example.com",
      patientPhone: "081234567890",
      initialNotes: "Diskusi mendalam mengenai regulasi emosi dan batasan keluarga.",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/91122334455?pwd=solulu_extend_token",
      zoomMeetingId: "911 2233 4455",
      zoomAllocationMode: "standalone",
      breakoutRoomName: null,
      isExtended: true,
      extensionMinutes: 30,
      extensionFee: 35000,
      extensionFeeFormatted: "Rp 35.000",
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-2",
      fullName: "Dimas Pratama, S.Psi.",
      title: "Konselor Sebaya Bersertifikat",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      bio: "Pendamping sebaya terlatih dengan pendekatan non-judgmental.",
      specializations: ["Regulasi Emosi", "Relasi", "Self-compassion"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-extended",
      date: new Date().toISOString().split("T")[0],
      startTime: "14:00:00",
      endTime: "16:00:00",
      timeRange: "14:00 – 16:00 WIB",
      formattedDate: formatIndonesianDate(new Date().toISOString().split("T")[0]),
    },
    transaction: {
      id: "t-extended",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-2026-EXTENDED",
      grossAmount: 85000,
      discountAmount: 0,
      netAmount: 85000,
      netAmountFormatted: formatRupiah(85000),
      status: "PAID",
    },
    platformSettings: {
      isManualPaymentEnabled: true,
      manualPaymentInstructions: "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
      bcaAccountNumber: "123-456-7890",
      bcaAccountName: "Solulu Mental Health",
    },
  },

  // 6. Session completed with official report ready to unlock via WhatsApp
  "demo-session-completed": {
    booking: {
      id: "b-completed",
      accessToken: "demo-session-completed",
      bookingCode: "SL-2005",
      patientName: "Dewi Safitri",
      patientEmail: "dewi.safitri@example.com",
      patientPhone: "081234567890",
      initialNotes: "Kecemasan karir dan quarter-life crisis.",
      status: "completed",
      zoomJoinUrl: "https://zoom.us/j/95544332211",
      zoomMeetingId: "955 4433 2211",
      zoomAllocationMode: "standalone",
      breakoutRoomName: null,
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan.",
      specializations: ["Kecemasan", "Quarter-life Crisis", "Manajemen Stres"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-completed",
      date: new Date().toISOString().split("T")[0],
      startTime: "10:00:00",
      endTime: "12:00:00",
      timeRange: "10:00 – 12:00 WIB",
      formattedDate: formatIndonesianDate(new Date().toISOString().split("T")[0]),
    },
    transaction: {
      id: "t-completed",
      paymentProvider: "xendit",
      paymentMethod: "BCA VA",
      referenceNumber: "INV-2026-COMPLETED",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: formatRupiah(180000),
      status: "PAID",
    },
    hasReport: true,
    report: null, // Locked until WhatsApp verified
    platformSettings: {
      isManualPaymentEnabled: true,
      manualPaymentInstructions: "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health.",
      bcaAccountNumber: "123-456-7890",
      bcaAccountName: "Solulu Mental Health",
    },
  },
}
