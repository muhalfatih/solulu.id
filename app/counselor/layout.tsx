import * as React from "react"
import { PortalShell } from "@/components/app-shell/portal-shell"
import { getCounselorProfileAction } from "@/app/counselor/actions"

export default async function CounselorPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCounselorProfileAction().catch(() => null)
  const fullName = profile?.success && profile.data ? profile.data.fullName : null

  return (
    <PortalShell portal="counselor" displayName={fullName}>
      {children}
    </PortalShell>
  )
}
