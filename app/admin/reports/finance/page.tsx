import * as React from "react"
import { getFinanceReportDataAction, type FinanceReportFilters } from "./actions"
import { FinanceReportClient } from "./FinanceReportClient"

export const metadata = {
  title: "Laporan Sesi & Keuangan | Solulu Admin",
  description:
    "Buku besar audit sesi konseling dan rekapitulasi pendapatan decoupled payroll Solulu",
}

interface PageProps {
  searchParams?: Promise<{
    startDate?: string
    endDate?: string
    counselorType?: "all" | "peer" | "psychologist"
    paymentMethod?: "all" | "xendit" | "manual_bank_transfer"
    status?: string
    search?: string
  }>
}

export default async function AdminFinanceReportPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined

  const filters: FinanceReportFilters = {
    startDate: resolvedParams?.startDate || null,
    endDate: resolvedParams?.endDate || null,
    counselorType: resolvedParams?.counselorType || "all",
    paymentMethod: resolvedParams?.paymentMethod || "all",
    status: resolvedParams?.status || "all",
    search: resolvedParams?.search || null,
  }

  // Real Database Query (Zero-Mock Policy)
  const res = await getFinanceReportDataAction({ filters })

  return (
    <FinanceReportClient
      initialItems={res.items}
      initialMetrics={res.metrics}
    />
  )
}
