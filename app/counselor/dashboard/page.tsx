import * as React from "react"
import { getCounselorUpcomingSessionsAction } from "@/app/counselor/actions"
import { CounselorDashboardClient } from "./CounselorDashboardClient"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

export default async function CounselorDashboardPage() {
  const res = await getCounselorUpcomingSessionsAction()
  let sessions: CounselorUpcomingSessionView[] = res.success && res.data ? res.data : []

  // Development/Demo fallback if DB has no active confirmed sessions yet
  if (sessions.length === 0) {
    sessions = [
      {
        id: "b-101",
        accessToken: "demo-token-101",
        patientName: "Dimas Arya",
        patientEmail: "dimas.arya@example.com",
        patientPhone: "081234567890",
        initialNotes: "Sering cemas intens saat presentasi kerja dan insomnia kronis 2 minggu terakhir.",
        date: "2026-09-28",
        startTime: "19:00",
        endTime: "20:30",
        timeRange: "19:00 – 20:30 WIB",
        status: "confirmed",
        zoomStartUrl: "https://zoom.us/s/982341234?tk=counselor-demo",
        zoomMeetingId: "982341234",
        srqScore: 9,
        hasSuicidalThoughts: true, // Question 17 flagged!
        bypassedRecommendation: false,
        hasReport: false,
        reportId: null,
      },
      {
        id: "b-102",
        accessToken: "demo-token-102",
        patientName: "Adinda Putri",
        patientEmail: "adinda.putri@example.com",
        patientPhone: "081987654321",
        initialNotes: "Butuh ruang aman bercerita mengenai adaptasi lingkungan kerja baru & burnout.",
        date: "2026-09-29",
        startTime: "13:30",
        endTime: "15:00",
        timeRange: "13:30 – 15:00 WIB",
        status: "confirmed",
        zoomStartUrl: "https://zoom.us/s/982341235?tk=counselor-demo",
        zoomMeetingId: "982341235",
        srqScore: 5,
        hasSuicidalThoughts: false,
        bypassedRecommendation: false,
        hasReport: false,
        reportId: null,
      },
      {
        id: "b-103",
        accessToken: "demo-token-103",
        patientName: "Budi Santoso",
        patientEmail: "budi.santoso@example.com",
        patientPhone: "081345678912",
        initialNotes: "Evaluasi kemajuan latihan regulasi emosi pasca sesi minggu lalu.",
        date: "2026-09-27",
        startTime: "10:00",
        endTime: "11:30",
        timeRange: "10:00 – 11:30 WIB",
        status: "completed",
        zoomStartUrl: null,
        zoomMeetingId: "982341236",
        srqScore: 7,
        hasSuicidalThoughts: false,
        bypassedRecommendation: true,
        hasReport: true,
        reportId: "rep-103",
      },
    ]
  }

  return <CounselorDashboardClient initialSessions={sessions} />
}
