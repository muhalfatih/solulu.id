import * as React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { OperatorAppSidebar } from "@/components/operator/operator-app-sidebar"
import { OperatorHeader } from "@/components/operator/operator-header"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Konsol Operator & Dispatcher Zoom | Solulu",
  description:
    "Konsol operasional klinik Solulu untuk pemantauan 7 slot harian, kontrol dispatcher 4 akun Zoom Pro, dan panduan Breakout Room.",
}

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoRole = cookieStore.get("solulu_demo_role")?.value
  let isAdmin = demoRole === "admin" || demoRole === "superadmin"

  if (!demoRole) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const role = user?.app_metadata?.role || user?.user_metadata?.role
      isAdmin = role === "admin" || role === "superadmin"
    } catch {
      // fallback
    }
  }

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

        {/* Official Shadcn Collapsible & Mobile Drawer Sidebar for Operator */}
        <OperatorAppSidebar isAdmin={isAdmin} />

        {/* Content Inset with Sticky Header & Dynamic Breadcrumbs */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <OperatorHeader isAdmin={isAdmin} />
          <main id="main-content" className="flex-1 focus:outline-none">
            {children}
          </main>
          <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                Solulu Mental Health &copy; {new Date().getFullYear()} — Master SOP Counseling System
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                Akses Terisolasi: Khusus Pemantauan Sesi & Breakout Room (Bebas Rekam Medis & Finansial)
              </span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
