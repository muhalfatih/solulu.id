import * as React from "react"
import { getManualPaymentsQueueAdminAction } from "./actions"
import { ManualPaymentsClient } from "./ManualPaymentsClient"

export const metadata = {
  title: "Verifikasi Transfer Manual | Solulu Admin",
  description: "Antrean verifikasi transfer bank manual untuk booking awal dan extend session",
}

export default async function AdminManualPaymentsPage() {
  const res = await getManualPaymentsQueueAdminAction()
  const items = res.success && res.data ? res.data : []

  return <ManualPaymentsClient initialItems={items} />
}
