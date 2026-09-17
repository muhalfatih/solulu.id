"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  Tag,
  ImageIcon,
  ShieldCheck,
  Menu,
  X,
  Lock,
  ExternalLink,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV_ITEMS = [
  {
    href: "/prototype/admin",
    label: "Dashboard Utama",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/prototype/admin/counselors",
    label: "Verifikasi & Mitra",
    icon: Users,
    badge: "2",
  },
  {
    href: "/prototype/admin/sessions",
    label: "Sesi & Reschedule",
    icon: Calendar,
    badge: null,
  },
  {
    href: "/prototype/admin/zoom",
    label: "Zoom & Safety Lock",
    icon: Video,
    badge: "Lock",
  },
  {
    href: "/prototype/admin/pricing",
    label: "Tarif & Voucher",
    icon: Tag,
    badge: null,
  },
  {
    href: "/prototype/admin/gallery",
    label: "Moderasi Galeri",
    icon: ImageIcon,
    badge: null,
  },
]

export default function AdminPrototypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            S
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              Solulu Admin
            </span>
            <span className="ml-1.5 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Preview
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 border-r border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0 shadow-sm md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Platform Info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-extrabold text-white text-base shadow-sm shadow-emerald-500/20">
                S
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>Solulu Ops</span>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    Preview
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Role: Operator Konsultasi
                </p>
              </div>
            </div>
            {mobileOpen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="md:hidden text-neutral-400 p-1"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 text-xs" aria-label="Menu navigasi admin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badge === "Lock"
                          ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-3 text-xs">
          {/* Theme Switcher in sidebar */}
          <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              Tema Visual
            </span>
            <ThemeToggle />
          </div>

          <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Guardrails Aktif</span>
            </div>
            <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Maks 2 sesi Zoom overlap • QStash 5m cron • Presigned R2
            </p>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>Solulu Platform v1.0</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
              PROTOTYPE
            </span>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Desktop Header Bar */}
        <header className="h-16 border-b border-neutral-200/90 dark:border-neutral-800/90 px-6 hidden md:flex items-center justify-between bg-white/80 dark:bg-neutral-900/60 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white tracking-tight">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label || "Admin Portal"}
            </h2>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Mode Preview Semua Halaman Admin (Light & Dark Mode Support)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="font-semibold">2 Zoom Pro Tersambung</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-200">
              AD
            </div>
          </div>
        </header>

        {/* Subpage Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
