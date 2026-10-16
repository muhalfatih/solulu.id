"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logoutAction } from "@/app/(auth)/login/actions"
import type { CounselorProfileSummary } from "./counselor-app-sidebar"
import { LogOut, UserCheck, ExternalLink } from "lucide-react"

interface CounselorHeaderProps {
  counselor: CounselorProfileSummary | null
  isLoading?: boolean
}

export function CounselorHeader({
  counselor,
  isLoading = false,
}: CounselorHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const counselorName = counselor?.fullName || (isLoading ? "Memuat..." : "Mitra Konselor")
  const counselorRole =
    counselor?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
  const initial = counselor?.fullName ? counselor.fullName.charAt(0).toUpperCase() : "K"

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 sm:px-4 backdrop-blur-md transition-all">
      {/* Left: Sidebar trigger, vertical separator, breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger
          className="-ml-1"
          aria-label="Buka atau tutup menu navigasi kerja"
        />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <AppBreadcrumbs portal="counselor" className="truncate" />
      </div>

      {/* Right: Theme Toggle, Counselor Avatar & Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle variant="icon" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-full ring-1 ring-border/80 hover:ring-primary/40 focus-visible:ring-2"
              aria-label="Menu akun konselor"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground truncate">
                  {counselorName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {counselorRole}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/counselor/profile" className="cursor-pointer">
                <UserCheck className="size-4 mr-2" />
                Profil & STR/SIPP
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
