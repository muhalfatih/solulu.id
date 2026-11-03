/**
 * Navigation data for the single portal shell (ADR-0012, sidebar-08 inset).
 * Pure module: no I/O, safe to import from server and client components.
 *
 * An item with `ready: false` has no page yet; it stays here so the IA is
 * documented, and is hidden until the owning ticket flips the flag.
 */
import type { LucideIcon } from "lucide-react"
import {
  BadgeDollarSign,
  CalendarCheck,
  CalendarClock,
  Clock,
  FileSpreadsheet,
  ImageIcon,
  LayoutDashboard,
  MessageSquareQuote,
  MonitorPlay,
  ReceiptText,
  Send,
  Sparkles,
  Tag,
  UserCheck,
  UserPlus,
  UserRoundSearch,
  Users,
  Video,
  Wallet,
  Zap,
  History,
  MessageSquareText,
  ShieldCheck,
  Sliders,
} from "lucide-react"
import type { StaffRole } from "@/lib/auth/staff-role"

export type PortalKey = "admin" | "operator" | "counselor"

export interface ShellNavItem {
  title: string
  url: string
  icon: LucideIcon
  aliases?: string[]
  /** false = page not built yet (hidden). Default true. */
  ready?: boolean
  /** Ticket that will build the page, for documentation. */
  ticket?: number
  roles?: readonly StaffRole[]
}

export interface ShellNavGroup {
  title: string
  items: ShellNavItem[]
  roles?: readonly StaffRole[]
}

const SUPERADMIN: readonly StaffRole[] = ["superadmin"]
const ADMINS: readonly StaffRole[] = ["admin", "superadmin"]

export const SHELL_NAV: Record<PortalKey, ShellNavGroup[]> = {
  admin: [
    {
      title: "Ringkasan",
      items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
    },
    {
      title: "Operasional",
      items: [
        { title: "Booking", url: "/admin/bookings", icon: CalendarCheck },
        { title: "Booking Cepat", url: "/admin/booking-cepat", icon: Zap, ready: false, ticket: 30 },
        { title: "Klien Tersedia", url: "/admin/klien-tersedia", icon: UserRoundSearch, ready: false, ticket: 29 },
        { title: "Jadwal & Kalender", url: "/admin/sessions", icon: CalendarClock },
        { title: "Verifikasi Transfer", url: "/admin/manual-payments", icon: ReceiptText },
        { title: "Dispatch WhatsApp", url: "/admin/dispatch-wa", icon: Send, ready: false, ticket: 31 },
      ],
    },
    {
      title: "Kemitraan",
      items: [
        { title: "Direktori Konselor", url: "/admin/counselors", icon: Users },
        { title: "Pendaftaran", url: "/admin/counselors/applications", icon: UserPlus },
        { title: "Spesialisasi", url: "/admin/specializations", icon: Sparkles },
      ],
    },
    {
      title: "Keuangan",
      items: [
        { title: "Laporan Keuangan", url: "/admin/reports/finance", icon: FileSpreadsheet },
        { title: "Payroll", url: "/admin/payroll", icon: Wallet, ready: false, ticket: 27 },
      ],
    },
    {
      title: "Konten",
      items: [
        { title: "Testimoni", url: "/admin/testimonials", icon: MessageSquareQuote },
        { title: "Galeri", url: "/admin/gallery", icon: ImageIcon },
      ],
    },
    {
      title: "Sistem",
      roles: SUPERADMIN,
      items: [
        { title: "Layanan & Tarif", url: "/admin/layanan", icon: BadgeDollarSign, ready: false, ticket: 25 },
        { title: "Voucher", url: "/admin/vouchers", icon: Tag, ready: false },
        { title: "Template WA", url: "/admin/template-wa", icon: MessageSquareText, ready: false, ticket: 31 },
        { title: "Pengaturan", url: "/admin/settings", icon: Sliders },
        { title: "Akun Zoom", url: "/admin/zoom-settings", icon: Video, aliases: ["/admin/zoom"] },
        { title: "Jejak Audit", url: "/admin/audit", icon: History, roles: SUPERADMIN },
      ],
    },
  ],
  operator: [
    {
      title: "Operasional",
      items: [
        { title: "Konsol Operator", url: "/operator", icon: MonitorPlay },
        { title: "Portal Admin", url: "/admin", icon: ShieldCheck, roles: ADMINS },
      ],
    },
  ],
  counselor: [
    {
      title: "Praktik",
      items: [
        { title: "Sesi Hari Ini", url: "/counselor/dashboard", icon: Clock },
        { title: "Jadwal Praktik", url: "/counselor/schedule", icon: CalendarClock },
      ],
    },
    {
      title: "Akun",
      items: [
        { title: "Honor Saya", url: "/counselor/honor", icon: Wallet },
        { title: "Profil & Berkas", url: "/counselor/profile", icon: UserCheck },
      ],
    },
  ],
}

const roleAllowed = (roles: readonly StaffRole[] | undefined, role: StaffRole | null) =>
  !roles || (role !== null && roles.includes(role))

/**
 * The groups a role may see, with unbuilt pages and empty groups removed.
 * A null role (no valid staff session) sees nothing.
 */
export function getVisibleNav(portal: PortalKey, role: StaffRole | null): ShellNavGroup[] {
  if (role === null) return []
  return SHELL_NAV[portal]
    .filter((g) => roleAllowed(g.roles, role))
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.ready !== false && roleAllowed(i.roles, role)),
    }))
    .filter((g) => g.items.length > 0)
}

/**
 * The url of the item that owns `pathname`: longest matching url/alias wins,
 * and "/admin" style roots match only exactly. Null when nothing matches.
 */
export function getActiveHref(pathname: string, items: readonly ShellNavItem[]): string | null {
  const roots = new Set(["/admin", "/operator", "/counselor"])
  let best: { url: string; len: number } | null = null
  for (const item of items) {
    for (const candidate of [item.url, ...(item.aliases ?? [])]) {
      const hit =
        pathname === candidate || (!roots.has(candidate) && pathname.startsWith(`${candidate}/`))
      if (hit && (!best || candidate.length > best.len)) {
        best = { url: item.url, len: candidate.length }
      }
    }
  }
  return best?.url ?? null
}

export interface AttentionShortcut {
  key: string
  label: string
  count: number
  href: string
}

export type AttentionCounts = Partial<Record<string, number | null>>

const ATTENTION_DEFS: Record<PortalKey, { key: string; label: string; href: string }[]> = {
  admin: [
    { key: "transfer", label: "Transfer menunggu", href: "/admin/manual-payments" },
    { key: "applications", label: "Pendaftaran baru", href: "/admin/counselors/applications" },
    { key: "credentials", label: "STR/SIPP < 60 hari", href: "/admin/counselors" },
  ],
  operator: [],
  counselor: [],
}

/** Perlu Tindakan shortcuts: only entries with a real count above zero. */
export function buildAttentionShortcuts(
  portal: PortalKey,
  counts: AttentionCounts
): AttentionShortcut[] {
  return ATTENTION_DEFS[portal].flatMap((def) => {
    const count = counts[def.key]
    return typeof count === "number" && count > 0 ? [{ ...def, count }] : []
  })
}
