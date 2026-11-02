// PROTOTYPE — admin information architecture from the grilling session (Q6).
// Items marked `soon` have no page yet; they exist to judge the menu shape.
import type { LucideIcon } from "lucide-react"
import { Briefcase, Cog, LayoutDashboard, Newspaper, Users, Wallet } from "lucide-react"

export type ShellNavItem = {
  title: string
  url: string
  icon: LucideIcon
  superadminOnly?: boolean
  items?: { title: string; url: string; soon?: boolean; aliases?: string[] }[]
}

export const ADMIN_SHELL_NAV: ShellNavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    title: "Operasional",
    url: "/admin/bookings",
    icon: Briefcase,
    items: [
      { title: "Booking", url: "/admin/bookings" },
      { title: "Booking Cepat", url: "#booking-cepat", soon: true },
      { title: "Klien Tersedia", url: "#klien-tersedia", soon: true },
      { title: "Jadwal & Kalender", url: "/admin/sessions" },
      { title: "Verifikasi Transfer", url: "/admin/manual-payments" },
      { title: "Dispatch WhatsApp", url: "#dispatch-wa", soon: true },
    ],
  },
  {
    title: "Kemitraan",
    url: "/admin/counselors",
    icon: Users,
    items: [
      { title: "Direktori Konselor", url: "/admin/counselors" },
      { title: "Pendaftaran", url: "/admin/counselors/applications" },
      { title: "Spesialisasi", url: "/admin/specializations" },
    ],
  },
  {
    title: "Keuangan",
    url: "/admin/reports/finance",
    icon: Wallet,
    items: [
      { title: "Laporan Keuangan", url: "/admin/reports/finance" },
      { title: "Payroll", url: "#payroll", soon: true },
    ],
  },
  {
    title: "Konten",
    url: "/admin/testimonials",
    icon: Newspaper,
    items: [
      { title: "Testimoni", url: "/admin/testimonials" },
      { title: "Galeri", url: "/admin/gallery" },
    ],
  },
  {
    title: "Sistem",
    url: "/admin/settings",
    icon: Cog,
    superadminOnly: true,
    items: [
      { title: "Layanan & Tarif", url: "/admin/pricing", soon: false },
      { title: "Voucher", url: "#voucher", soon: true },
      { title: "Template WA", url: "#template-wa", soon: true },
      { title: "Pengaturan", url: "/admin/settings" },
      { title: "Akun Zoom", url: "/admin/zoom-settings", aliases: ["/admin/zoom"] },
      { title: "Jejak Audit", url: "#audit", soon: true },
    ],
  },
]
