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
  Search,
  PanelLeftClose,
  PanelLeft,
  Command,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    badge: "H-12",
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

export default function FreshAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)

  // Ctrl+K keyboard shortcut listener
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-xs">
            S
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              Solulu Admin
            </span>
            <Badge variant="outline" className="ml-1.5 text-[10px] py-0 px-1.5">
              Fresh Prototype
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`border-r border-border bg-card/60 backdrop-blur-xl p-4 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-50 transition-all duration-300 md:static md:translate-x-0 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Collapse Button */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-extrabold text-primary-foreground text-base shadow-xs shrink-0">
                S
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    <span>Solulu Ops</span>
                    <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                      v1.0
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Clinical Admin Portal
                  </p>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
              title={collapsed ? "Perlebar Sidebar" : "Perkecil Sidebar"}
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>

          {/* Quick Search Shortcut Trigger */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={`w-full flex items-center rounded-xl border border-input bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2 text-xs transition-colors cursor-pointer ${
              collapsed ? "justify-center px-2" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              {!collapsed && <span>Cari sesi, pasien...</span>}
            </div>
            {!collapsed && (
              <kbd className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground shadow-2xs">
                Ctrl K
              </kbd>
            )}
          </button>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 text-xs" aria-label="Menu navigasi admin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl py-2.5 font-medium transition-all ${
                    collapsed ? "justify-center px-2" : "justify-between px-3.5"
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className="text-[10px] py-0 px-1.5 font-bold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-border flex flex-col gap-3 text-xs">
          {!collapsed && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Tema Visual
              </span>
              <ThemeToggle />
            </div>
          )}

          {!collapsed && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Zero-Cost Engine</span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                2 Zoom Pro • QStash 5m • Dual-Bucket R2
              </p>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border px-6 hidden md:flex items-center justify-between bg-card/40 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm text-foreground tracking-tight">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label || "Admin Portal"}
            </h2>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-xs text-muted-foreground">
              Radix-Vega Preset & Pure Semantic Tokens
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="text-xs text-muted-foreground flex items-center gap-2 h-8"
            >
              <Command className="size-3.5" />
              <span>Perintah Cepat</span>
              <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-xs">2 Zoom Pro Standby</span>
            </Badge>

            <ThemeToggle />
          </div>
        </header>

        {/* Subpage Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Quick Command Bar Dialog (Ctrl+K) */}
      {commandOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-4 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center gap-2 px-2 border-b border-border pb-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik nama pasien, kode sesi, atau fitur..."
                className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
              />
              <kbd
                onClick={() => setCommandOpen(false)}
                className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer text-muted-foreground"
              >
                ESC
              </kbd>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground px-2">
                Pintasan Navigasi
              </span>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">Buka →</span>
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
