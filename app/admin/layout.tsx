import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminAppSidebar } from "@/components/admin/admin-app-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="theme-admin min-h-screen bg-background text-foreground flex w-full font-sans antialiased selection:bg-primary/20 selection:text-primary">
        {/* Skip to Main Content Link for WAI-ARIA and Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md text-xs font-medium"
        >
          Lewati ke konten utama
        </a>

        {/* Official Shadcn Collapsible & Mobile Drawer Sidebar */}
        <AdminAppSidebar />

        {/* Content Inset with Sticky Header & Dynamic Breadcrumbs */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <AdminHeader />
          <main id="main-content" className="flex-1 focus:outline-none">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
