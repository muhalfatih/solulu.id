"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logoutAction } from "@/app/(auth)/login/actions"
import {
  Radio,
  Clock,
  Video,
  CalendarCheck,
  LayoutDashboard,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react"

interface OperatorAppSidebarProps {
  isAdmin?: boolean
}

export function OperatorAppSidebar({ isAdmin = false }: OperatorAppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const isItemActive = (href: string) => {
    if (pathname === href) return true
    if (href !== "/operator" && pathname.startsWith(href + "/")) {
      return true
    }
    return false
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
      {/* Brand & Workspace Identity */}
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/operator" onClick={handleLinkClick}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0 font-bold text-sm">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    Solulu
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-muted-foreground">
                      Konsol Operator
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-3.5 px-1 font-mono tracking-tight border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    >
                      Live
                    </Badge>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase px-2">
            Operasional & Kontrol
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Matriks Slot */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive("/operator")}
                  tooltip="Matriks 7 Slot & Dispatcher"
                  className={
                    isItemActive("/operator")
                      ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                      : "text-sidebar-foreground/85 hover:text-sidebar-foreground"
                  }
                >
                  <Link href="/operator" onClick={handleLinkClick}>
                    <Radio className="size-4 shrink-0 text-emerald-500 animate-pulse" />
                    <span>Matriks 7 Slot Zoom</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive("/admin/bookings")}
                      tooltip="Pengawasan Booking"
                      className="text-sidebar-foreground/85 hover:text-sidebar-foreground"
                    >
                      <Link href="/admin/bookings" onClick={handleLinkClick}>
                        <CalendarCheck className="size-4 shrink-0" />
                        <span>Pengawasan Booking</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive("/admin/zoom-settings")}
                      tooltip="Infrastruktur Zoom Pro"
                      className="text-sidebar-foreground/85 hover:text-sidebar-foreground"
                    >
                      <Link href="/admin/zoom-settings" onClick={handleLinkClick}>
                        <Video className="size-4 shrink-0" />
                        <span>Akun Zoom Pro</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="py-1.5">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase px-2">
              Navigasi Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Kembali ke Portal Admin"
                    className="text-sidebar-foreground/85 hover:text-sidebar-foreground"
                  >
                    <Link href="/admin" onClick={handleLinkClick}>
                      <LayoutDashboard className="size-4 shrink-0 text-primary" />
                      <span>Portal Administrator</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer Profile Dropdown */}
      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      OP
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      Operator Dispatcher
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isAdmin ? "Admin Role" : "Petugas Zoom"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        OP
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Operator Zoom</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {isAdmin ? "Akses Administrator" : "Akses Konsol Terisolasi"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <ArrowLeft className="size-4 mr-2" />
                        Kembali ke Portal Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4 mr-2" />
                      Halaman Publik Solulu
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
