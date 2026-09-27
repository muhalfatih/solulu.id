import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ApplicationsClient } from "./ApplicationsClient"
import { getCounselorApplicationsAction } from "./actions"

export const metadata: Metadata = {
  title: "Verifikasi Berkas Kemitraan Konselor | Solulu Admin",
  description:
    "Portal review dan verifikasi berkas pelamar mitra konselor dan psikolog klinis Solulu.",
}

export default async function AdminCounselorApplicationsPage() {
  const res = await getCounselorApplicationsAction()

  if (!res.success) {
    if (res.error?.includes("Akses ditolak")) {
      redirect("/unauthorized")
    }
  }

  const applications = res.data || []

  return (
    <div className="w-full">
      <ApplicationsClient initialApplications={applications} />
    </div>
  )
}
