import * as React from "react"
import { getCounselorProfileAction } from "@/app/counselor/actions"
import { getActiveSpecializationsAction } from "@/app/admin/specializations/actions"
import { CounselorProfileClient } from "./CounselorProfileClient"
import type { CounselorProfileView } from "@/lib/counselor/types"
import { SOLULU_SPECIALIZATION_PRESETS } from "@/lib/validations/counselor-admin"

export const dynamic = "force-dynamic"

export default async function CounselorProfilePage() {
  const [res, specsRes] = await Promise.all([
    getCounselorProfileAction(),
    getActiveSpecializationsAction(),
  ])

  let profile: CounselorProfileView | null = res.success && res.data ? res.data : null

  if (!profile) {
    profile = {
      id: "",
      userId: "",
      fullName: "",
      title: "",
      counselorType: "psychologist",
      bio: "",
      specializations: [],
      avatarR2Url: null,
      isActive: true,
    }
  }

  const availableSpecializations: string[] =
    specsRes.success && specsRes.data && specsRes.data.length > 0
      ? specsRes.data.map((s) => s.name)
      : [...SOLULU_SPECIALIZATION_PRESETS]

  return (
    <CounselorProfileClient
      initialProfile={profile}
      availableSpecializations={availableSpecializations}
    />
  )
}

