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
  patientName: string
  patientEmail: string
  patientPhone: string
  initialNotes: string | null
  status: "pending_payment" | "confirmed" | "completed" | "cancelled"
  zoomJoinUrl: string | null
  zoomMeetingId: string | null
  createdAt: Date | string
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

export interface SessionPageData {
  booking: SessionBookingData
  counselor: SessionCounselorData
  schedule: SessionScheduleData
  transaction: SessionTransactionData | null
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
      patientName: "Budi Santoso",
      patientEmail: "budi.santoso@example.com",
      patientPhone: "081234567890",
      initialNotes: "Sering merasa lelah dan sulit berkonsentrasi pada pekerjaan beberapa pekan terakhir.",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/91234567890?pwd=solulu_demo_token",
      zoomMeetingId: "912 3456 7890",
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
  },

  // 2. Session ready now (starts in 5 minutes, Room Open / Preparing)
  "demo-session-ready": {
    booking: {
      id: "b-ready",
      accessToken: "demo-session-ready",
      patientName: "Citra Lestari",
      patientEmail: "citra.lestari@example.com",
      patientPhone: "081987654321",
      initialNotes: "Butuh teman bicara mengenai dinamika keluarga dan batasan emosional personal.",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/99887766554?pwd=solulu_ready_token",
      zoomMeetingId: "998 8776 6554",
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
  },

  // 3. Session fulfillment pending (US-24: Zoom sedang disiapkan)
  "demo-session-pending-zoom": {
    booking: {
      id: "b-pending-zoom",
      accessToken: "demo-session-pending-zoom",
      patientName: "Rian Hidayat",
      patientEmail: "rian.hidayat@example.com",
      patientPhone: "081299887766",
      initialNotes: "Konsultasi perdana mengenai overthinking dan pola tidur yang terganggu.",
      status: "confirmed",
      zoomJoinUrl: null,
      zoomMeetingId: null,
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
      patientName: "Ahmad Fauzi",
      patientEmail: "ahmad.fauzi@example.com",
      patientPhone: "081234567899",
      initialNotes: "Kelelahan emosional dan merasa burnout dalam pekerjaan beberapa bulan terakhir.",
      status: "pending_payment",
      zoomJoinUrl: null,
      zoomMeetingId: null,
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
}
