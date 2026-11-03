/**
 * Panel "Perlu Tindakan" di Dashboard Admin (murni). Hitungan datang dari
 * `getAttentionCounts` (+ laporan lewat 24 jam); `null` berarti query gagal
 * sehingga ditampilkan "tidak tersedia", bukan angka karangan.
 */
export type AttentionKey = "pool" | "reports" | "transfer" | "credentials" | "applications"

export type DashboardAttentionCounts = Record<AttentionKey, number | null>

export interface AttentionItem {
  key: AttentionKey
  label: string
  hint: string
  href: string
  /** null = tidak dapat dimuat. */
  count: number | null
}

const DEFS: { key: AttentionKey; label: string; hint: string; href: string }[] = [
  {
    key: "pool",
    label: "Klien belum diklaim",
    hint: "Booking pool mendekati Cutoff H-4",
    href: "/admin/klien-tersedia",
  },
  {
    key: "reports",
    label: "Laporan lewat 24 jam",
    hint: "Honor tertahan (Payroll Hold)",
    href: "/admin/bookings",
  },
  {
    key: "transfer",
    label: "Transfer menunggu",
    hint: "Booking dan perpanjangan",
    href: "/admin/manual-payments",
  },
  {
    key: "credentials",
    label: "STR/SIPP < 60 hari",
    hint: "Perlu perpanjangan izin",
    href: "/admin/counselors",
  },
  {
    key: "applications",
    label: "Pendaftaran tertunda",
    hint: "Menunggu verifikasi berkas",
    href: "/admin/counselors/applications",
  },
]

export function buildAttentionItems(counts: Partial<Record<AttentionKey, number | null>>): AttentionItem[] {
  return DEFS.map((def) => ({ ...def, count: counts[def.key] ?? null }))
}

/** Jumlah item yang menunggu tindakan (hitungan tidak tersedia tidak ikut dihitung). */
export function urgentCount(items: readonly AttentionItem[]): number {
  return items.filter((i) => (i.count ?? 0) > 0).length
}
