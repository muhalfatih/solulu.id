import type { SessionPageData } from "@/lib/session/types"

export const DEMO_SESSIONS: Record<string, SessionPageData> = {
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
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
      specializations: ["Kecemasan & Stres", "Burnout & Kelelahan"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-upcoming",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTime: "10:00:00",
      endTime: "11:30:00",
      timeRange: "10:00 – 11:30 WIB",
      formattedDate: "Besok",
    },
    transaction: {
      id: "t-upcoming",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-2026-UPCOMING",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: "Rp 180.000",
      status: "PAID",
    },
  },
  "demo-session-pending": {
    booking: {
      id: "b-pending",
      accessToken: "demo-session-pending",
      bookingCode: "SL-9911",
      patientName: "Dewi Lestari",
      patientEmail: "dewi.lestari@example.com",
      patientPhone: "081234567890",
      initialNotes: "Konsultasi perdana mengenai adaptasi lingkungan kerja baru.",
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
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan.",
      specializations: ["Kecemasan & Stres"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-pending",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTime: "19:00:00",
      endTime: "20:30:00",
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: "Besok Malam",
    },
    transaction: {
      id: "t-pending",
      paymentProvider: "manual",
      paymentMethod: "Bank BCA",
      referenceNumber: "SOL-MANUAL-98210",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: "Rp 180.000",
      status: "PENDING",
    },
  },
}

export const DEMO_COUNSELORS: Record<string, any> = {
  "c-1": {
    id: "c-1",
    fullName: "Sarah Annisa, M.Psi., Psikolog",
    title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
    counselorType: "psychologist",
    bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
    specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-2": {
    id: "c-2",
    fullName: "Rian Hidayat, S.Psi",
    title: "Konselor Sebaya Senior • Tersertifikasi Konseling Pemuda",
    counselorType: "peer",
    bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
    specializations: ["Stres Kuliah", "Quarter-Life Crisis", "Relasi Asmara", "Karir"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-3": {
    id: "c-3",
    fullName: "Dr. Nadia Larasati, M.Psi",
    title: "Psikolog Klinis Dewasa • No. STR: 1902837482999",
    counselorType: "psychologist",
    bio: "Pendekatan berbasis bukti ilmiah untuk penanganan depresi ringan hingga sedang, pemulihan luka masa kecil, serta peningkatan self-esteem dan penerimaan diri.",
    specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri", "Regulasi Emosi"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-4": {
    id: "c-4",
    fullName: "Nabila Safitri, S.Psi",
    title: "Konselor Sebaya Remaja • Fasilitator Komunitas Sejiwa",
    counselorType: "peer",
    bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
    specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
    avatarR2Url: null,
    isActive: true,
  },
}

export const TEST_COUNSELORS = DEMO_COUNSELORS

export function getTestSchedules(): Record<string, any> {
  const d1 = new Date()
  d1.setDate(d1.getDate() + 1)
  const d1Str = d1.toISOString().split("T")[0]

  const d2 = new Date()
  d2.setDate(d2.getDate() + 2)
  const d2Str = d2.toISOString().split("T")[0]

  return {
    "s-101": { id: "s-101", counselorId: "c-1", date: d1Str, startTime: "09:00", endTime: "10:30", status: "available" },
    "s-102": { id: "s-102", counselorId: "c-1", date: d1Str, startTime: "19:00", endTime: "20:30", status: "available" },
    "s-103": { id: "s-103", counselorId: "c-1", date: d2Str, startTime: "13:30", endTime: "15:00", status: "available" },
    "s-201": { id: "s-201", counselorId: "c-2", date: d1Str, startTime: "11:00", endTime: "12:30", status: "available" },
    "s-202": { id: "s-202", counselorId: "c-2", date: d1Str, startTime: "15:30", endTime: "17:00", status: "available" },
    "s-203": { id: "s-203", counselorId: "c-2", date: d2Str, startTime: "19:00", endTime: "20:30", status: "available" },
    "s-301": { id: "s-301", counselorId: "c-3", date: d1Str, startTime: "10:00", endTime: "11:30", status: "available" },
    "s-302": { id: "s-302", counselorId: "c-3", date: d2Str, startTime: "14:00", endTime: "15:30", status: "available" },
    "s-401": { id: "s-401", counselorId: "c-4", date: d1Str, startTime: "13:30", endTime: "15:00", status: "available" },
    "s-402": { id: "s-402", counselorId: "c-4", date: d2Str, startTime: "16:00", endTime: "17:30", status: "available" },
  }
}

export const TEST_SCHEDULES: Record<string, any> = getTestSchedules()
export const DEMO_SCHEDULES = TEST_SCHEDULES
