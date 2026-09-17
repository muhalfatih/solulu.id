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
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeft,
  Command,
  ArrowUpRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const NAV_ITEMS = [
  {
    href: "/prototype/admin",
    label: "Ringkasan",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/prototype/admin/counselors",
    label: "Mitra Konselor",
    icon: Users,
    badge: "2",
  },
  {
    href: "/prototype/admin/sessions",
    label: "Jadwal & Sesi",
    icon: Calendar,
    badge: null,
  },
  {
    href: "/prototype/admin/zoom",
    label: "Ruang Zoom",
    icon: Video,
    badge: null,
  },
  {
    href: "/prototype/admin/pricing",
    label: "Tarif & Voucher",
    icon: Tag,
    badge: null,
  },
  {
    href: "/prototype/admin/gallery",
    label: "Galeri Publik",
    icon: ImageIcon,
    badge: null,
  },
]

export default function DistilledAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      } else if (e.key === "Escape") {
        setCommandOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const currentNav = NAV_ITEMS.find((n) => n.href === pathname)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">
            S
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Solulu Admin
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`border-r border-border bg-card p-4 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-50 transition-all duration-200 md:static md:translate-x-0 ${
          collapsed ? "w-18" : "w-60"
        } ${mobileOpen ? "translate-x-0 w-60 shadow-xl" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col gap-5">
          {/* Brand & Collapse Control */}
          <div className="flex items-center justify-between px-1 h-8">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shrink-0">
                S
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-sm tracking-tight text-foreground">
                    Solulu
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Admin
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-muted-foreground hover:text-foreground size-7"
              aria-label={collapsed ? "Perluas bilah samping" : "Perkecil bilah samping"}
            >
              {collapsed ? <PanelLeft className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
            </Button>
          </div>

          {/* Quick Search Shortcut */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={`w-full flex items-center rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs py-2 transition-colors cursor-pointer ${
              collapsed ? "justify-center px-2" : "justify-between px-2.5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              {!collapsed && <span className="text-xs">Cari...</span>}
            </div>
            {!collapsed && (
              <kbd className="text-[10px] font-mono bg-background border border-border px-1 py-0.5 rounded text-muted-foreground">
                ⌘K
              </kbd>
            )}
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 text-xs" aria-label="Menu navigasi utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg py-2 font-medium transition-colors ${
                    collapsed ? "justify-center px-2" : "justify-between px-2.5"
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted text-foreground border border-border"
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

        {/* Sidebar Footer: Clean, operator-oriented */}
        <div className="pt-3 border-t border-border flex flex-col gap-3 text-xs">
          {!collapsed ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-foreground truncate">
                  Admin Operasional
                </span>
                <span className="text-[11px] text-muted-foreground font-mono truncate">
                  admin@solulu.id
                </span>
              </div>
              <div className="size-2 rounded-full bg-emerald-500 shrink-0" title="Terhubung" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="size-2 rounded-full bg-emerald-500" title="Terhubung" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar: Clean breadcrumb + operational telemetry + theme control */}
        <header className="h-14 border-b border-border px-6 hidden md:flex items-center justify-between bg-card/60 sticky top-0 z-30 backdrop-blur-md">
          {/* Breadcrumb Section */}
          <div className="flex items-center gap-2 text-xs">
            <Link href="/prototype/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              Portal Admin
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold text-foreground">
              {currentNav?.label || "Ringkasan"}
            </span>
          </div>

          {/* Telemetry & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>2 Ruang Zoom Siap</span>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={() => setCommandOpen(true)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Command className="size-3" />
              <span>Cari</span>
              <kbd className="text-[10px] font-mono text-muted-foreground">⌘K</kbd>
            </Button>

            <ThemeToggle />
          </div>
        </header>

        {/* Subpage Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Command Palette Modal (Ctrl+K / Cmd+K) */}
      {commandOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-3 flex flex-col gap-2 shadow-xl">
            <div className="flex items-center gap-2 px-2 py-1 border-b border-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Lompat ke halaman atau cari fitur..."
                className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none py-1"
              />
              <kbd
                onClick={() => setCommandOpen(false)}
                className="text-[10px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded cursor-pointer text-muted-foreground hover:text-foreground"
              >
                ESC
              </kbd>
            </div>

            <div className="flex flex-col gap-0.5 pt-1 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1">
                Navigasi Cepat
              </span>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowUpRight className="size-3 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

