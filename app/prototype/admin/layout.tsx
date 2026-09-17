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
  LogOut,
  Sparkles,
  ShieldCheck,
  Bell,
  Menu,
  X,
} from "lucide-react"

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-neutral-950 text-xs shadow-sm">
            S
          </div>
          <span className="font-semibold text-sm text-white">Solulu Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 border-r border-neutral-800/80 bg-neutral-900/70 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Brand & Badge */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-neutral-950 text-sm shadow-md shadow-emerald-950/40">
                S
              </div>
              <div>
                <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Solulu Admin
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Preview
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono">Role: Operator</p>
              </div>
            </div>
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden text-neutral-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badge === "Lock"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
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

        {/* Bottom Sidebar Info */}
        <div className="pt-4 border-t border-neutral-800/80 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Guardrails Aktif</span>
            </div>
            <p className="text-[10px] leading-relaxed text-neutral-400">
              Maks 2 Zoom overlap • QStash 5m cron • Presigned R2
            </p>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
            <span>Solulu Platform v1.0</span>
            <span className="text-emerald-400 font-mono text-[10px]">PROTOTYPE</span>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-neutral-800/80 px-6 flex items-center justify-between bg-neutral-900/40 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm text-white tracking-tight">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label || "Admin Portal"}
            </h2>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Mode Preview Semua Halaman Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-700/40 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium hidden sm:inline">2 Zoom Pro Tersambung</span>
              <span className="font-medium sm:hidden">2 Zoom OK</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-600 flex items-center justify-center text-xs font-semibold text-white shadow-inner">
              AD
            </div>
          </div>
        </header>

        {/* Subpage Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
