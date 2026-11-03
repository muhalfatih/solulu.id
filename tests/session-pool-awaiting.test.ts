import { describe, it, expect } from "vitest"
import { resolveSessionSchedule, isPoolSessionOverdue } from "@/lib/pool/display"

describe("Ticket 30: /session/[token] untuk booking pool belum diklaim", () => {
  const poolBooking = { poolDate: "2026-11-10", poolSlotIndex: 4 }

  it("memakai jadwal konselor bila ada", () => {
    const sched = { id: "s1", date: "2026-11-11", startTime: "08:00:00", endTime: "09:30:00" }
    expect(resolveSessionSchedule(sched, poolBooking)).toEqual(sched)
  })

  it("tanpa baris jadwal, memakai tanggal dan jam slot pool", () => {
    const r = resolveSessionSchedule(null, poolBooking)
    expect(r).not.toBeNull()
    expect(r!.date).toBe("2026-11-10")
    expect(r!.startTime.slice(0, 5)).toBe("14:00")
    expect(r!.id).toBe("")
  })

  it("null bila bukan booking pool dan tanpa jadwal", () => {
    expect(resolveSessionSchedule(null, { poolDate: null, poolSlotIndex: null })).toBeNull()
  })
})

describe("Ticket 30: booking pool lewat jam sesi", () => {
  it("overdue setelah jam mulai slot", () => {
    const b = { poolDate: "2026-11-10", poolSlotIndex: 4 }
    expect(isPoolSessionOverdue(b, new Date("2026-11-10T13:59:00+07:00"))).toBe(false)
    expect(isPoolSessionOverdue(b, new Date("2026-11-10T14:01:00+07:00"))).toBe(true)
  })
})
