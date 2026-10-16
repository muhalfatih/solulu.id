import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  CalendarCheck,
  ReceiptText,
  FileSpreadsheet,
  Users,
  Sparkles,
  Video,
  Sliders,
  Tag,
  MessageSquareQuote,
  ImageIcon,
  Clock,
  Calendar,
  UserCheck,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | null
  badgeVariant?: "default" | "destructive" | "secondary" | "outline"
  description?: string
  aliases?: string[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Operasional & Sesi",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Ikhtisar jadwal, metrik klinis, dan tugas penting hari ini",
        aliases: ["/admin/dashboard"],
      },
      {
        href: "/admin/bookings",
        label: "Pengawasan Booking",
        icon: CalendarCheck,
        description: "Manajemen operasional pemesanan, No-Show 30m, dan kirim WA laporan",
      },
      {
        href: "/admin/sessions",
        label: "Jadwal & Kalender",
        icon: Calendar,
        description: "Matriks jadwal konselor, kalender mingguan, dan alokasi ruang Zoom",
      },
      {
        href: "/admin/manual-payments",
        label: "Verifikasi Transfer Manual",
        icon: ReceiptText,
        description: "Antrean verifikasi transfer bank klien (booking awal & extend)",
      },
      {
        href: "/admin/reports/finance",
        label: "Laporan Keuangan & Sesi",
        icon: FileSpreadsheet,
        description: "Rekapitulasi sesi selesai, audit ledger, dan ekspor CSV komisi",
      },
    ],
  },
  {
    title: "Kemitraan Konselor",
    items: [
      {
        href: "/admin/counselors",
        label: "Direktori Konselor",
        icon: Users,
        description: "Verifikasi berkas legalitas, radar STR/SIPP, dan konselor aktif",
      },
      {
        href: "/admin/specializations",
        label: "Fokus & Spesialisasi",
        icon: Sparkles,
        description: "Bank topik dan klasifikasi keahlian konseling mitra",
      },
    ],
  },
  {
    title: "Sistem & Integrasi",
    items: [
      {
        href: "/admin/zoom-settings",
        label: "Akun Zoom Pro",
        icon: Video,
        description: "Infrastruktur 4 Akun Zoom, Host Key, dan mode Breakout",
        aliases: ["/admin/zoom"],
      },
      {
        href: "/admin/settings",
        label: "Pengaturan Sistem",
        icon: Sliders,
        description: "Parameter cutoff H-4 jam, kuota 10 slot, dan tarif perpanjangan",
      },
      {
        href: "/admin/pricing",
        label: "Tarif & Promo",
        icon: Tag,
        description: "Konfigurasi tarif dasar konsultasi dan kupon diskon",
      },
      {
        href: "/admin/testimonials",
        label: "Kurasi Testimoni",
        icon: MessageSquareQuote,
        description: "Manajemen ulasan klien terverifikasi untuk website",
      },
      {
        href: "/admin/gallery",
        label: "Galeri Kegiatan",
        icon: ImageIcon,
        description: "Foto kegiatan klinis dan dokumentasi publik",
      },
    ],
  },
]

export const COUNSELOR_NAV_ITEMS: NavItem[] = [
  {
    href: "/counselor/dashboard",
    label: "Sesi Hari Ini",
    icon: Clock,
    description: "Jadwal konseling aktif hari ini, Host Key, dan Floating Timer",
  },
  {
    href: "/counselor/schedule",
    label: "Komitmen Jadwal Praktik",
    icon: Calendar,
    description: "Manajemen komitmen minimal 10 sesi/minggu & pengajuan cuti",
    aliases: ["/counselor/schedules"],
  },
  {
    href: "/counselor/profile",
    label: "Profil & Berkas Legalitas",
    icon: UserCheck,
    description: "Kelengkapan 21 data profil, STR/SIPP, dan dokumen Cloudflare R2",
  },
]

const ROUTE_SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  counselor: "Konselor",
  dashboard: "Sesi Hari Ini",
  counselors: "Direktori Konselor",
  sessions: "Jadwal & Pemesanan",
  bookings: "Jadwal & Pemesanan",
  "manual-payments": "Verifikasi Transfer Manual",
  reports: "Laporan",
  finance: "Laporan Keuangan & Sesi",
  settings: "Pengaturan Sistem",
  "zoom-settings": "Akun Zoom Pro",
  zoom: "Akun Zoom Pro",
  pricing: "Tarif & Promo",
  specializations: "Fokus & Spesialisasi",
  gallery: "Galeri Kegiatan",
  testimonials: "Kurasi Testimoni",
  profile: "Profil Saya",
  schedules: "Jadwal Praktik Mingguan",
  schedule: "Jadwal Praktik Mingguan",
  applications: "Aplikasi Calon Konselor",
  krisis: "Protokol Krisis",
  operator: "Konsol Operator",
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface BreadcrumbItemData {
  label: string
  href: string
  isCurrentPage: boolean
}

/**
 * Derives a human-readable, accessible breadcrumb hierarchy from the current route pathname.
 */
export function getBreadcrumbTrail(
  pathname: string,
  portal: "admin" | "counselor" | "operator"
): BreadcrumbItemData[] {
  // Normalize pathname: remove trailing slash, query params, etc.
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "")

  if (!cleanPath || cleanPath === `/${portal}`) {
    const rootLabel =
      portal === "admin"
        ? "Admin"
        : portal === "counselor"
          ? "Konselor"
          : "Konsol Operator"
    return [
      {
        label: rootLabel,
        href: `/${portal}`,
        isCurrentPage: true,
      },
    ]
  }

  const segments = cleanPath.split("/").filter(Boolean)
  const trail: BreadcrumbItemData[] = []
  let accumulatedPath = ""

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulatedPath += `/${seg}`
    const isCurrentPage = i === segments.length - 1

    let label: string
    if (UUID_REGEX.test(seg) || !isNaN(Number(seg))) {
      label = "Detail"
    } else {
      label = ROUTE_SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    }

    // Special root redirection for counselor: root links to /counselor/dashboard
    let targetHref = accumulatedPath
    if (portal === "counselor" && accumulatedPath === "/counselor") {
      targetHref = "/counselor/dashboard"
    }

    trail.push({
      label,
      href: targetHref,
      isCurrentPage,
    })
  }

  return trail
}
