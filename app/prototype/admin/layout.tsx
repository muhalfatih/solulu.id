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
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  LogOut,
  User,
  MessageSquareQuote,
  ShieldAlert,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | null
  badgeVariant?: "default" | "destructive" | "secondary" | "outline"
  description?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operasional Klinis",
    items: [
      {
        href: "/prototype/admin",
        label: "Ringkasan",
        icon: LayoutDashboard,
        badge: "2 Berjalan",
        badgeVariant: "secondary",
        description: "Ikhtisar jadwal dan tugas penting hari ini",
      },
      {
        href: "/prototype/admin/sessions",
        label: "Jadwal",
        icon: Calendar,
        badge: "8 Sesi",
        badgeVariant: "outline",
        description: "Daftar janji temu dan kalender konsultasi",
      },
    ],
  },
  {
    title: "Kemitraan & Tata Kelola",
    items: [
      {
        href: "/prototype/admin/counselors",
        label: "Konselor",
        icon: Users,
        badge: "2 Baru",
        badgeVariant: "destructive",
        description: "Verifikasi berkas dan daftar konselor aktif",
      },
      {
        href: "/prototype/admin/pricing",
        label: "Tarif",
        icon: Tag,
        description: "Biaya konsultasi dan kupon diskon promo",
      },
      {
        href: "/prototype/admin/gallery",
        label: "Galeri",
        icon: ImageIcon,
        description: "Foto kegiatan untuk tampilan website",
      },
      {
        href: "/prototype/admin/testimonials",
        label: "Testimoni",
        icon: MessageSquareQuote,
        badge: "3 Baru",
        badgeVariant: "secondary",
        description: "Kurasi ulasan klien dan testimoni website",
      },
    ],
  },
  {
    title: "Sistem & Integrasi",
    items: [
      {
        href: "/prototype/admin/zoom",
        label: "Akun Zoom",
        icon: Video,
        badge: "2/2 Siap",
        badgeVariant: "outline",
        description: "Integrasi akun Zoom dan kunci konkurensi",
      },
    ],
  },
]

const EXTRA_SEARCH_ITEMS: NavItem[] = [
  {
    href: "/prototype/admin/profile",
    label: "Profil Saya",
    icon: User,
    description: "Pengaturan akun operator dan kata sandi",
  },
]

