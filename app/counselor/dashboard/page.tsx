import * as React from "react"
import { getCounselorUpcomingSessionsAction } from "@/app/counselor/actions"
import { CounselorDashboardClient } from "./CounselorDashboardClient"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

export default async function CounselorDashboardPage() {
  const res = await getCounselorUpcomingSessionsAction()
  const sessions: CounselorUpcomingSessionView[] = res.success && res.data ? res.data : []

  return <CounselorDashboardClient initialSessions={sessions} />
}
