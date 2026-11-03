import { describe, it, expect } from "vitest"
import { auditLogs, type NewAuditLog } from "../db/schema"
import {
  canRescheduleAdmin,
  canRescheduleSelf,
  deriveStage,
  DEFAULT_RESCHEDULE_CUTOFF_HOURS,
} from "../lib/booking-cycle"
import {
  rescheduleByAdmin,
  rescheduleBySelf,
  type RescheduleBookingFacts,
  type RescheduleDeps,
  type RescheduleSlot,
  type RescheduleTx,
} from "../lib/booking/reschedule"

const NOW = new Date("2026-11-03T02:00:00Z") // 09:00 WIB

describe("rules (Modul Siklus Booking)", () => {
  const base = {
    status: "confirmed" as const,
    selfRescheduleCount: 0,
    sessionDate: "2026-11-05",
    startTime: "10:00",
    now: NOW,
  }
  it("default cutoff is H-4", () => {
    expect(DEFAULT_RESCHEDULE_CUTOFF_HOURS).toBe(4)
  })
  it("self: allows once before the cutoff", () => {
    expect(canRescheduleSelf(base).allowed).toBe(true)
  })
  it("self: rejects second attempt with a message", () => {
    const r = canRescheduleSelf({ ...base, selfRescheduleCount: 1 })
    expect(r.allowed).toBe(false)
    expect(!r.allowed && r.reason).toMatch(/jatah reschedule/i)
  })
  it("self: rejects inside the cutoff, honours configured cutoff", () => {
    // session 12:00 WIB today = 3h away
    const near = { ...base, sessionDate: "2026-11-03", startTime: "12:00" }
    expect(canRescheduleSelf(near).allowed).toBe(false)
    expect(canRescheduleSelf({ ...near, cutoffHours: 2 }).allowed).toBe(true)
    expect(canRescheduleSelf({ ...near, startTime: "14:00", cutoffHours: 6 }).allowed).toBe(false)
  })
  it("self: rejects non-confirmed and started sessions", () => {
    expect(canRescheduleSelf({ ...base, status: "pending_payment" }).allowed).toBe(false)
    expect(canRescheduleSelf({ ...base, timerStartedAt: NOW }).allowed).toBe(false)
  })
  it("admin: any time while confirmed, no quota", () => {
    expect(canRescheduleAdmin({ status: "confirmed" }).allowed).toBe(true)
    expect(canRescheduleAdmin({ status: "completed" }).allowed).toBe(false)
    expect(canRescheduleAdmin({ status: "confirmed", timerStartedAt: NOW }).allowed).toBe(false)
  })
  it("stage shows Dijadwal Ulang once any reschedule happened", () => {
    expect(
      deriveStage({ status: "confirmed", counselorAssigned: true, rescheduleCount: 1, hasReport: false })
    ).toBe("dijadwal_ulang")
  })
})