const QUICK_ACTIONS = [
  {
    title: "Sesi SL-9281 (Anindya Putri, Psikolog Klinis)",
    category: "Sesi Aktif",
    href: "/prototype/admin/sessions",
    hint: "19:00 WIB",
  },
  {
    title: "Sesi SL-9282 (Dimas Arya, Konselor Sebaya)",
    category: "Jadwal Konseling",
    href: "/prototype/admin/sessions",
    hint: "19:30 WIB",
  },
  {
    title: "Profil Saya (Pengaturan Akun)",
    category: "Akun Operator",
    href: "/prototype/admin/profile",
    hint: "Akun",
  },
  {
    title: "Verifikasi Berkas Sarah Annisa & Budi Prasetyo",
    category: "Pendaftar Konselor",
    href: "/prototype/admin/counselors",
    hint: "2 Berkas",
  },
  {
    title: "Status Ruang Telekonseling 1 & 2",
    category: "Infrastruktur Zoom",
    href: "/prototype/admin/zoom",
    hint: "2/2 Siap",
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
  const [searchQuery, setSearchQuery] = React.useState("")

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      } else if (e.key === "Escape") {
        setCommandOpen(false)
        setMobileOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Find current active item across sections or dedicated account route
  let currentNav: NavItem | undefined
  let currentSectionTitle = "Operasional Klinis"

  if (pathname === "/prototype/admin/profile") {
    currentNav = {
      href: "/prototype/admin/profile",
      label: "Profil Saya",
      icon: User,
      description: "Pengaturan akun operator, kontak darurat, dan kata sandi",
    }
    currentSectionTitle = "Akun"
  } else {
    for (const sec of NAV_SECTIONS) {
      const match = sec.items.find((item) => item.href === pathname)
      if (match) {
        currentNav = match
        currentSectionTitle = sec.title
        break
      }
    }
  }

  // Filtered search results for command palette
  const allNavItems = [...NAV_SECTIONS.flatMap((sec) => sec.items), ...EXTRA_SEARCH_ITEMS]
  const filteredNav = allNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const filteredActions = QUICK_ACTIONS.filter((act) =>
    act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col md:flex-row font-sans overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* ========================================================================= */}
      {/* MOBILE BAR (< md) */}
      {/* ========================================================================= */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-xs">
            S
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Solulu
            </span>
            <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCommandOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Cari fitur"
          >
            <Search className="size-4" />
          </Button>

          <ThemeToggle className="scale-90" />

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="size-8"
            aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border z-50 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto">
          {/* Header Mobile Drawer */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  Solulu
                </span>
                <span className="text-xs text-muted-foreground">
                  Portal Admin Operasional
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setMobileOpen(false)}
              className="size-7"
              aria-label="Tutup navigasi"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Quick Search Button in Drawer */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false)
              setCommandOpen(true)
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Cari sesi atau konselor…</span>
            </div>
            <kbd className="text-xs font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Navigation Sections in Drawer */}
          <div className="flex flex-col gap-5">
            {NAV_SECTIONS.map((sec) => (
              <div key={sec.title} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2.5">
                  {sec.title}
                </span>
                <nav className="flex flex-col gap-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "outline"}
                            className="text-xs px-1.5 py-0 h-4 font-normal"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Drawer Footer: Operator Profile Link */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <Link
            href="/prototype/admin/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 p-1.5 -ml-1.5 rounded-lg hover:bg-muted/60 transition-colors group flex-1 min-w-0"
          >
            <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
              AP
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                Admin Pelayanan
              </span>
              <span className="text-xs text-muted-foreground font-mono truncate">
                admin@solulu.id
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Terhubung" />
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      <aside
        className={`h-screen border-r border-border bg-card flex flex-col justify-between shrink-0 transition-all duration-200 z-30 ${
          collapsed ? "w-18" : "w-64"
        } hidden md:flex`}
      >
        {/* Top: Brand & Nav Sections */}
        <div className="flex flex-col gap-6 p-4 overflow-y-auto">
          {/* Brand Row */}
          {collapsed ? (
            <div className="flex justify-center h-8">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="size-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-xs hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer group"
                title="Klik untuk perluas bilah navigasi"
                aria-label="Perluas bilah navigasi"
              >
                <span className="group-hover:hidden">S</span>
                <PanelLeft className="size-4 hidden group-hover:block" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between h-8 px-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="size-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shrink-0 shadow-xs">
                  S
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-sm tracking-tight text-foreground">
                    Solulu
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setCollapsed(true)}
                className="text-muted-foreground hover:text-foreground size-7 shrink-0"
                title="Perkecil bilah navigasi"
                aria-label="Perkecil bilah navigasi"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>
          )}

          {/* Nav Sections */}
          <div className="flex flex-col gap-6">
            {NAV_SECTIONS.map((sec) => (
              <div key={sec.title} className="flex flex-col gap-1.5">
                {!collapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2.5">
                    {sec.title}
                  </span>
                )}
                <nav className="flex flex-col gap-1" aria-label={sec.title}>
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                        className={`group relative flex items-center rounded-lg text-xs transition-all ${
                          collapsed ? "justify-center p-2" : "justify-between px-2.5 py-2"
                        } ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold dark:bg-primary/15 dark:text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        {/* Active left border accent */}
                        {isActive && !collapsed && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                        )}

                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`size-4 shrink-0 transition-colors ${
                            isActive ? "text-primary dark:text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                          }`} />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!collapsed && item.badge && (
                          <Badge
                            variant={item.badgeVariant || "outline"}
                            className="text-xs tabular-nums font-medium px-1.5 py-0 h-4 shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}

                        {/* Collapsed Active Dot */}
                        {collapsed && isActive && (
                          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Anchored at Bottom with Operator Dropdown */}
        <div className="p-3 border-t border-border bg-card/60 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`w-full flex items-center rounded-lg p-1.5 hover:bg-muted/60 transition-colors cursor-pointer text-left outline-none ${
                  collapsed ? "justify-center" : "justify-between"
                }`}
                aria-label="Menu akun operator"
              >
                {!collapsed ? (
                  <>
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                        AP
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-foreground truncate">
                          Admin Pelayanan
                        </span>
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          admin@solulu.id
                        </span>
                      </div>
                    </div>
                    <div
                      className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"
                      title="Sistem Terhubung (Aktif)"
                    />
                  </>
                ) : (
                  <div className="relative" title="Admin Pelayanan (Aktif)">
                    <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                      AP
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? "right" : "top"}
              align={collapsed ? "end" : "start"}
              className="w-56 text-xs p-1"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-foreground leading-none">
                    Admin Pelayanan
                  </p>
                  <p className="text-xs text-muted-foreground font-mono leading-none">
                    admin@solulu.id
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/prototype/admin/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="size-3.5 text-muted-foreground" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  window.location.href = "/unauthorized"
                }}
                className="cursor-pointer"
              >
                <LogOut className="size-3.5 mr-2" />
                <span>Keluar Sesi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT COLUMN */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar: Clean breadcrumb + search + quiet status + public web preview */}
        <header className="h-14 shrink-0 border-b border-border px-6 hidden md:flex items-center justify-between bg-card/75 backdrop-blur-md z-20">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            {collapsed && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setCollapsed(false)}
                className="size-7 mr-1 text-muted-foreground hover:text-foreground"
                title="Buka bilah navigasi"
              >
                <PanelLeft className="size-3.5" />
              </Button>
            )}
            <Link
              href="/prototype/admin"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Solulu Admin
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/40" />
            <span className="text-muted-foreground">{currentSectionTitle}</span>
            <ChevronRight className="size-3 text-muted-foreground/40" />
            <span className="font-semibold text-foreground">
              {currentNav?.label || "Ringkasan"}
            </span>
          </div>

          {/* Center: Universal Command Search Trigger */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs w-72 lg:w-80 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="truncate">Cari sesi, konselor, atau menu…</span>
            </div>
            <kbd className="text-xs font-mono bg-background border border-border/80 px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Right: Operational Status & Portal Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Zoom 2 Host Concurrency Guard Telemetry (Stable Horizon Rule) */}
            <Link
              href="/prototype/admin/zoom"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 border border-border/70 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
              title="Ketersediaan Ruang Zoom (2 Host Concurrency Guard): 2/2 Ruang Siap"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="tabular-nums">Zoom: 2/2 Siap</span>
            </Link>

            {/* National Crisis Hotline (Hotline 119 ext. 8 / Layanan Sejiwa) */}
            <a
              href="tel:119,8"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/70 bg-muted/30 text-muted-foreground hover:text-foreground text-xs font-medium hover:bg-muted/60 transition-colors"
              title="Protokol Krisis Pasien: Kontak Darurat Nasional Hotline 119 ext. 8 (Layanan Sejiwa)"
            >
              <ShieldAlert className="size-3 text-rose-600/80 dark:text-rose-400/80" aria-hidden="true" />
              <span>Hotline 119 ext. 8</span>
            </a>

            {/* Public Guest View Link */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Pratinjau antarmuka pasien tamu"
            >
              <span>Web Pasien</span>
              <ExternalLink className="size-3" />
            </Link>

            <div className="h-4 w-px bg-border" />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Subpage Scrollable Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* COMMAND PALETTE MODAL (Ctrl+K / Cmd+K) WITH REAL-TIME FILTERING */}
      {/* ========================================================================= */}
      {commandOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
          <div
            className="bg-card border border-border rounded-xl max-w-lg w-full p-3 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 px-2 py-1.5 border-b border-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik untuk mencari sesi, konselor, atau menu navigasi…"
                className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none py-1"
              />
              <kbd
                onClick={() => setCommandOpen(false)}
                className="text-xs font-mono bg-muted border border-border px-1.5 py-0.5 rounded cursor-pointer text-muted-foreground hover:text-foreground"
              >
                ESC
              </kbd>
            </div>

            {/* Search Results */}
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              {/* Navigation Items */}
              {filteredNav.length > 0 && (
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Halaman & Fitur
                  </span>
                  {filteredNav.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setCommandOpen(false)
                          setSearchQuery("")
                        }}
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted text-foreground transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <div className="flex flex-col">
                            <span className="font-medium">{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Quick Actions / Operational Items */}
              {filteredActions.length > 0 && (
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Aksi Cepat
                  </span>
                  {filteredActions.map((act, idx) => (
                    <Link
                      key={idx}
                      href={act.href}
                      onClick={() => {
                        setCommandOpen(false)
                        setSearchQuery("")
                      }}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted text-foreground transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {act.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {act.category}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        {act.hint}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty state when no matches */}
              {filteredNav.length === 0 && filteredActions.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Tidak ada hasil untuk &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>

            {/* Quick footer */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Gunakan tanda panah atau klik untuk memilih</span>
              <kbd className="font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded border border-border">ESC</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
