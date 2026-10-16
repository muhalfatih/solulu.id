"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { CounselorAppSidebar, type CounselorProfileSummary } from "@/components/counselor/counselor-app-sidebar"
import { CounselorHeader } from "@/components/counselor/counselor-header"
import { getCounselorProfileAction } from "@/app/counselor/actions"

export default function CounselorPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [counselor, setCounselor] = React.useState<CounselorProfileSummary | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true
    getCounselorProfileAction()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setCounselor({
              fullName: res.data.fullName,
              title: res.data.title,
              counselorType: res.data.counselorType,
            })
          }
          setIsLoadingProfile(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingProfile(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

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

        {/* Official Shadcn Collapsible & Mobile Drawer Sidebar for Counselor */}
        <CounselorAppSidebar
          counselor={counselor}
          isLoading={isLoadingProfile}
        />

        {/* Content Inset with Header & Dynamic Breadcrumbs */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <CounselorHeader
            counselor={counselor}
            isLoading={isLoadingProfile}
          />
          <main id="main-content" className="flex-1 focus:outline-none">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
