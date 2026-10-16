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
import { COUNSELOR_NAV_ITEMS } from "@/lib/navigation"
import { logoutAction } from "@/app/(auth)/login/actions"
import { ChevronsUpDown, ExternalLink, LogOut, UserCheck } from "lucide-react"

export interface CounselorProfileSummary {
  fullName: string
  title?: string | null
  counselorType?: "peer" | "psychologist"
}

interface CounselorAppSidebarProps {
  counselor: CounselorProfileSummary | null
  isLoading?: boolean
}

export function CounselorAppSidebar({
  counselor,
  isLoading = false,
}: CounselorAppSidebarProps) {
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

  const isItemActive = (href: string, aliases?: string[]) => {
    if (pathname === href) return true
    if (aliases && aliases.some((a) => pathname === a || pathname.startsWith(a + "/"))) {
      return true
    }
    if (href !== "/counselor" && pathname.startsWith(href + "/")) {
      return true
    }
    return false
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const counselorName = counselor?.fullName || (isLoading ? "Memuat..." : "Mitra Konselor")
  const counselorRole =
    counselor?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
  const initial = counselor?.fullName ? counselor.fullName.charAt(0).toUpperCase() : "K"

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
      {/* Brand & Workspace Identity */}
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/counselor/dashboard" onClick={handleLinkClick}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0 font-bold text-sm">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    Solulu
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-muted-foreground">
                      Ruang Klinis
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-3.5 px-1 font-mono tracking-tight"
                    >
                      Mitra
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
            Konseling & Jadwal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {COUNSELOR_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isItemActive(item.href, item.aliases)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={
                        active
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                          : "text-sidebar-foreground/85 hover:text-sidebar-foreground"
                      }
                    >
                      <Link href={item.href} onClick={handleLinkClick}>
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "secondary"}
                            className="ml-auto text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: Counselor Profile & Logout */}
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
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {counselorName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {counselorRole}
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
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{counselorName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {counselorRole}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/counselor/profile">
                      <UserCheck className="size-4 mr-2" />
                      Profil & STR/SIPP
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4 mr-2" />
                      Halaman Depan Solulu
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
