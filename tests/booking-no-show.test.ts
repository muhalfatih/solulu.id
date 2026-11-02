import { describe, it, expect, vi } from "vitest"
import { markBookingNoShowAction } from "@/app/admin/bookings/actions"
import { markNoShowAction } from "@/app/counselor/actions"
import type { NoShowBookingFacts } from "@/lib/booking/no-show"

const admin = {
  id: "admin-1",
  app_metadata: { role: "admin" },
  user_metadata: { role: "admin" },
}

const facts = (over: Partial<NoShowBookingFacts> = {}): NoShowBookingFacts => ({
  id: "b-1",
  status: "confirmed",
  counselorId: "c-1",
  scheduleId: "s-1",
  accessToken: "tok",
  scheduleDate: "2026-11-02",
  startTime: "10:00:00",
  timerStartedAt: null,
  ...over,
})

const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00+07:00`)

describe("Tandai No-Show hanya setelah toleransi 30 menit", () => {
  describe("admin", () => {
    it("is refused before the tolerance has elapsed and writes nothing", async () => {
      const updateFn = vi.fn()
      const res = await markBookingNoShowAction(
        { bookingId: "b-1" },
        { currentUser: admin, getBookingFn: async () => facts(), updateFn, now: at("10:29") }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("toleransi")
      expect(updateFn).not.toHaveBeenCalled()
    })

    it("writes status no_show (not completed, no isNoShow) once tolerance passed", async () => {
      const updateFn = vi.fn().mockResolvedValue(undefined)
      const res = await markBookingNoShowAction(
        { bookingId: "b-1" },
        { currentUser: admin, getBookingFn: async () => facts(), updateFn, now: at("10:30") }
      )
      expect(res.success).toBe(true)
      expect(updateFn).toHaveBeenCalledWith("b-1", {
        status: "no_show",
        noShowMarkedAt: expect.any(Date),
      })
    })

    it("reports a missing booking", async () => {
      const res = await markBookingNoShowAction(
        { bookingId: "nope" },
        { currentUser: admin, getBookingFn: async () => null, updateFn: vi.fn() }
      )
      expect(res.success).toBe(false)
    })
  })

  describe("counselor", () => {
    const counselor = {
      id: "u-1",
      counselorId: "c-1",
      app_metadata: { role: "counselor" },
      user_metadata: { role: "counselor" },
    }

    it("is refused before the tolerance", async () => {
      const updateFn = vi.fn()
      const res = await markNoShowAction("b-1", {
        currentUser: counselor,
        getBooking: async () => facts(),
        updateBooking: updateFn,
        now: at("10:10"),
      })
      expect(res.success).toBe(false)
      expect(updateFn).not.toHaveBeenCalled()
    })

    it("marks own booking no_show after the tolerance", async () => {
      const updateFn = vi.fn().mockResolvedValue(undefined)
      const res = await markNoShowAction("b-1", {
        currentUser: counselor,
        getBooking: async () => facts(),
        updateBooking: updateFn,
        now: at("10:45"),
      })
      expect(res.success).toBe(true)
      expect(updateFn).toHaveBeenCalledWith("b-1", {
        status: "no_show",
        noShowMarkedAt: expect.any(Date),
      })
    })

    it("refuses another counselor's booking", async () => {
      const updateFn = vi.fn()
      const res = await markNoShowAction("b-1", {
        currentUser: counselor,
        getBooking: async () => facts({ counselorId: "c-other" }),
        updateBooking: updateFn,
        now: at("11:00"),
      })
      expect(res.success).toBe(false)
      expect(updateFn).not.toHaveBeenCalled()
    })

    it("refuses a session whose timer already started", async () => {
      const res = await markNoShowAction("b-1", {
        currentUser: counselor,
        getBooking: async () => facts({ timerStartedAt: at("10:05") }),
        updateBooking: vi.fn(),
        now: at("11:00"),
      })
      expect(res.success).toBe(false)
    })
  })
})
