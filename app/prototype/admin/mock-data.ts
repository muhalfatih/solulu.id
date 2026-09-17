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
}

export interface GalleryItem {
  id: string
  title: string
  caption: string
  date: string
  category: "Webinar" | "Workshop" | "Sharing Session" | "Community"
  imageUrl: string
  isCensoredAndConsented: boolean
  uploadedBy: string
}

export const MOCK_ACTIVE_COUNSELORS: ActiveCounselor[] = [
  {
    id: "c-1",
    name: "Sarah Annisa, M.Psi., Psikolog",
    title: "Psikolog Klinis Dewasa",
    type: "Psikolog Klinis",
    email: "sarah.annisa@solulu.id",
    phone: "0812-3456-7890",
    strNumber: "1902837482910",
    totalSessions: 38,
    isActive: true,
    joinedDate: "12 Mei 2026",
    specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout"],
  },
  {
    id: "c-2",
    name: "Rian Hidayat, S.Psi",
    title: "Konselor Sebaya Senior",
    type: "Konselor Sebaya",
    email: "rian.hidayat@solulu.id",
    phone: "0856-1122-3344",
    totalSessions: 24,
    isActive: true,
    joinedDate: "01 Juni 2026",
    specializations: ["Stres Kuliah", "Quarter-Life Crisis", "Relasi Asmara"],
  },
  {
    id: "c-3",
    name: "Nabila Safitri, S.Psi",
    title: "Konselor Sebaya Remaja & Dewasa",
    type: "Konselor Sebaya",
    email: "nabila.safitri@solulu.id",
    phone: "0877-4455-6677",
    totalSessions: 16,
    isActive: true,
    joinedDate: "20 Juli 2026",
    specializations: ["Self-Harm Urges", "Manajemen Emosi", "Keluarga"],
  },
  {
    id: "c-4",
    name: "Dimas Wicaksono, M.Psi., Psikolog",
    title: "Psikolog Klinis Klinikal",
    type: "Psikolog Klinis",
    email: "dimas.w@solulu.id",
    phone: "0813-8899-0011",
    strNumber: "2001928374112",
    totalSessions: 42,
    isActive: false,
    joinedDate: "15 Apr 2026",
    specializations: ["Bipolar", "Kecemasan Akut", "PTSD"],
  },
]

export const MOCK_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-1",
    title: "Webinar Kesehatan Mental Gen-Z: Mengelola Quarter-Life Crisis",
    caption: "Sesi edukasi publik dihadiri 120+ peserta via Zoom. Seluruh tampilan wajah peserta telah disensor blur sesuai protokol privasi.",
    date: "10 Sep 2026",
    category: "Webinar",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
  },
  {
    id: "g-2",
    title: "Sharing Circle Mitra Konselor: Supervisi Kasus Klinis",
    caption: "Pertemuan rutin supervisi klinis bulanan bersama psikolog profesional untuk menjaga kualitas pendampingan.",
    date: "28 Agu 2026",
    category: "Sharing Session",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
  },
  {
    id: "g-3",
    title: "Workshop Peer Listening: Keterampilan Mendengar Empatis",
    caption: "Pelatihan pendamping sebaya angkatan ke-2, fokus pada de-eskalasi emosi dan rujukan darurat klinis.",
    date: "14 Agu 2026",
    category: "Workshop",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
  },
]

