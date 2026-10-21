"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logoutAction } from "@/app/(auth)/login/actions"
import {
  Clock,
  Radio,
  LogOut,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
} from "lucide-react"

export function OperatorHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter()
  const [currentTime, setCurrentTime] = React.useState<string>("")
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      // WIB = UTC+7
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const wib = new Date(utc + 3600000 * 7)
      const timeStr = wib.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      setCurrentTime(`${timeStr} WIB`)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 sm:px-4 backdrop-blur-md transition-all">
      {/* Left: Sidebar trigger, separator, breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger
          className="-ml-1"
          aria-label="Buka atau tutup menu navigasi operator"
        />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <AppBreadcrumbs portal="operator" className="truncate" />
      </div>

      {/* Right: Live Clock widget, Theme Toggle, User dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Clock Pill */}
        <div
          className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono font-medium text-foreground"
          title="Waktu Operasional Real-Time Solulu (WIB)"
        >
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold">{currentTime || "--:--:-- WIB"}</span>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
        </div>

        {/* Theme mode switcher */}
        <ThemeToggle variant="icon" />

        {/* Operator Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-full ring-1 ring-border/80 hover:ring-primary/40 focus-visible:ring-2 cursor-pointer"
              aria-label="Menu akun operator"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  OP
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Petugas Dispatcher Zoom
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {isAdmin ? "Akses Administrator Utama" : "Konsol Operasional Terisolasi"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <ArrowLeft className="size-4 mr-2" />
                  Portal Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <ExternalLink className="size-4 mr-2" />
                Halaman Depan Solulu
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-4 mr-2" />
              {isLoggingOut ? "Keluar..." : "Keluar Sesi"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
