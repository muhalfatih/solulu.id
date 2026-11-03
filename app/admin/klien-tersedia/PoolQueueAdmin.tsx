"use client"

import { PoolQueue, type PoolQueueRow } from "@/components/pool/pool-queue"
import { assignPoolBookingAction } from "./actions"

export function PoolQueueAdmin({ items, error }: { items: PoolQueueRow[]; error: string | null }) {
  return <PoolQueue mode="assign" items={items} error={error} onAssign={assignPoolBookingAction} />
}
