"use client"

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

const TABLET_MAX = 1024
const MOBILE_MAX = 768

/**
 * SidebarProvider whose first state comes from the `sidebar_state` cookie (read
 * on the server, so SSR and hydration agree). With no saved preference, a
 * tablet-width viewport (768-1023px) starts collapsed to the icon rail; this
 * is a plain state change, so it never overwrites the user's saved choice.
 */
export function ShellProvider({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    const hasPreference = document.cookie.split("; ").some((c) => c.startsWith("sidebar_state="))
    const w = window.innerWidth
    if (!hasPreference && w >= MOBILE_MAX && w < TABLET_MAX) setOpen(false)
  }, [])

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      {children}
    </SidebarProvider>
  )
}
