// PROTOTYPE (branch prototype/admin-dashboard-v9): admin shell on shadcn block sidebar-08 (inset).
import * as React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { getAdminProfileDataAction } from "@/app/admin/profile/actions"
import { getAttention } from "./_prototype/dashboard-data"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [profile, attention] = await Promise.all([
    getAdminProfileDataAction().catch(() => null),
    getAttention().catch(() => []),
  ])
  const role = profile?.success && profile.data ? profile.data.role : "admin"
  const email = profile?.success && profile.data ? profile.data.email : "admin@solulu.id"

  return (
    <SidebarProvider defaultOpen>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>
      <AppSidebar
        portal="admin"
        attention={attention.map(({ key, label, count, href }) => ({ key, label, count, href }))}
        user={{ name: email.split("@")[0], email, role, profileHref: "/admin/profile" }}
      />
      <SidebarInset className="theme-admin min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <AppBreadcrumbs portal="admin" />
          </div>
        </header>
        <main id="main-content" className="flex-1 focus:outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
