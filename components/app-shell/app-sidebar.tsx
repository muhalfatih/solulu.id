import * as React from "react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getVisibleNav, type AttentionShortcut, type PortalKey } from "@/lib/shell/nav"
import { NavMain } from "./nav-main"
import { NavAttention } from "./nav-attention"
import { NavSecondary } from "./nav-secondary"
import { NavUser, type ShellUser } from "./nav-user"

const PORTALS: Record<PortalKey, { label: string; home: string }> = {
  admin: { label: "Portal Admin", home: "/admin" },
  operator: { label: "Konsol Operator", home: "/operator" },
  counselor: { label: "Portal Konselor", home: "/counselor/dashboard" },
}

/** The one sidebar-08 (inset) shell shared by admin, operator and counselor. */
export function AppSidebar({
  portal,
  user,
  attention,
}: {
  portal: PortalKey
  user: ShellUser
  attention: AttentionShortcut[]
}) {
  const { label, home } = PORTALS[portal]
  const groups = getVisibleNav(portal, user.role)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={label}>
              <Link href={home}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Solulu</span>
                  <span className="truncate text-xs text-muted-foreground">{label}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
        <NavAttention items={attention} />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
