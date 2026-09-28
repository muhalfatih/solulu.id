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
  hoursUntilSession: number // For H-12 rule test
  status: "in_session" | "confirmed" | "completed" | "cancelled" | "pending_payment"
  zoomRoom: string
  zoomJoinUrl: string
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

export const MOCK_METRICS: StatMetric[] = [
  {
    label: "Sesi Hari Ini",
    value: "8 Sesi",
    subtext: "2 live • 4 selesai • 2 mendatang",
    trend: "+25% vs kemarin",
    trendUp: true,
  },
  {
    label: "Omzet Bulan Ini",
    value: "Rp 4.850.000",
    subtext: "Dari 46 sesi terselesaikan",
    trend: "82% target",
    trendUp: true,
  },
  {
    label: "Slot Hold (Pending)",
    value: "2 Transaksi",
    subtext: "Batas 15 menit Xendit invoice",
  },
  {
    label: "Pelamar Mitra Baru",
    value: "3 Kandidat",
    subtext: "2 butuh review dokumen KTP/STR",
    trend: "Tindakan diperlukan",
    trendUp: false,
  },
]

export const MOCK_ZOOM_ACCOUNTS: ZoomAccount[] = [
  {
    id: "zoom-1",
    name: "Akun Zoom Pro 1 (Primary Host)",
    email: "solulu.room1@gmail.com",
    status: "in_session",
    currentMeeting: {
      code: "SL-9281",
      counselor: "Sarah Annisa, M.Psi., Psikolog",
      patient: "Anindya Putri",
      timeRange: "19:00 - 20:30 WIB",
    },
    safetyLock: {
      isLocked: true,
      reason: "Terkunci: Memiliki 1 sesi aktif dan 2 sesi mendatang. Kredensial tidak dapat diubah demi menjaga kelancaran ruang konsultasi pasien.",
      upcomingCount: 3,
    },
    tokenExpiresIn: "48 menit (OAuth Cached)",
  },
  {
    id: "zoom-2",
    name: "Akun Zoom Pro 2 (Backup & Overlap)",
    email: "solulu.room2@gmail.com",
    status: "in_session",
    currentMeeting: {
      code: "SL-9282",
      counselor: "Rian Hidayat, S.Psi",
      patient: "Dimas Arya",
      timeRange: "19:30 - 21:00 WIB",
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
    bio: "Berpengalaman 5 tahun dalam intervensi klinis dewasa muda, penanganan gangguan kecemasan umum, depresi, dan trauma.",
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
    id: "b-pending-1",
    code: "SL-9289",
    patientName: "Nanda Pratama",
    patientContact: "nanda.p@gmail.com • 0812-9876-5432",
    counselorName: "Sarah Annisa, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    date: "18 Sep 2026 (Besok)",
    timeRange: "14:00 - 15:30 WIB",
    hoursUntilSession: 21,
    status: "pending_payment",
    zoomRoom: "Menunggu Alokasi",
    zoomJoinUrl: "",
    srqScore: 6,
    hasSuicidalThoughts: false,
    paymentMethod: "Transfer Manual (Menunggu Konfirmasi)",
    paymentProvider: "manual",
    amount: 150000,
  },
  {
    id: "b-pending-2",
    code: "SL-9290",
    patientName: "Bagus Setiawan",
    patientContact: "bagus.s@yahoo.com • 0857-1234-5678",
    counselorName: "Rian Hidayat, S.Psi",
    counselorType: "Konselor Sebaya",
    date: "18 Sep 2026 (Besok)",
    timeRange: "16:00 - 17:30 WIB",
    hoursUntilSession: 23,
    status: "pending_payment",
    zoomRoom: "Menunggu Alokasi",
    zoomJoinUrl: "",
    srqScore: 4,
    hasSuicidalThoughts: false,
    paymentMethod: "Transfer Manual (Menunggu Konfirmasi)",
    paymentProvider: "manual",
    amount: 75000,
  },
  {
    id: "b-pending-3",
    code: "SL-9293",
    patientName: "Citra Kirana",
    patientContact: "citra.k@gmail.com • 0813-5566-7788",
    counselorName: "Sarah Annisa, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    date: "18 Sep 2026 (Besok)",
    timeRange: "19:00 - 20:30 WIB",
    hoursUntilSession: 26,
    status: "pending_payment",
    zoomRoom: "Menunggu Alokasi",
    zoomJoinUrl: "",
    srqScore: 5,
    hasSuicidalThoughts: false,
    paymentMethod: "Transfer Manual (Menunggu Konfirmasi)",
    paymentProvider: "manual",
    amount: 150000,
  },
  {
    id: "b-1",
    code: "SL-9281",
    patientName: "Anindya Putri",
    patientContact: "anindya.p@gmail.com • 0811-2233-4455",
    counselorName: "Sarah Annisa, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    date: "17 Sep 2026 (Hari Ini)",
    timeRange: "19:00 - 20:30 WIB",
    hoursUntilSession: 2, // < 12 hours -> BLOCKED RESCHEDULE SCENARIO
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
    code: "SL-9285",
    patientName: "Gita Rahmawati",
    patientContact: "gita.r@gmail.com • 0812-4455-6677",
    counselorName: "Sarah Annisa, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    date: "22 Sep 2026 (Selasa)",
    timeRange: "19:00 - 20:30 WIB",
    hoursUntilSession: 116, // > 12 hours -> ALLOWED RESCHEDULE SCENARIO
    status: "confirmed",
    zoomRoom: "Zoom Pro 1",
    zoomJoinUrl: "https://zoom.us/j/9928172615",
    srqScore: 4,
    hasSuicidalThoughts: false,
    paymentMethod: "BCA Virtual Account",
    amount: 150000,
  },
  {
    id: "b-3",
    code: "SL-9282",
    patientName: "Dimas Arya",
    patientContact: "dimas.a@gmail.com • 0813-9988-7766",
    counselorName: "Rian Hidayat, S.Psi",
    counselorType: "Konselor Sebaya",
    date: "17 Sep 2026 (Hari Ini)",
    timeRange: "19:30 - 21:00 WIB",
    hoursUntilSession: 3,
    status: "in_session",
    zoomRoom: "Zoom Pro 2",
    zoomJoinUrl: "https://zoom.us/j/7712391029",
    srqScore: 12,
    hasSuicidalThoughts: true,
    waiverSigned: true,
    paymentMethod: "GoPay Xendit",
    amount: 75000,
  },
  {
    id: "b-4",
    code: "SL-9283",
    patientName: "Clara Susanti",
    patientContact: "clara.s@outlook.com • 0852-1144-8833",
    counselorName: "Sarah Annisa, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    date: "17 Sep 2026",
    timeRange: "21:00 - 22:30 WIB",
    hoursUntilSession: 4,
    status: "confirmed",
    zoomRoom: "Zoom Pro 1",
    zoomJoinUrl: "https://zoom.us/j/9910238122",
    srqScore: 3,
    hasSuicidalThoughts: false,
    paymentMethod: "BCA Virtual Account",
    amount: 125000,
    voucherCode: "SOLULUBARU",
  },
  {
    id: "b-5",
    code: "SL-9279",
    patientName: "Faisal Rahman",
    patientContact: "faisal.r@gmail.com • 0821-7733-1100",
    counselorName: "Rian Hidayat, S.Psi",
    counselorType: "Konselor Sebaya",
    date: "17 Sep 2026",
    timeRange: "16:00 - 17:30 WIB",
    hoursUntilSession: -2,
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
    title: "Konselor Sebaya Remaja",
    type: "Konselor Sebaya",
    email: "nabila.safitri@solulu.id",
    phone: "0877-4455-6677",
    totalSessions: 16,
    isActive: true,
    joinedDate: "20 Juli 2026",
    specializations: ["Self-Harm Urges", "Manajemen Emosi", "Keluarga"],
  },
]

export const MOCK_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-1",
    title: "Tangkapan Layar Webinar Gen-Z: Mengatasi Quarter-Life Crisis",
    caption: "Tangkapan layar penutupan sesi webinar via Zoom dihadiri 120 peserta. Wajah peserta telah disamarkan sesuai kode etik informed consent.",
    date: "14 Sep 2026",
    category: "Webinar",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1920 × 1080",
    fileSize: "840 KB",
    aspectRatio: "16:9",
    placement: "hero",
    venue: "Zoom Cloud Meeting Pro 1",
    isFeaturedOnHome: true,
  },
  {
    id: "g-2",
    title: "Dokumentasi Workshop Mindfulness Korporat di Tempat Kerja",
    caption: "Dokumentasi foto aktivitas latihan pernapasan dan relaksasi otot bagi karyawan perbankan guna mencegah kelelahan mental kerja.",
    date: "02 Sep 2026",
    category: "Workshop",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "2400 × 1600",
    fileSize: "1.4 MB",
    aspectRatio: "16:9",
    placement: "hero",
    venue: "Menara Astra Jakarta",
    isFeaturedOnHome: true,
  },
  {
    id: "g-3",
    title: "Tangkapan Layar Sesi Supervisi Kasus Klinis Mitra Konselor",
    caption: "Pertemuan berkala pembinaan klinis dan evaluasi etika pendampingan bersama psikolog penanggung jawab via Zoom.",
    date: "28 Agu 2026",
    category: "Sharing Session",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1920 × 1080",
    fileSize: "920 KB",
    aspectRatio: "16:9",
    placement: "events",
    venue: "Zoom Cloud Meeting Pro 2",
    isFeaturedOnHome: false,
  },
  {
    id: "g-4",
    title: "Foto Edukasi Kesehatan Mental: Kenali Tanda Kelelahan Akademik",
    caption: "Sesi sosialisasi tatap muka bagi mahasiswa baru mengenai strategi mengatasi tekanan tugas kuliah dan kecemasan adaptasi.",
    date: "18 Agu 2026",
    category: "Community",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "2048 × 1536",
    fileSize: "1.1 MB",
    aspectRatio: "4:3",
    placement: "events",
    venue: "Auditorium Fakultas Psikologi UI",
    isFeaturedOnHome: false,
  },
  {
    id: "g-5",
    title: "Tangkapan Layar Diskusi Interaktif: Mengelola Kecemasan Sosial",
    caption: "Sesi tanya jawab interaktif antara peserta dan psikolog klinis seputar rasa takut dihakimi di lingkungan profesional.",
    date: "05 Agu 2026",
    category: "Webinar",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1920 × 1080",
    fileSize: "780 KB",
    aspectRatio: "16:9",
    placement: "hero",
    venue: "Zoom Cloud Meeting Pro 1",
    isFeaturedOnHome: true,
  },
  {
    id: "g-6",
    title: "Foto Pelatihan Pertolongan Pertama Emosional bagi Relawan",
    caption: "Simulasi praktik mendengar aktif dan validasi perasaan tanpa menghakimi dalam sesi intensif konselor sebaya.",
    date: "22 Jul 2026",
    category: "Workshop",
    imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1600 × 1600",
    fileSize: "650 KB",
    aspectRatio: "1:1",
    placement: "community",
    venue: "Ruang Kolaborasi Solulu Bandung",
    isFeaturedOnHome: false,
  },
  {
    id: "g-7",
    title: "Tangkapan Layar Lingkar Cerita Virtual: Ruang Aman Pasien Bipolar",
    caption: "Sesi dukungan kelompok tertutup dengan perlindungan kerahasiaan identitas dan sensor visual penuh pada galeri foto.",
    date: "10 Jul 2026",
    category: "Sharing Session",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1600 × 1200",
    fileSize: "890 KB",
    aspectRatio: "4:3",
    placement: "archive",
    venue: "Zoom Cloud Meeting Pro 2",
    isFeaturedOnHome: false,
  },
  {
    id: "g-8",
    title: "Foto Kampanye Hari Kesehatan Jiwa: Berani Cerita, Kamu Tidak Sendiri",
    caption: "Aksi turun ke jalan membagikan pesan afirmasi positif dan kupon telekonseling gratis kepada pejalan kaki Car Free Day.",
    date: "28 Jun 2026",
    category: "Community",
    imageUrl: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=1200&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
    dimensions: "1800 × 1200",
    fileSize: "1.3 MB",
    aspectRatio: "16:9",
    placement: "events",
    venue: "Area Car Free Day Sudirman Jakarta",
    isFeaturedOnHome: false,
  },
]

