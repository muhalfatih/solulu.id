import * as React from "react"
import { cookies } from "next/headers"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { getSessionUser } from "@/lib/auth/staff"
import { getStaffRole } from "@/lib/auth/staff-role"
import { buildAttentionShortcuts, type PortalKey } from "@/lib/shell/nav"
import { getAttentionCounts } from "@/lib/shell/attention"
import { AppSidebar } from "./app-sidebar"
import { ShellProvider } from "./shell-provider"
import type { ShellUser } from "./nav-user"

const PROFILE_HREF: Record<PortalKey, string> = {
  admin: "/admin/profile",
  operator: "/operator",
  counselor: "/counselor/profile",
}

/**
 * Server component shared by the admin, operator and counselor layouts.
 * Access is enforced by the proxy; a missing session renders the shell with
 * no menu rather than throwing.
 */
export async function PortalShell({
  portal,
  displayName,
  footer,
  children,
}: {
  portal: PortalKey
  /** Overrides the name derived from the email (e.g. the counselor's full name). */
  displayName?: string | null
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const [user, cookieStore] = await Promise.all([getSessionUser(), cookies()])
  const role = getStaffRole(user)
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  const counts = role ? await getAttentionCounts(portal) : {}
  const attention = buildAttentionShortcuts(portal, counts)

  const email = user?.email ?? ""
  const shellUser: ShellUser = {
    name: displayName || email.split("@")[0] || "Akun",
    email,
    role,
    profileHref: PROFILE_HREF[portal],
  }

  return (
    <ShellProvider defaultOpen={defaultOpen}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>
      <AppSidebar portal={portal} user={shellUser} attention={attention} />
      <SidebarInset className="theme-admin min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" aria-label="Buka atau tutup menu navigasi" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <AppBreadcrumbs portal={portal} className="min-w-0 truncate" />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        {footer}
      </SidebarInset>
    </ShellProvider>
  )
}
