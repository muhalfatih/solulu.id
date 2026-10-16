import * as React from "react"
import { getOperatorSlotMatrixAction } from "./actions"
import { OperatorConsoleClient } from "./OperatorConsoleClient"
import { getTodayWibDateString } from "@/lib/operator/dispatcher"

export const dynamic = "force-dynamic"

interface OperatorPageProps {
  searchParams?: Promise<{
    date?: string
  }>
}

export default async function OperatorPage({ searchParams }: OperatorPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const targetDate = resolvedParams.date || getTodayWibDateString()

  const matrixData = await getOperatorSlotMatrixAction(targetDate)

  return <OperatorConsoleClient initialData={matrixData} />
}
