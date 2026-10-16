import * as React from "react"
import { getCounselorWeeklyGridAction } from "./actions"
import CounselorScheduleClient from "./CounselorScheduleClient"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const metadata = {
  title: "Komitmen Jadwal Praktik — Portal Mitra Konselor Solulu",
  description:
    "Portal manajemen komitmen ketersediaan jadwal 7 slot harian dan pengajuan izin cuti konselor Solulu.",
}

export default async function CounselorSchedulePage() {
  const result = await getCounselorWeeklyGridAction()

  if (!result.success || !result.data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Gagal Memuat Jadwal</AlertTitle>
          <AlertDescription>
            {result.error || "Gagal menghubungkan ke database jadwal praktik. Silakan segarkan halaman."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <CounselorScheduleClient initialData={result.data} />
}
