import * as React from "react"
import { getCounselorSchedulesAction, type ScheduleItemView } from "./actions"
import CounselorSchedulesClient from "./CounselorSchedulesClient"

export const metadata = {
  title: "Jadwal Praktik — Portal Mitra Konselor Solulu",
  description: "Kelola ketersediaan slot konsultasi 90 menit dan jam praktik mandiri konselor.",
}

export default async function CounselorSchedulesPage() {
  const result = await getCounselorSchedulesAction()

  let initialSlots: ScheduleItemView[] = []

  if (result.success && result.data) {
    initialSlots = result.data
  }

  return <CounselorSchedulesClient initialSlots={initialSlots} />
}
