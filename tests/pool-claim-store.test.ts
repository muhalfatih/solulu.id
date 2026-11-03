import { describe, it, expect } from "vitest"
import { claimPoolBooking, assignPoolBooking, type PoolStore, type PoolBooking } from "@/lib/pool/claim"

/** Penyimpanan in-memory: tryAssign adalah satu langkah sinkron seperti UPDATE bersyarat. */
function fakeStore(booking: PoolBooking, eligible: Record<string, boolean> = {}) {
  const state = { counselorId: booking.counselorId }
  const store: PoolStore = {
    async getBooking() {
      await Promise.resolve()
      return { ...booking, counselorId: state.counselorId }
    },
    async getCounselorContext(counselorId) {
      return { typeAllowed: true, onLeave: false, freeScheduleId: eligible[counselorId] === false ? null : `sch-${counselorId}` }
    },
    async tryAssign(_b, counselorId) {
      if (state.counselorId !== null) return false
      state.counselorId = counselorId
      return true
    },
  }
  return { store, state }
}

const booking: PoolBooking = {
  id: "b1",
  status: "confirmed",
  counselorId: null,
  poolDate: "2026-11-10",
  startTime: "10:00:00",
}
const early = new Date("2026-11-09T10:00:00+07:00")

describe("claimPoolBooking", () => {
  it("two counselors claiming concurrently: exactly one wins", async () => {
    const { store, state } = fakeStore(booking)
    const results = await Promise.all([
      claimPoolBooking(store, { bookingId: "b1", counselorId: "A", now: early }),
      claimPoolBooking(store, { bookingId: "b1", counselorId: "B", now: early }),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    const loser = results.find((r) => !r.ok)
    expect(loser && !loser.ok && loser.error).toMatch(/sudah diambil/i)
    expect(["A", "B"]).toContain(state.counselorId)
  })

  it("is refused after the H-4 cutoff, but Admin can still assign", async () => {
    const { store } = fakeStore(booking)
    const late = new Date("2026-11-10T07:00:00+07:00")
    const claim = await claimPoolBooking(store, { bookingId: "b1", counselorId: "A", now: late })
    expect(claim.ok).toBe(false)
    const assigned = await assignPoolBooking(store, { bookingId: "b1", counselorId: "A" })
    expect(assigned).toEqual({ ok: true, scheduleId: "sch-A" })
  })

  it("rejects a counselor without a free slot", async () => {
    const { store } = fakeStore(booking, { A: false })
    const r = await claimPoolBooking(store, { bookingId: "b1", counselorId: "A", now: early })
    expect(r.ok).toBe(false)
  })
})
