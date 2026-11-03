import * as React from "react"
import { getHonorSayaAction } from "./actions"
import { HonorSayaClient } from "./HonorSayaClient"

export const dynamic = "force-dynamic"

export default async function CounselorHonorPage() {
  const res = await getHonorSayaAction()

  if (!res.success || !res.data) {
    return <HonorSayaClient view={null} error={res.error ?? "Honor belum dapat dimuat."} />
  }
  return <HonorSayaClient view={res.data} error={null} />
}
