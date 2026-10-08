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

  if (!reportData) {
    notFound()
  }

  return <SessionReportFormClient initialData={reportData} />
}