function makeWorld(over: Partial<RescheduleBookingFacts> = {}, failAudit = false) {
  const booking: RescheduleBookingFacts = {
    id: "b1",
    accessToken: "tok-1",
    status: "confirmed",
    counselorId: "c1",
    scheduleId: "s-old",
    rescheduleCount: 0,
    adminRescheduleCount: 0,
    scheduleDate: "2026-11-05",
    startTime: "10:00",
    timerStartedAt: null,
    ...over,
  }
  const slot = (id: string, counselorId: string, date: string, startTime: string, status: RescheduleSlot["status"]): [string, RescheduleSlot] => [
    id,
    { id, counselorId, date, startTime, status, isLeave: false, reservedUntil: null },
  ]
  const slots = new Map<string, RescheduleSlot>([
    slot("s-old", "c1", "2026-11-05", "10:00", "booked"),
    slot("s-same", "c1", "2026-11-06", "14:00", "available"),
    slot("s-other", "c2", "2026-11-06", "16:00", "available"),
    slot("s-taken", "c1", "2026-11-07", "08:00", "booked"),
    slot("s-past", "c1", "2026-11-01", "08:00", "available"),
  ])
  const history: any[] = []
  const audit: NewAuditLog[] = []
  const updates: any[] = []
  const calls = { fulfilled: [] as string[], transactions: 0 }

  const tx: RescheduleTx = {
    loadBooking: async (ref) =>
      ref.bookingId === booking.id || ref.accessToken === booking.accessToken ? { ...booking } : null,
    loadSlot: async (id) => (slots.get(id) ? { ...slots.get(id)! } : null),
    claimSlot: async (id) => {
      const s = slots.get(id)!
      if (s.status !== "available") return false
      s.status = "booked"
      return true
    },
    releaseSlot: async (id) => {
      slots.get(id)!.status = "available"
    },
    updateBooking: async (_id, values) => {
      updates.push(values)
      Object.assign(booking, values)
    },
    insertHistory: async (row) => {
      history.push(row)
    },
    audit: {
      insert: (table) => {
        expect(table).toBe(auditLogs)
        return {
          values: async (row: NewAuditLog) => {
            if (failAudit) throw new Error("db down")
            audit.push(row)
          },
        }
      },
    },
  }
  const deps: RescheduleDeps = {
    transaction: async (fn) => {
      calls.transactions++
      return fn(tx)
    },
    getCutoffHours: async () => 4,
    fulfill: async (id) => {
      calls.fulfilled.push(id)
      return { success: true }
    },
    now: NOW,
  }
  return { booking, slots, history, audit, updates, calls, deps }
}

const admin = { id: "adm-1", app_metadata: { role: "admin" } }

describe("rescheduleBySelf", () => {
  it("moves to a slot of the same counselor, uses quota, frees old slot, keeps token, re-dispatches", async () => {
    const w = makeWorld()
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(true)
    expect(w.booking.scheduleId).toBe("s-same")
    expect(w.booking.rescheduleCount).toBe(1)
    expect(w.booking.adminRescheduleCount).toBe(0)
    expect(w.booking.accessToken).toBe("tok-1")
    expect(w.slots.get("s-old")!.status).toBe("available")
    expect(w.slots.get("s-same")!.status).toBe("booked")
    expect(w.history).toHaveLength(1)
    expect(w.history[0]).toMatchObject({ bookingId: "b1", initiatedBy: "client", fromScheduleId: "s-old", toScheduleId: "s-same" })
    // zoom cleared so the dispatcher allocates for the new slot
    expect(w.updates[0]).toMatchObject({ zoomJoinUrl: null, zoomStartUrl: null, zoomMeetingId: null, zoomAccountId: null })
    expect(w.updates[0]).not.toHaveProperty("accessToken")
    expect(w.calls.fulfilled).toEqual(["b1"])
    expect(w.audit).toHaveLength(0)
  })

  it("rejects the second attempt", async () => {
    const w = makeWorld({ rescheduleCount: 1 })
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/jatah reschedule/i)
    expect(w.history).toHaveLength(0)
    expect(w.calls.fulfilled).toHaveLength(0)
  })

  it("rejects inside the Platform Settings cutoff", async () => {
    const w = makeWorld({ scheduleDate: "2026-11-03", startTime: "12:00" })
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/H-4/)
    w.deps.getCutoffHours = async () => 2
    const ok = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(ok.success).toBe(true)
  })

  it("rejects another counselor's slot, taken slots, past slots", async () => {
    for (const [id, re] of [
      ["s-other", /konselor yang sama/i],
      ["s-taken", /tidak tersedia/i],
      ["s-past", /sudah lewat/i],
    ] as const) {
      const w = makeWorld()
      const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: id }, w.deps)
      expect(res.success, id).toBe(false)
      expect(res.error, id).toMatch(re)
      expect(w.booking.scheduleId).toBe("s-old")
    }
  })

  it("unknown token", async () => {
    const w = makeWorld()
    const res = await rescheduleBySelf({ accessToken: "nope", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(false)
  })

  it("still succeeds with a warning when Zoom allocation fails (payment resilience)", async () => {
    const w = makeWorld()
    w.deps.fulfill = async () => ({ success: false, error: "zoom down" })
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(true)
    expect(res.warning).toMatch(/zoom/i)
    expect(w.booking.scheduleId).toBe("s-same")
  })
})

