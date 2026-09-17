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
  status: "in_session" | "confirmed" | "completed" | "cancelled"
  zoomRoom: string
  zoomJoinUrl: string
  srqScore: number
  hasSuicidalThoughts: boolean
  waiverSigned?: boolean
  paymentMethod: string
  amount: number
  voucherCode?: string
}

export interface VoucherItem {
  code: string
  discount: string
  usedQuota: number
  totalQuota: number
  status: "active" | "exhausted" | "expired"
  expiryDate: string
}

export const MOCK_METRICS: StatMetric[] = [
  {
    label: "Sesi Hari Ini",
    value: "8 Sesi",
    subtext: "2 berlangsung • 4 selesai • 2 mendatang",
    trend: "+25% vs kemarin",
    trendUp: true,
  },
  {
    label: "Omzet Bulan Ini",
    value: "Rp 4.850.000",
    subtext: "Dari 46 total sesi tervalidasi",
    trend: "82% dari target",
    trendUp: true,
  },
  {
    label: "Slot Hold (Pending)",
    value: "2 Transaksi",
    subtext: "Menunggu webhook Xendit (15m lock)",
  },
  {
    label: "Pelamar Mitra Baru",
    value: "3 Kandidat",
    subtext: "2 menunggu review dokumen",
    trend: "Butuh tindakan",
    trendUp: false,
  },
]

export const MOCK_ZOOM_ACCOUNTS: ZoomAccount[] = [
  {
    id: "zoom-1",
    name: "Akun Zoom Pro 1 (Primary)",
    email: "solulu.room1@gmail.com",
    status: "in_session",
    currentMeeting: {
      code: "SL-9281",
      counselor: "Sarah Annisa, M.Psi",
      patient: "Anindya Putri",
      timeRange: "19:00 – 20:30 WIB",
    },
    safetyLock: {
      isLocked: true,
      reason: "Terkunci: Memiliki 1 sesi berlangsung dan 2 sesi mendatang terkonfirmasi.",
      upcomingCount: 3,
    },
    tokenExpiresIn: "48 menit (OAuth Cached)",
  },
  {
    id: "zoom-2",
    name: "Akun Zoom Pro 2 (Backup & Overflow)",
    email: "solulu.room2@gmail.com",
    status: "in_session",
    currentMeeting: {
      code: "SL-9282",
      counselor: "Rian Hidayat, S.Psi",
      patient: "Dimas Arya",
      timeRange: "19:30 – 21:00 WIB",
    },
    safetyLock: {
      isLocked: true,
      reason: "Terkunci: Sedang melayani sesi overlap 19:30 - 21:00 WIB.",
      upcomingCount: 2,
    },
    tokenExpiresIn: "52 menit (OAuth Cached)",
  },
]

export const MOCK_APPLICANTS: CounselorApplicant[] = [
  {
    id: "app-1",
    name: "Sarah Annisa, M.Psi., Psikolog",
    email: "sarah.annisa@example.com",
    phone: "0812-3456-7890",
    type: "Psikolog Klinis",
    appliedAt: "17 Sep 2026, 14:20 WIB",
    status: "pending",
    strNumber: "1902837482910",
    education: "Magister Psikologi Profesi Klinis - Universitas Indonesia",
    bio: "Berpengalaman menangani kecemasan, depresi, trauma, dan burnout pada dewasa muda selama 5 tahun.",
    documents: {
      ktp: true,
      cv: true,
      diploma: true,
      str: true,
    },
  },
  {
    id: "app-2",
    name: "Budi Prasetyo, S.Psi",
    email: "budi.prasetyo@example.com",
    phone: "0857-9876-5432",
    type: "Konselor Sebaya",
    appliedAt: "17 Sep 2026, 11:05 WIB",
    status: "pending",
    education: "S1 Psikologi - Universitas Gadjah Mada",
    bio: "Fokus pendampingan stres akademik, relasi keluarga, dan self-esteem mahasiswa.",
    documents: {
      ktp: true,
      cv: true,
      diploma: true,
      str: false,
    },
  },
]

export const MOCK_SESSIONS: BookingSession[] = [
  {
    id: "b-1",
    code: "SL-9281",
    patientName: "Anindya Putri",
    patientContact: "anindya.p@gmail.com • 0811-2233-4455",
    counselorName: "Sarah Annisa, M.Psi",
    counselorType: "Psikolog Klinis",
    date: "17 Sep 2026",
    timeRange: "19:00 – 20:30 WIB",
    status: "in_session",
    zoomRoom: "Zoom Pro 1",
    zoomJoinUrl: "https://zoom.us/j/8821938192",
    srqScore: 5,
    hasSuicidalThoughts: false,
    paymentMethod: "QRIS Xendit",
    amount: 150000,
  },
  {
    id: "b-2",
    code: "SL-9282",
    patientName: "Dimas Arya",
    patientContact: "dimas.a@gmail.com • 0813-9988-7766",
    counselorName: "Rian Hidayat, S.Psi",
    counselorType: "Konselor Sebaya",
    date: "17 Sep 2026",
    timeRange: "19:30 – 21:00 WIB",
    status: "in_session",
    zoomRoom: "Zoom Pro 2",
    zoomJoinUrl: "https://zoom.us/j/7712391029",
    srqScore: 10,
    hasSuicidalThoughts: true,
    waiverSigned: true,
    paymentMethod: "GoPay Xendit",
    amount: 75000,
  },
  {
    id: "b-3",
    code: "SL-9283",
    patientName: "Clara Susanti",
    patientContact: "clara.s@outlook.com • 0852-1144-8833",
    counselorName: "Sarah Annisa, M.Psi",
    counselorType: "Psikolog Klinis",
    date: "17 Sep 2026",
    timeRange: "21:00 – 22:30 WIB",
    status: "confirmed",
    zoomRoom: "Zoom Pro 1 (Dispatched)",
    zoomJoinUrl: "https://zoom.us/j/9910238122",
    srqScore: 3,
    hasSuicidalThoughts: false,
    paymentMethod: "BCA Virtual Account",
    amount: 125000,
    voucherCode: "SOLULUBARU",
  },
  {
    id: "b-4",
    code: "SL-9279",
    patientName: "Faisal Rahman",
    patientContact: "faisal.r@gmail.com • 0821-7733-1100",
    counselorName: "Rian Hidayat, S.Psi",
    counselorType: "Konselor Sebaya",
    date: "17 Sep 2026",
    timeRange: "16:00 – 17:30 WIB",
    status: "completed",
    zoomRoom: "Zoom Pro 1",
    zoomJoinUrl: "https://zoom.us/j/6619283019",
    srqScore: 6,
    hasSuicidalThoughts: false,
    paymentMethod: "ShopeePay",
    amount: 75000,
  },
]

export const MOCK_PRICING = {
  peerRate: 75000,
  psychologistRate: 150000,
  peerPromoRate: 60000,
}

export const MOCK_VOUCHERS: VoucherItem[] = [
  {
    code: "SOLULUBARU",
    discount: "Potongan Rp 25.000 (Flat)",
    usedQuota: 42,
    totalQuota: 50,
    status: "active",
    expiryDate: "30 Sep 2026",
  },
  {
    code: "SEJIWA20",
    discount: "Diskon 20%",
    usedQuota: 18,
    totalQuota: 30,
    status: "active",
    expiryDate: "15 Okt 2026",
  },
  {
    code: "FLASHSALE",
    discount: "Potongan Rp 50.000",
    usedQuota: 10,
    totalQuota: 10,
    status: "exhausted",
    expiryDate: "10 Sep 2026",
  },
]
