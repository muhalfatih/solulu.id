import * as React from "react"
import { getCounselorProfileAction } from "@/app/counselor/actions"
import { CounselorProfileClient } from "./CounselorProfileClient"
import type { CounselorProfileView } from "@/lib/counselor/types"

export const dynamic = "force-dynamic"

export default async function CounselorProfilePage() {
  const res = await getCounselorProfileAction()

  let profile: CounselorProfileView | null = res.success && res.data ? res.data : null

  // Fallback demo mock if DB has no counselor profile yet
  if (!profile) {
    profile = {
      id: "c-1",
      userId: "demo-counselor-id",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa",
      counselorType: "psychologist",
      bio: "Psikolog klinis dengan pengalaman lebih dari 4 tahun mendampingi individu dalam mengatasi gangguan kecemasan, depresi, dinamika hubungan relasi, dan quarter-life crisis dengan pendekatan berbasis penerimaan dan komitmen (ACT) serta CBT.",
      specializations: [
        "Kecemasan (Anxiety)",
        "Quarter-life Crisis",
        "Depresi Ringan-Sedang",
        "Burnout & Stres Kerja",
      ],
      avatarR2Url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
      isActive: true,
    }
  }

  return <CounselorProfileClient initialProfile={profile} />
}