describe("old Zoom meeting cleanup", () => {
  const withZoom = { zoomMeetingId: "zm-1", zoomAccountId: "za-1" } as Partial<RescheduleBookingFacts>

  it("deletes the previous Zoom meeting after the reschedule commits", async () => {
    const w = makeWorld(withZoom)
    const cancelled: unknown[] = []
    w.deps.cancelZoomMeeting = async (m) => {
      cancelled.push(m)
    }
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(true)
    expect(cancelled).toEqual([{ meetingId: "zm-1", zoomAccountId: "za-1" }])
  })

  it("does not undo the reschedule when deleting the old meeting fails", async () => {
    const w = makeWorld(withZoom)
    w.deps.cancelZoomMeeting = async () => {
      throw new Error("zoom 500")
    }
    const res = await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(res.success).toBe(true)
    expect(w.booking.scheduleId).toBe("s-same")
  })

  it("skips cleanup when the booking had no Zoom meeting", async () => {
    const w = makeWorld()
    let called = false
    w.deps.cancelZoomMeeting = async () => {
      called = true
    }
    await rescheduleBySelf({ accessToken: "tok-1", newScheduleId: "s-same" }, w.deps)
    expect(called).toBe(false)
  })
})

describe("rescheduleByAdmin", () => {
  it("changes counselor, keeps client quota intact, writes audit in the same transaction", async () => {
    const w = makeWorld()
    const res = await rescheduleByAdmin({ bookingId: "b1", newScheduleId: "s-other", actor: admin }, w.deps)
    expect(res.success).toBe(true)
    expect(w.booking.counselorId).toBe("c2")
    expect(w.booking.rescheduleCount).toBe(0)
    expect(w.booking.adminRescheduleCount).toBe(1)
    expect(w.history[0]).toMatchObject({ initiatedBy: "admin", actorId: "adm-1", fromCounselorId: "c1", toCounselorId: "c2" })
    expect(w.audit).toHaveLength(1)
    expect(w.audit[0]).toMatchObject({
      action: "booking.reschedule_admin",
      entityType: "booking",
      entityId: "b1",
      actorId: "adm-1",
      actorRole: "admin",
    })
    expect(w.calls.transactions).toBe(1)
    expect(w.calls.fulfilled).toEqual(["b1"])
  })

  it("works inside the client cutoff and after the quota is used", async () => {
    const w = makeWorld({ rescheduleCount: 1, scheduleDate: "2026-11-03", startTime: "10:30" })
    const res = await rescheduleByAdmin({ bookingId: "b1", newScheduleId: "s-same", actor: admin }, w.deps)
    expect(res.success).toBe(true)
    expect(w.booking.rescheduleCount).toBe(1)
  })

  it("denies non-admin roles", async () => {
    const w = makeWorld()
    const res = await rescheduleByAdmin(
      { bookingId: "b1", newScheduleId: "s-other", actor: { id: "c", app_metadata: { role: "counselor" } } },
      w.deps
    )
    expect(res.success).toBe(false)
    expect(w.calls.transactions).toBe(0)
  })

  it("fails (transaction rolls back) and skips dispatch when the audit write fails", async () => {
    const w = makeWorld({}, true)
    const res = await rescheduleByAdmin({ bookingId: "b1", newScheduleId: "s-other", actor: admin }, w.deps)
    expect(res.success).toBe(false)
    expect(w.calls.fulfilled).toHaveLength(0)
  })
})
