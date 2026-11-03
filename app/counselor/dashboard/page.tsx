import * as React from "react"
import { getCounselorUpcomingSessionsAction } from "@/app/counselor/actions"
import { getHonorSayaAction } from "@/app/counselor/honor/actions"
import { getAvailableClientsAction } from "@/app/counselor/klien-tersedia/actions"
import { summarizeCurrentHonor } from "@/lib/counselor/dashboard"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"
import { CounselorDashboardClient } from "./CounselorDashboardClient"
import { HonorSummary, PoolSummary } from "./summary"

export const dynamic = "force-dynamic"

export default async function CounselorDashboardPage() {
  const [sessionsRes, honorRes, poolRes] = await Promise.all([
    getCounselorUpcomingSessionsAction(),
    getHonorSayaAction(),
    getAvailableClientsAction(),
  ])
  const sessions: CounselorUpcomingSessionView[] = sessionsRes.success && sessionsRes.data ? sessionsRes.data : []
  const honor = honorRes.success && honorRes.data ? summarizeCurrentHonor(honorRes.data, new Date()) : null

  return (
    <CounselorDashboardClient
      // Remount saat daftar sesi berubah (mis. setelah klaim) agar state lokal ikut data terbaru.
      key={sessions.map((s) => s.id).join(",")}
      initialSessions={sessions}
      summarySlot={
        <>
          <HonorSummary summary={honor} error={honorRes.success ? null : honorRes.error} />
          <PoolSummary items={poolRes.success ? poolRes.data : []} error={poolRes.success ? null : poolRes.error} />
        </>
      }
    />
  )
}
