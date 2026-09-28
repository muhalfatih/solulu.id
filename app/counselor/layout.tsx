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
  Sparkles,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logoutAction } from "@/app/(auth)/login/actions"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/counselor/schedules",
    label: "Jadwal Praktik",
    icon: Calendar,
  },
  {
    href: "/counselor/dashboard",
    label: "Sesi Konseling",
    icon: Clock,
  },
  {
    href: "/counselor/profile",
    label: "Profil Saya",
    icon: User,
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

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-6">
            <Link
              href="/counselor/schedules"
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight">
                  Solulu
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Portal Mitra Konselor
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-border/60">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* View Catalog Shortcut */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex text-xs h-8 gap-1.5"
            >
              <Link href="/counselors" target="_blank" rel="noopener noreferrer">
                <span>Katalog Pasien</span>
                <ExternalLink className="size-3" />
              </Link>
            </Button>

            {/* Active Counselor Indicator Pill */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Sarah Annisa, M.Psi.</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 border-emerald-500/30">
                Psikolog
              </Badge>
            </div>

            <ThemeToggle />

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs h-8 text-muted-foreground hover:text-destructive gap-1.5 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-border/40 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Solulu Telekonseling © 2026 — Sesi Standar 90 Menit</span>
          <span className="text-[11px] text-muted-foreground/80">
            Kerahasiaan data rekam konseling dijamin sesuai standar HIMPSI & RLS Supabase
          </span>
        </div>
      </footer>
    </div>
  )
}