export interface TestimonialItem {
  id: string
  clientName: string
  isAnonymous: boolean
  anonymousDisplay: string
  avatarBg?: string
  sessionCode?: string
  counselorName: string
  counselorType?: "Psikolog Klinis" | "Konselor Sebaya"
  rating: number
  quoteHighlight: string
  comment: string
  topic: "Kecemasan & Overthinking" | "Karier & Burnout" | "Relasi & Keluarga" | "Depresi Ringan" | "Pengembangan Diri"
  submittedAt: string
  isActive: boolean
  status?: "pending" | "approved" | "archived"
  isFeatured?: boolean
  consentGiven?: boolean
  hasSensitiveDetails?: boolean
  platformRating?: number
}

export const MOCK_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t-1",
    clientName: "Rian Adiputra",
    isAnonymous: true,
    anonymousDisplay: "R.A.",
    avatarBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    sessionCode: "SL-202609-0412",
    counselorName: "Siti Rahmawati, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    rating: 5,
    quoteHighlight: "Pertama kali merasa didengar tanpa dihakimi sama sekali.",
    comment: "Awalnya ragu konseling online karena takut canggung. Ternyata Kak Siti sangat hangat dan membimbing saya mengurai benang kusut overthinking pekerjaan. Latihan grounding yang diajarkan langsung terasa efeknya saat panik melanda.",
    topic: "Kecemasan & Overthinking",
    submittedAt: "18 Sep 2026, 14:30 WIB",
    isActive: true,
    status: "approved",
    isFeatured: true,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 5,
  },
  {
    id: "t-2",
    clientName: "Nadia Salsabila",
    isAnonymous: false,
    anonymousDisplay: "Nadia S.",
    avatarBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    sessionCode: "SL-202609-0388",
    counselorName: "Budi Santoso, S.Psi.",
    counselorType: "Konselor Sebaya",
    rating: 5,
    quoteHighlight: "Rasanya seperti ngobrol dengan sahabat yang paham betul beban burnout kerja.",
    comment: "Sesi konseling sebaya dengan Mas Budi membuka mata saya tentang pentingnya batasan waktu kerja. Tidak ada istilah teknis rumit, semua saran sangat praktis dan bisa langsung saya terapkan minggu ini juga.",
    topic: "Karier & Burnout",
    submittedAt: "18 Sep 2026, 11:15 WIB",
    isActive: true,
    status: "approved",
    isFeatured: true,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 5,
  },
  {
    id: "t-3",
    clientName: "Dimas Prasetyo",
    isAnonymous: true,
    anonymousDisplay: "Klien Anonim",
    avatarBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    sessionCode: "SL-202609-0429",
    counselorName: "Dr. Dian Pratama, Sp.KJ",
    counselorType: "Psikolog Klinis",
    rating: 5,
    quoteHighlight: "Privasi benar-benar terjaga, proses booking tanpa perlu buat akun sangat melegakan.",
    comment: "Saya sangat menghargai komitmen Solulu terhadap kerahasiaan data. Konsultasi dengan Dokter Dian memberi saya perspektif medis yang jelas mengenai kecemasan kronis yang saya alami selama dua tahun terakhir.",
    topic: "Kecemasan & Overthinking",
    submittedAt: "17 Sep 2026, 19:40 WIB",
    isActive: false,
    status: "pending",
    isFeatured: false,
    consentGiven: true,
    hasSensitiveDetails: true,
    platformRating: 5,
  },
  {
    id: "t-4",
    clientName: "Anindya Kusuma",
    isAnonymous: false,
    anonymousDisplay: "Anindya K.",
    avatarBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    sessionCode: "SL-202609-0355",
    counselorName: "Siti Rahmawati, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    rating: 5,
    quoteHighlight: "Membantu saya dan pasangan mengurai konflik komunikasi yang buntu.",
    comment: "Kami mengambil sesi konseling relasi dan mendapatkan banyak sudut pandang baru. Fasilitasi yang netral dari Kak Siti membuat kami berdua bisa saling mendengarkan tanpa saling menyalahkan.",
    topic: "Relasi & Keluarga",
    submittedAt: "16 Sep 2026, 16:20 WIB",
    isActive: true,
    status: "approved",
    isFeatured: true,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 5,
  },
  {
    id: "t-5",
    clientName: "Farhan Hidayat",
    isAnonymous: true,
    anonymousDisplay: "F.H.",
    avatarBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    sessionCode: "SL-202609-0440",
    counselorName: "Budi Santoso, S.Psi.",
    counselorType: "Konselor Sebaya",
    rating: 4,
    quoteHighlight: "Biaya sangat ramah di kantong mahasiswa, kualitas konseling luar biasa.",
    comment: "Bagi mahasiswa tingkat akhir yang sedang tertekan tugas akhir, tarif Solulu sangat terjangkau. Mas Budi sabar sekali mendengar keluh kesah saya dan membantu menyusun rencana aksi mingguan.",
    topic: "Pengembangan Diri",
    submittedAt: "17 Sep 2026, 10:05 WIB",
    isActive: false,
    status: "pending",
    isFeatured: false,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 4,
  },
  {
    id: "t-6",
    clientName: "Meira Anggraini",
    isAnonymous: true,
    anonymousDisplay: "Klien Anonim",
    avatarBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    sessionCode: "SL-202609-0310",
    counselorName: "Dr. Dian Pratama, Sp.KJ",
    counselorType: "Psikolog Klinis",
    rating: 5,
    quoteHighlight: "Menemukan kembali semangat hidup setelah berbulan-bulan merasa hampa.",
    comment: "Terima kasih banyak Solulu. Langkah kecil memesan sesi di sini menjadi titik balik pemulihan emosi saya. Tidak ada penghakiman, hanya ruang aman dan dukungan terstruktur.",
    topic: "Depresi Ringan",
    submittedAt: "15 Sep 2026, 21:00 WIB",
    isActive: true,
    status: "approved",
    isFeatured: true,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 5,
  },
  {
    id: "t-7",
    clientName: "Bayu Wicaksono",
    isAnonymous: false,
    anonymousDisplay: "Bayu W.",
    avatarBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    sessionCode: "SL-202609-0445",
    counselorName: "Siti Rahmawati, M.Psi., Psikolog",
    counselorType: "Psikolog Klinis",
    rating: 4,
    quoteHighlight: "Koneksi video stabil dan konselor hadir tepat waktu.",
    comment: "Sesi berjalan sangat efektif 60 menit penuh. Ada sedikit kendala audio di 5 menit pertama dari sisi saya, tapi konselor sangat sabar menunggu. Solusi yang diberikan sangat aplikatif.",
    topic: "Karier & Burnout",
    submittedAt: "18 Sep 2026, 17:50 WIB",
    isActive: true,
    status: "pending",
    isFeatured: false,
    consentGiven: true,
    hasSensitiveDetails: false,
    platformRating: 4,
  },
  {
    id: "t-8",
    clientName: "Taufik Haryanto",
    isAnonymous: true,
    anonymousDisplay: "Klien Anonim",
    avatarBg: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
    sessionCode: "SL-202609-0199",
    counselorName: "Budi Santoso, S.Psi.",
    counselorType: "Konselor Sebaya",
    rating: 3,
    quoteHighlight: "Konselor ramah, namun waktu 60 menit terasa terlalu cepat.",
    comment: "Sesi sudah baik tapi menurut saya isu keluarga butuh waktu lebih dari 60 menit. Mohon pertimbangkan opsi perpanjangan waktu atau paket lanjutan dua sesi sekaligus.",
    topic: "Relasi & Keluarga",
    submittedAt: "12 Sep 2026, 15:10 WIB",
    isActive: false,
    status: "archived",
    isFeatured: false,
    consentGiven: false,
    hasSensitiveDetails: true,
    platformRating: 3,
  },
]

