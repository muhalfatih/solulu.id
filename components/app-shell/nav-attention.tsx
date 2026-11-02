"use client"
// Adapted from shadcn block sidebar-08 (nav-projects) → "Perlu Tindakan" shortcuts with counts.
import Link from "next/link"
import { CircleDot } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type AttentionShortcut = { key: string; label: string; count: number | null; href: string }

export function NavAttention({ items }: { items: AttentionShortcut[] }) {
  const visible = items.filter((i) => (i.count ?? 0) > 0)
  if (!visible.length) return null
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Perlu Tindakan</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild size="sm">
              <Link href={item.href}>
                <CircleDot />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuBadge className="tabular-nums">{item.count}</SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
