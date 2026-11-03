"use client"

import { useRouter } from "next/navigation"
import { PoolQueue, type PoolQueueRow } from "@/components/pool/pool-queue"
import { claimSessionAction } from "@/app/counselor/klien-tersedia/actions"

/** Antrean Klien Tersedia di dashboard: klaim langsung, lalu segarkan daftar sesi. */
export function PoolQueueDashboard({ items, error }: { items: PoolQueueRow[]; error: string | null }) {
  const router = useRouter()
  return (
    <PoolQueue
      mode="claim"
      items={items}
      error={error}
      onClaim={async (bookingId) => {
        const res = await claimSessionAction(bookingId)
        if (res.success) router.refresh()
        return res
      }}
    />
  )
}
