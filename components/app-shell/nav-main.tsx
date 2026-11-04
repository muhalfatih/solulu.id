"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getActiveHref, getVisibleNav, type PortalKey } from "@/lib/shell/nav"

/**
 * Menu dihitung di sisi klien dari `portal` + `role` (string serializable); komponen ikon
 * (fungsi) tidak boleh dioper dari Server Component ke Client Component (ADR-0012).
 */
export function NavMain({ portal, role }: { portal: PortalKey; role: Parameters<typeof getVisibleNav>[1] }) {
  const groups = React.useMemo(() => getVisibleNav(portal, role), [portal, role])
  const pathname = usePathname() ?? ""
  const { isMobile, setOpenMobile } = useSidebar()
  const activeHref = getActiveHref(
    pathname,
    groups.flatMap((g) => g.items)
  )

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const active = item.url === activeHref
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                    <Link
                      href={item.url}
                      aria-current={active ? "page" : undefined}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
