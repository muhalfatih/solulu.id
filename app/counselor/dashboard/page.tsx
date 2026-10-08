import * as React from "react"
import { getCounselorUpcomingSessionsAction } from "@/app/counselor/actions"
import { CounselorDashboardClient } from "./CounselorDashboardClient"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

export default async function CounselorDashboardPage() {
  const res = await getCounselorUpcomingSessionsAction()
  console.log("[CounselorDashboardPage SSR RES]:", { success: res.success, count: res.data?.length, error: res.error })
  const sessions: CounselorUpcomingSessionView[] = res.success && res.data ? res.data : []

  return <CounselorDashboardClient initialSessions={sessions} />
}
