import { describe, it, expect } from "vitest"
import {
  deriveStage,
  canMarkNoShow,
  isHoldExpired,
  overtimeBlocks,
  canRescheduleSession,
  stageLabel,
  sessionStartAt,
} from "@/lib/booking-cycle"

const base = {
  status: "confirmed" as const,
  counselorAssigned: true,
  rescheduleCount: 0,
  timerStartedAt: null,
  hasReport: false,
  payrollClosed: false,
}

describe("Modul Siklus Booking (titik uji 1)", () => {
  describe("deriveStage", () => {
    it("maps stored statuses that cannot be derived", () => {
      expect(deriveStage({ ...base, status: "pending_payment" })).toBe("menunggu_bayar")
      expect(deriveStage({ ...base, status: "expired" })).toBe("kedaluwarsa")
      expect(deriveStage({ ...base, status: "cancelled" })).toBe("dibatalkan")
      expect(deriveStage({ ...base, status: "no_show" })).toBe("no_show")
    })

    it("derives confirmed sub-stages from facts recorded elsewhere", () => {
      expect(deriveStage({ ...base, counselorAssigned: false })).toBe("terkonfirmasi")
      expect(deriveStage(base)).toBe("ditugaskan")
      expect(deriveStage({ ...base, rescheduleCount: 1 })).toBe("dijadwal_ulang")
      expect(
        deriveStage({ ...base, rescheduleCount: 1, timerStartedAt: new Date("2026-11-02T01:00:00Z") })
      ).toBe("sesi_berjalan")
    })

    it("derives completed sub-stages from report and payroll", () => {
      expect(deriveStage({ ...base, status: "completed" })).toBe("selesai")
      expect(deriveStage({ ...base, status: "completed", hasReport: true })).toBe("laporan_masuk")
      expect(
        deriveStage({ ...base, status: "completed", hasReport: true, payrollClosed: true })
      ).toBe("payroll_ditutup")
    })

    it("exposes Indonesian labels", () => {
      expect(stageLabel("menunggu_bayar")).toBe("Menunggu Bayar")
      expect(stageLabel("kedaluwarsa")).toBe("Kedaluwarsa")
      expect(stageLabel("no_show")).toBe("No-Show")
      expect(stageLabel("payroll_ditutup")).toBe("Payroll Ditutup")
    })
  })

  describe("canMarkNoShow", () => {
    const start = new Date("2026-11-02T10:00:00+07:00")
    const at = (minutes: number) => new Date(start.getTime() + minutes * 60_000)

    it("refuses before the 30 minute default tolerance has elapsed", () => {
      const r = canMarkNoShow({ status: "confirmed", sessionStart: start, now: at(29.9) })
      expect(r.allowed).toBe(false)
      expect(r.reason).toBeTruthy()
    })

    it("allows exactly at and after the tolerance", () => {
      expect(canMarkNoShow({ status: "confirmed", sessionStart: start, now: at(30) }).allowed).toBe(true)
      expect(canMarkNoShow({ status: "confirmed", sessionStart: start, now: at(90) }).allowed).toBe(true)
    })

    it("honours a custom tolerance", () => {
      expect(
        canMarkNoShow({ status: "confirmed", sessionStart: start, now: at(15), toleranceMinutes: 15 }).allowed
      ).toBe(true)
    })

    it("refuses non-confirmed bookings and sessions whose timer already started", () => {
      for (const status of ["pending_payment", "completed", "no_show", "cancelled", "expired"] as const) {
        expect(canMarkNoShow({ status, sessionStart: start, now: at(60) }).allowed).toBe(false)
      }
      expect(
        canMarkNoShow({ status: "confirmed", sessionStart: start, now: at(60), timerStartedAt: at(5) }).allowed
      ).toBe(false)
    })
  })

  describe("isHoldExpired", () => {
    const t0 = new Date("2026-11-02T10:00:00+07:00")
    const at = (minutes: number) => new Date(t0.getTime() + minutes * 60_000)

    it("expires public holds after 17 minutes", () => {
      expect(isHoldExpired(t0, "public", at(17))).toBe(false)
      expect(isHoldExpired(t0, "public", at(17.01))).toBe(true)
    })

    it("allows 60 minutes for Booking Cepat holds", () => {
      expect(isHoldExpired(t0, "booking_cepat", at(59))).toBe(false)
      expect(isHoldExpired(t0, "booking_cepat", at(60))).toBe(false)
      expect(isHoldExpired(t0, "booking_cepat", at(60.01))).toBe(true)
    })
  })

  describe("overtimeBlocks", () => {
    it("is zero up to and including minute 95 (free tolerance)", () => {
      expect(overtimeBlocks(0)).toBe(0)
      expect(overtimeBlocks(90)).toBe(0)
      expect(overtimeBlocks(95)).toBe(0)
    })

    it("is one 30-minute block from minute 96 to the 120 minute cap", () => {
      expect(overtimeBlocks(96)).toBe(1)
      expect(overtimeBlocks(119)).toBe(1)
      expect(overtimeBlocks(120)).toBe(1)
    })

    it("never exceeds the 120 minute hard stop", () => {
      expect(overtimeBlocks(150)).toBe(1)
    })
  })

  describe("canRescheduleSession (absorbed)", () => {
    const now = new Date("2026-09-28T10:00:00+07:00")
    it("blocks inside the cutoff and allows outside", () => {
      expect(canRescheduleSession("2026-09-28", "13:00", now, 4).allowed).toBe(false)
      expect(canRescheduleSession("2026-09-28", "14:00", now, 4).allowed).toBe(true)
    })
    it("builds session start in WIB", () => {
      expect(sessionStartAt("2026-09-28", "09:30:00").toISOString()).toBe("2026-09-28T02:30:00.000Z")
    })
  })
})
