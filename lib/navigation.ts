/**
 * Breadcrumb derivation. Menu structure lives in lib/shell/nav.ts.
 */

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
  honor: "Honor Saya",
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
