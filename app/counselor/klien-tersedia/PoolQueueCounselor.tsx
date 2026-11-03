"use client"

import { PoolQueue, type PoolQueueRow } from "@/components/pool/pool-queue"
import { claimSessionAction } from "./actions"

export function PoolQueueCounselor({ items, error }: { items: PoolQueueRow[]; error: string | null }) {
  return <PoolQueue mode="claim" items={items} error={error} onClaim={claimSessionAction} />
}
