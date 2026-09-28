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

  if (result.success && result.data && result.data.length > 0) {
    initialSlots = result.data
  } else {
    // Provide realistic initial demonstration data for local dev review
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tStr = tomorrow.toISOString().split("T")[0]

    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    const daStr = dayAfter.toISOString().split("T")[0]

    initialSlots = [
      {
        id: "demo-slot-1",
        counselorId: "c-1",
        date: tStr,
        startTime: "09:00",
        endTime: "10:30",
        timeRange: "09:00 – 10:30 WIB",
        status: "available",
        canCancel: true,
      },
      {
        id: "demo-slot-2",
        counselorId: "c-1",
        date: tStr,
        startTime: "13:30",
        endTime: "15:00",
        timeRange: "13:30 – 15:00 WIB",
        status: "reserved",
        canCancel: false,
        cancelRestrictionReason: "Slot sedang dalam proses reservasi pemesanan (hold 17 menit).",
      },
      {
        id: "demo-slot-3",
        counselorId: "c-1",
        date: tStr,
        startTime: "19:00",
        endTime: "20:30",
        timeRange: "19:00 – 20:30 WIB",
        status: "booked",
        canCancel: false,
        cancelRestrictionReason: "Slot sudah dikonfirmasi dan dipesan oleh pasien.",
      },
      {
        id: "demo-slot-4",
        counselorId: "c-1",
        date: daStr,
        startTime: "11:00",
        endTime: "12:30",
        timeRange: "11:00 – 12:30 WIB",
        status: "available",
        canCancel: true,
      },
      {
        id: "demo-slot-5",
        counselorId: "c-1",
        date: daStr,
        startTime: "15:30",
        endTime: "17:00",
        timeRange: "15:30 – 17:00 WIB",
        status: "available",
        canCancel: true,
      },
    ]
  }

  return <CounselorSchedulesClient initialSlots={initialSlots} />
}
