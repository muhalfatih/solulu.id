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
import { getZoomTelemetryAction } from "@/app/admin/zoom-settings/actions"
import {
  LogOut,
  User,
  ExternalLink,
  ShieldCheck,
  Video,
} from "lucide-react"

export function AdminHeader() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [zoomStatus, setZoomStatus] = React.useState<{
    activeCount: number
    statusText: string
  }>({
    activeCount: 1,
    statusText: "1/2 Siap",
  })

  React.useEffect(() => {
    let isMounted = true
    getZoomTelemetryAction()
      .then((res) => {
        if (isMounted && res.success) {
          setZoomStatus({
            activeCount: res.activeCount,
            statusText: res.statusText,
          })
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 sm:px-4 backdrop-blur-md transition-all">
      {/* Left: Sidebar trigger, separator, breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger
          className="-ml-1"
          aria-label="Buka atau tutup menu navigasi"
        />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <AppBreadcrumbs portal="admin" className="truncate" />
      </div>

      {/* Right: Zoom telemetry status, Theme Toggle, User dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Zoom quick indicator */}
        <Link
          href="/admin/zoom-settings"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-colors"
          title="Status Akun Zoom Pro Klinik"
        >
          <Video className="size-3.5 text-primary" />
          <span className="font-medium text-foreground text-[11px]">
            {zoomStatus.statusText}
          </span>
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </Link>

        {/* Theme mode switcher */}
        <ThemeToggle variant="icon" />

        {/* Compact Admin Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-full ring-1 ring-border/80 hover:ring-primary/40 focus-visible:ring-2"
              aria-label="Menu akun administrator"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Admin Pelayanan
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@solulu.id
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" className="cursor-pointer">
                <User className="size-4 mr-2" />
                Profil Operator
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <ShieldCheck className="size-4 mr-2" />
                Pengaturan Sistem
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <ExternalLink className="size-4 mr-2" />
                Pratinjau Situs Publik
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
