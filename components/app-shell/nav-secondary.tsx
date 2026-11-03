"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ExternalLink, Moon, Sun } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary(props: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { resolvedTheme, setTheme } = useTheme()
  // The theme is unknown on the server; keep a stable label until mounted so
  // the first client render matches the server HTML in dark mode.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"
  const label = dark ? "Mode terang" : "Mode gelap"

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Lihat Situs Publik">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                <span>Lihat Situs Publik</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={label} onClick={() => setTheme(dark ? "light" : "dark")}>
              {dark ? <Sun /> : <Moon />}
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
