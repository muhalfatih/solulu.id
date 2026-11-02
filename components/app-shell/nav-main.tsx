"use client"
// Adapted from shadcn block sidebar-08 (nav-main).
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { ShellNavItem } from "./admin-nav"

function matches(pathname: string, url: string, aliases: string[] = []) {
  if (url.startsWith("#")) return false
  return [url, ...aliases].some((u) => pathname === u || (u !== "/admin" && pathname.startsWith(`${u}/`)))
}

export function NavMain({ items, label = "Menu" }: { items: ShellNavItem[]; label?: string }) {
  const pathname = usePathname() ?? ""
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const childActive = item.items?.some((s) => matches(pathname, s.url, s.aliases)) ?? false
          const selfActive = !item.items?.length && matches(pathname, item.url)
          return (
            <Collapsible key={item.title} asChild defaultOpen={childActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={selfActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Buka {item.title}</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton asChild isActive={matches(pathname, sub.url, sub.aliases)}>
                              <Link href={sub.url} aria-disabled={sub.soon}>
                                <span>{sub.title}</span>
                                {sub.soon && (
                                  <Badge variant="outline" className="ml-auto h-4 px-1 text-[10px] font-normal">
                                    baru
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
