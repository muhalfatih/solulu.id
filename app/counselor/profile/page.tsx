import * as React from "react"
import { getCounselorProfileAction } from "@/app/counselor/actions"
import { getActiveSpecializationsAction } from "@/app/admin/specializations/actions"
import { getBankAccountAction } from "@/app/counselor/honor/actions"
import { CounselorProfileClient } from "./CounselorProfileClient"
import { BankAccountCard } from "./BankAccountCard"
import type { CounselorProfileView } from "@/lib/counselor/types"
import { DashboardFrame } from "@/components/app-shell/dashboard-frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CounselorProfilePage() {
  const [res, specsRes, bankRes] = await Promise.all([
    getCounselorProfileAction(),
    getActiveSpecializationsAction(),
    getBankAccountAction(),
  ])

  const profile: CounselorProfileView | null = res.success && res.data ? res.data : null

  if (!profile) {
    return (
      <DashboardFrame title="Profil Konselor">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Profil belum dapat dimuat</AlertTitle>
          <AlertDescription>{res.error ?? "Profil konselor tidak ditemukan."}</AlertDescription>
        </Alert>
      </DashboardFrame>
    )
  }

  const availableSpecializations: string[] = specsRes.success && specsRes.data ? specsRes.data.map((s) => s.name) : []

  return (
    <>
      <CounselorProfileClient
        initialProfile={profile}
        availableSpecializations={availableSpecializations}
      />
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <BankAccountCard initial={bankRes.success ? (bankRes.data ?? null) : null} />
      </div>
    </>
  )
}

