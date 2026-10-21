import * as React from "react"
import { notFound } from "next/navigation"
import { getSessionReportAction } from "@/app/counselor/actions"
import { ClinicalReportForm } from "@/components/counselor/clinical-report-form"
import type { SessionReportDetailView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

interface ReportPageProps {
  params: Promise<{ bookingId: string }>
}

export const metadata = {
  title: "Laporan Sesi Klinis | Portal Konselor Solulu",
  description: "Formulir laporan sesi klinis dan catatan rahasia medis",
}

export default async function SessionReportPage({ params }: ReportPageProps) {
  const { bookingId } = await params
  const res = await getSessionReportAction(bookingId)

  const reportData: SessionReportDetailView | null = res.success && res.data ? res.data : null

  if (!reportData) {
    notFound()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16">
      <ClinicalReportForm initialData={reportData} />
    </div>
  )
}
