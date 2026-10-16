import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCounselorDetailAdminAction } from "../actions"
import { CounselorDetailClient } from "./CounselorDetailClient"

export const dynamic = "force-dynamic"

interface CounselorDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: CounselorDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const res = await getCounselorDetailAdminAction(id)
  if (!res.success || !res.data) {
    return {
      title: "Detail Konselor | Solulu Admin",
      description: "Portal pemeriksaan profil dan dokumen mitra konselor Solulu.",
    }
  }

  return {
    title: `${res.data.fullName} | Verifikasi & Profil Konselor | Solulu Admin`,
    description: `Pemeriksaan 21 data profil, 8 berkas kepatuhan R2, dan radar STR/SIPP untuk ${res.data.fullName}.`,
  }
}

export default async function CounselorDetailPage({ params }: CounselorDetailPageProps) {
  const { id } = await params
  const res = await getCounselorDetailAdminAction(id)

  if (!res.success) {
    if (res.error?.includes("Akses ditolak")) {
      redirect("/unauthorized")
    }
    notFound()
  }

  return (
    <div className="w-full">
      <CounselorDetailClient initialCounselor={res.data} />
    </div>
  )
}
