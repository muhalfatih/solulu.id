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
import { ADMIN_NAV_GROUPS } from "@/lib/navigation"
import { logoutAction } from "@/app/(auth)/login/actions"
import { getAdminProfileDataAction, type AdminProfileView } from "@/app/admin/profile/actions"
import {
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Sparkles,
  User,
  Shield,
} from "lucide-react"

export function AdminAppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [adminProfile, setAdminProfile] = React.useState<AdminProfileView | null>(null)

  React.useEffect(() => {
    let isMounted = true
    getAdminProfileDataAction()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setAdminProfile(res.data)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const isSuperadmin = adminProfile?.role === "superadmin"
  const roleName = isSuperadmin ? "Superadmin Solulu" : "Admin Pelayanan"
  const roleEmail = adminProfile?.email || (isSuperadmin ? "superadmin@solulu.id" : "admin@solulu.id")
  const roleInitial = isSuperadmin ? "SA" : "AD"

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
    if (href !== "/admin" && pathname.startsWith(href + "/")) {
      return true
    }
    return false
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
      {/* Brand & Workspace Identity */}
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
              <Link href="/admin" onClick={handleLinkClick}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0 font-bold text-sm">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    Solulu
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-muted-foreground">
                      Admin Portal
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-3.5 px-1 font-mono tracking-tight"
                    >
                      RBAC
                    </Badge>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation Groups */}
      <SidebarContent className="px-2 py-2">
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title} className="py-1.5">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase px-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
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
        ))}
      </SidebarContent>

      {/* Footer: User Account & Session Controls */}
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
                      {roleInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {roleName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {roleEmail}
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
                        {roleInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{roleName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {roleEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                      <User className="size-4 mr-2" />
                      Profil Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Shield className="size-4 mr-2" />
                      Konfigurasi Sistem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4 mr-2" />
                      Website Publik
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
