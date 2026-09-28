import { describe, it, expect, vi } from "vitest"
import {
  checkZoomSafetyLock,
  canAddZoomAccount,
  isSessionUpcoming,
} from "../lib/zoom/safety-lock"

describe("Seam 2: Zoom Safety Lock & Platform Cap (lib/zoom/safety-lock.ts)", () => {
  describe("isSessionUpcoming helper", () => {
    it("returns true for a future date", () => {
      const now = new Date("2026-09-25T10:00:00+07:00")
      expect(isSessionUpcoming("2026-09-26", "09:00:00", now)).toBe(true)
    })

    it("returns true for today if endTime is in the future", () => {
      const now = new Date("2026-09-25T10:00:00+07:00")
      expect(isSessionUpcoming("2026-09-25", "10:30:00", now)).toBe(true)
    })

    it("returns false for today if endTime has already passed", () => {
      const now = new Date("2026-09-25T15:00:00+07:00")
      expect(isSessionUpcoming("2026-09-25", "14:00:00", now)).toBe(false)
    })

    it("returns false for past dates", () => {
      const now = new Date("2026-09-25T10:00:00+07:00")
      expect(isSessionUpcoming("2026-09-24", "20:00:00", now)).toBe(false)
    })
  })

  describe("checkZoomSafetyLock", () => {
    it("returns isLocked: true and details when account has upcoming confirmed or reserved sessions", async () => {
      const mockSessionsFetcher = vi.fn().mockResolvedValue([
        {
          bookingId: "b-1",
          patientName: "Anindya Putri",
          counselorName: "Sarah Annisa",
          date: "2026-09-25",
          startTime: "19:00:00",
          endTime: "20:30:00",
          status: "confirmed",
        },
        {
          bookingId: "b-2",
          patientName: "Budi Santoso",
          counselorName: "Sarah Annisa",
          date: "2026-09-26",
          startTime: "10:00:00",
          endTime: "11:30:00",
          status: "pending_payment",
        },
      ])

      const now = new Date("2026-09-25T12:00:00+07:00")
      const result = await checkZoomSafetyLock("zoom-acc-1", {
        fetchSessions: mockSessionsFetcher,
        currentDate: now,
      })

      expect(result.isLocked).toBe(true)
      expect(result.upcomingSessionCount).toBe(2)
      expect(result.lockedSessions.length).toBe(2)
      expect(result.reason).toContain("2 sesi mendatang")
      expect(result.reason).toContain("diblokir demi keamanan")
    })

    it("returns isLocked: false when account has no upcoming sessions", async () => {
      const mockSessionsFetcher = vi.fn().mockResolvedValue([])

      const now = new Date("2026-09-25T12:00:00+07:00")
      const result = await checkZoomSafetyLock("zoom-acc-2", {
        fetchSessions: mockSessionsFetcher,
        currentDate: now,
      })

      expect(result.isLocked).toBe(false)
      expect(result.upcomingSessionCount).toBe(0)
      expect(result.lockedSessions).toEqual([])
      expect(result.reason).toBeUndefined()
    })

    it("filters out past sessions and only locks for future/upcoming ones", async () => {
      const mockSessionsFetcher = vi.fn().mockResolvedValue([
        {
          bookingId: "b-past",
          patientName: "Past Patient",
          counselorName: "Sarah Annisa",
          date: "2026-09-24",
          startTime: "10:00:00",
          endTime: "11:30:00",
          status: "confirmed",
        },
        {
          bookingId: "b-future",
          patientName: "Future Patient",
          counselorName: "Sarah Annisa",
          date: "2026-09-26",
          startTime: "14:00:00",
          endTime: "15:30:00",
          status: "confirmed",
        },
      ])

      const now = new Date("2026-09-25T12:00:00+07:00")
      const result = await checkZoomSafetyLock("zoom-acc-1", {
        fetchSessions: mockSessionsFetcher,
        currentDate: now,
      })

      expect(result.isLocked).toBe(true)
      expect(result.upcomingSessionCount).toBe(1)
      expect(result.lockedSessions[0].bookingId).toBe("b-future")
    })
  })

  describe("canAddZoomAccount (Max 2 Zoom Accounts Limit)", () => {
    it("allows adding a new account when current count is 0 or 1", async () => {
      const mockCountFetcher = vi.fn().mockResolvedValue(1)
      const result = await canAddZoomAccount({ fetchCount: mockCountFetcher })

      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(1)
      expect(result.error).toBeUndefined()
    })

    it("rejects adding when 2 accounts already exist", async () => {
      const mockCountFetcher = vi.fn().mockResolvedValue(2)
      const result = await canAddZoomAccount({ fetchCount: mockCountFetcher })

      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(2)
      expect(result.error).toContain("maksimal 2 akun Zoom")
    })
  })
})
