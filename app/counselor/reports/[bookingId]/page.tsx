import * as React from "react"
import { notFound } from "next/navigation"
import { getSessionReportAction } from "@/app/counselor/actions"
import { SessionReportFormClient } from "./SessionReportFormClient"
import type { SessionReportDetailView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

interface ReportPageProps {
  params: Promise<{ bookingId: string }>
}

export default async function SessionReportPage({ params }: ReportPageProps) {
  const { bookingId } = await params
  const res = await getSessionReportAction(bookingId)

  let reportData: SessionReportDetailView | null = res.success && res.data ? res.data : null

  // Fallback demo mock if accessing a demo bookingId in development
  if (!reportData) {
    if (bookingId.startsWith("b-") || bookingId.startsWith("demo-")) {
      reportData = {
        id: "",
        bookingId,
        counselorId: "c-1",
        summary: "",
        actionPlan: "",
        followUpRecommendation: "",
        attachmentR2Keys: [],
        createdAt: new Date().toISOString(),
        booking: {
          id: bookingId,
          patientName: bookingId === "b-102" ? "Adinda Putri" : "Dimas Arya",
          patientEmail: bookingId === "b-102" ? "adinda.putri@example.com" : "dimas.arya@example.com",
          patientPhone: bookingId === "b-102" ? "081987654321" : "081234567890",
          date: "2026-09-28",
          timeRange: "19:00 – 20:30 WIB",
          initialNotes:
            bookingId === "b-102"
              ? "Butuh ruang aman bercerita mengenai adaptasi kerja & burnout."
              : "Sering cemas saat presentasi kerja dan insomnia 2 minggu terakhir.",
          srqScore: bookingId === "b-102" ? 5 : 9,
          hasSuicidalThoughts: bookingId !== "b-102",
          bypassedRecommendation: false,
        },
      }
    } else {
      notFound()
    }
  }

  return <SessionReportFormClient initialData={reportData} />
}
