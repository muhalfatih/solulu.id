"use client"
// Adapted from shadcn block sidebar-08 (inset). One shell for admin/operator/counselor;
// only the nav data differs per role.
import * as React from "react"
import Link from "next/link"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { ADMIN_SHELL_NAV, type ShellNavItem } from "./admin-nav"
import { NavMain } from "./nav-main"
import { NavAttention, type AttentionShortcut } from "./nav-attention"
import { NavSecondary } from "./nav-secondary"
import { NavUser, type ShellUser } from "./nav-user"

const PORTALS: Record<"admin", { label: string; home: string; nav: ShellNavItem[] }> = {
  admin: { label: "Portal Admin", home: "/admin", nav: ADMIN_SHELL_NAV },
}

export function AppSidebar({
  portal,
  attention,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  portal: keyof typeof PORTALS
  attention: AttentionShortcut[]
  user: ShellUser
}) {
  const { label: portalLabel, home: homeHref, nav } = PORTALS[portal]
  const items = nav.filter((n) => !n.superadminOnly || user.role === "superadmin")
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeHref}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Solulu</span>
                  <span className="truncate text-xs text-muted-foreground">{portalLabel}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavAttention items={attention} />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
