"use client"

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
import { getActiveHref, type ShellNavGroup } from "@/lib/shell/nav"

export function NavMain({ groups }: { groups: ShellNavGroup[] }) {
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
