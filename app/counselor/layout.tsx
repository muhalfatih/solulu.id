"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  User,
  ExternalLink,
  LogOut,
  Loader2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/app/(auth)/login/actions"
import {
  getCounselorProfileAction,
  getCounselorsListForSwitchAction,
  switchDemoCounselorAction,
} from "@/app/counselor/actions"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

const CORE_NAV_ITEMS: NavItem[] = [
  {
    href: "/counselor/dashboard",
    label: "Sesi Konseling",
    shortLabel: "Sesi",
    icon: Clock,
  },
  {
    href: "/counselor/schedules",
    label: "Jadwal Praktik",
    shortLabel: "Jadwal",
    icon: Calendar,
  },
]

export default function CounselorPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [counselor, setCounselor] = React.useState<{
    fullName: string
    title?: string | null
    counselorType?: "peer" | "psychologist"
  } | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)

  const [allCounselors, setAllCounselors] = React.useState<any[]>([])

  React.useEffect(() => {
    let isMounted = true
    getCounselorProfileAction()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setCounselor({
              fullName: res.data.fullName,
              title: res.data.title,
              counselorType: res.data.counselorType,
            })
          }
          setIsLoadingProfile(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingProfile(false)
      })

    getCounselorsListForSwitchAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setAllCounselors(res.data)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSwitchCounselor = async (targetId: string) => {
    await switchDemoCounselorAction(targetId)
    router.refresh()
    window.location.reload()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const counselorName = counselor?.fullName || (isLoadingProfile ? "Memuat..." : "Mitra Konselor")
  const counselorRole =
    counselor?.counselorType === "psychologist" ? "Psikolog" : "Konselor Sebaya"
  const initialLetter = counselor?.fullName ? counselor.fullName.charAt(0).toUpperCase() : "K"

  return (
    <div className="theme-admin min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring text-xs font-medium transition-transform"
      >
        Lewati ke konten utama
      </a>

      {/* Pristine Single-Tier Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <Link
              href="/counselor/dashboard"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Kembali ke Dashboard Konselor"
            >
              <div
                className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs sm:text-sm shadow-xs shrink-0"
                aria-hidden="true"
              >
                S
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight leading-tight text-foreground">
                  Solulu
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
                  Konselor
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Navigasi kerja klinis desktop"
              className="hidden sm:flex items-center gap-1 pl-4 border-l border-border/60"
            >
              {CORE_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Mobile Segmented Work Tabs (Single-Tier, Integrated) */}
          <nav
            aria-label="Navigasi kerja klinis mobile"
            className="sm:hidden flex items-center p-0.5 bg-muted/60 rounded-lg border border-border/60 shrink-0"
          >
            {CORE_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{item.shortLabel}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Action Controls: Theme + Consolidated User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle variant="icon" />

            {/* Consolidated Counselor User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-1.5 sm:px-2 gap-1.5 sm:gap-2 rounded-full border border-border/70 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  aria-label={`Menu akun ${counselorName}`}
                >
                  <div className="relative size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {initialLetter}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs font-medium max-w-[110px] truncate hidden md:inline text-foreground">
                    {counselorName}
                  </span>
                  <ChevronDown
                    className="size-3 text-muted-foreground hidden sm:inline shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {counselorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {counselorRole}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/counselor/profile"
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <User className="size-3.5" aria-hidden="true" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/counselors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span>Lihat Tampilan Publik</span>
                  </Link>
                </DropdownMenuItem>
                {allCounselors.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Ganti Konselor (Simulasi)
                    </div>
                    {allCounselors.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => handleSwitchCounselor(c.id)}
                        className="flex items-center justify-between gap-2 cursor-pointer text-xs"
                      >
                        <span className="truncate">{c.fullName}</span>
                        {counselor?.fullName === c.fullName && (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={loggingOut}
                  variant="destructive"
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  {loggingOut ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="size-3.5" aria-hidden="true" />
                  )}
                  <span>{loggingOut ? "Keluar…" : "Keluar"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 outline-none"
      >
        {children}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Solulu Telekonseling © 2026 — Sesi Standar 90 Menit</span>
          <span className="text-xs text-muted-foreground/80">
            Kerahasiaan data rekam konseling dijamin sesuai standar HIMPSI & RLS Supabase
          </span>
        </div>
      </footer>
    </div>
  )
}


