import { describe, it, expect, vi } from "vitest"
import { claimSessionCore, assignSessionCore } from "@/lib/pool/actions"
import type { PoolStore, PoolBooking } from "@/lib/pool/claim"

const booking: PoolBooking = {
  id: "b1",
  status: "confirmed",
  counselorId: null,
  poolDate: "2026-11-10",
  startTime: "10:00:00",
}

function store() {
  const inserted: unknown[] = []
  const s: PoolStore = {
    getBooking: async () => booking,
    getCounselorContext: async () => ({ typeAllowed: true, onLeave: false, freeScheduleId: "sch1" }),
    tryAssign: async (_b, _c, _s, inTx) => {
      await inTx?.({ insert: () => ({ values: async (row: unknown) => void inserted.push(row) }) } as never)
      return true
    },
  }
  return { s, inserted }
}

const early = new Date("2026-11-09T10:00:00+07:00")
const counselorUser = { id: "00000000-0000-4000-8000-000000000001", counselorId: "c1", app_metadata: { role: "counselor" } }
const adminUser = { id: "a1", app_metadata: { role: "admin" } }

describe("pool actions", () => {
  it("lets a counselor claim and triggers fulfillment", async () => {
    const { s } = store()
    const onAssigned = vi.fn(async () => {})
    const res = await claimSessionCore("b1", { store: s, currentUser: counselorUser, now: early, onAssigned })
    expect(res).toEqual({ success: true })
    expect(onAssigned).toHaveBeenCalledWith("b1")
  })

  it("denies anonymous and admin-as-counselor claims", async () => {
    const { s } = store()
    expect((await claimSessionCore("b1", { store: s, currentUser: null, now: early })).success).toBe(false)
    expect((await claimSessionCore("b1", { store: s, currentUser: adminUser, now: early })).success).toBe(false)
  })

  it("admin assignment writes a pool.assign audit row; counselors cannot assign", async () => {
    const { s, inserted } = store()
    const res = await assignSessionCore("b1", "c9", { store: s, currentUser: adminUser })
    expect(res.success).toBe(true)
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({ action: "pool.assign", entityType: "booking", entityId: "b1" })
    const denied = await assignSessionCore("b1", "c9", { store: s, currentUser: counselorUser })
    expect(denied.success).toBe(false)
  })
})
