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
import type { AttentionShortcut } from "@/lib/shell/nav"

/** NavProjects of sidebar-08, used for "Perlu Tindakan". Hidden when empty. */
export function NavAttention({ items }: { items: AttentionShortcut[] }) {
  const visible = items.filter((i) => i.count > 0)
  if (visible.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Perlu Tindakan</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild>
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
