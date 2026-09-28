import { describe, it, expect } from "vitest"
import { getSessionByTokenAction } from "@/lib/session/actions"
import type { SessionPageData } from "@/lib/session/types"
import { calculateSessionTimeInfo, getSessionCountdown } from "@/lib/session/time"

describe("Guest Patient Session Page (Issue #8 / Solulu v1)", () => {
  const baseSessionData: SessionPageData = {
    booking: {
      id: "book-12345",
      accessToken: "tok_test_session_8888888888888888",
      patientName: "Nadia Rahma",
      patientEmail: "nadia.rahma@example.com",
      patientPhone: "081234567890",
      initialNotes: "Perasaan cemas saat menghadapi situasi kerja baru",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/9876543210?pwd=test_secret_zoom",
      zoomMeetingId: "987 654 3210",
      createdAt: "2026-09-28T08:00:00.000Z",
    },
    counselor: {
      id: "c-sarah-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan kecemasan dan regulasi emosi.",
      specializations: ["Kecemasan", "Depresi", "Burnout", "Regulasi Emosi"],
      avatarR2Url: null,
    },
    schedule: {
      id: "sch-101",
      date: "2026-09-28",
      startTime: "19:00:00",
      endTime: "20:30:00",
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: "Senin, 28 September 2026",
    },
    transaction: {
      id: "tx-505",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-20260928-8888",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: "Rp 180.000",
      status: "PAID",
    },
  }

  describe("US-15: Session Data & Counselor Profile Access", () => {
    it("retrieves full counselor profile, bio, and specializations without requiring patient login (US-61)", async () => {
      const res = await getSessionByTokenAction("tok_test_session_8888888888888888", {
        findBookingByAccessToken: async () => baseSessionData,
      })

      expect(res.success).toBe(true)
      expect(res.data?.counselor.fullName).toBe("Sarah Annisa, M.Psi., Psikolog")
      expect(res.data?.counselor.counselorTypeDisplay).toBe("Psikolog Klinis")
      expect(res.data?.counselor.specializations).toContain("Kecemasan")
      expect(res.data?.counselor.specializations).toContain("Burnout")
      expect(res.data?.schedule.formattedDate).toBe("Senin, 28 September 2026")
      expect(res.data?.schedule.timeRange).toBe("19:00 – 20:30 WIB")
    })
  })

  describe("US-16 & US-17: Dynamic Zoom Room Button Locking & Unlocking", () => {
    it("US-16: locks Zoom button when more than 10 minutes before session", () => {
      // 18:40 WIB -> 20 minutes before start
      const now = new Date("2026-09-28T18:40:00+07:00")
      const timeInfo = calculateSessionTimeInfo(
        baseSessionData.schedule.date,
        baseSessionData.schedule.startTime,
        baseSessionData.schedule.endTime,
        now
      )

      expect(timeInfo.state).toBe("UPCOMING_LOCKED")
      expect(timeInfo.isZoomActive).toBe(false)
      expect(timeInfo.msUntilUnlock).toBe(10 * 60 * 1000)

      const countdown = getSessionCountdown(timeInfo, now)
      expect(countdown.hours).toBe(0)
      expect(countdown.minutes).toBe(20)
      expect(countdown.formatted).toBe("00:20:00")
      expect(countdown.label).toBe("Sesi dimulai dalam")
    })

    it("US-17: unlocks Zoom button exactly 10 minutes before session start", () => {
      // 18:50 WIB -> exactly 10 minutes before start
      const now = new Date("2026-09-28T18:50:00+07:00")
      const timeInfo = calculateSessionTimeInfo(
        baseSessionData.schedule.date,
        baseSessionData.schedule.startTime,
        baseSessionData.schedule.endTime,
        now
      )

      expect(timeInfo.state).toBe("ROOM_OPEN_PREPARING")
      expect(timeInfo.isZoomActive).toBe(true)
      expect(timeInfo.msUntilUnlock).toBe(0)
    })

    it("keeps Zoom button active while session is underway (e.g. 19:15 WIB)", () => {
      const now = new Date("2026-09-28T19:15:00+07:00")
      const timeInfo = calculateSessionTimeInfo(
        baseSessionData.schedule.date,
        baseSessionData.schedule.startTime,
        baseSessionData.schedule.endTime,
        now
      )

      expect(timeInfo.state).toBe("IN_PROGRESS")
      expect(timeInfo.isZoomActive).toBe(true)
      expect(timeInfo.msUntilEnd).toBe(75 * 60 * 1000)
    })

    it("locks Zoom button and marks as ended once past 20:30 WIB", () => {
      const now = new Date("2026-09-28T20:35:00+07:00")
      const timeInfo = calculateSessionTimeInfo(
        baseSessionData.schedule.date,
        baseSessionData.schedule.startTime,
        baseSessionData.schedule.endTime,
        now
      )

      expect(timeInfo.state).toBe("ENDED")
      expect(timeInfo.isZoomActive).toBe(false)
    })
  })

  describe("US-24: Fulfillment Pending Fallback (No Zoom Link Yet)", () => {
    it("handles booking where Zoom fulfillment has not produced a link yet", async () => {
      const pendingData: SessionPageData = {
        ...baseSessionData,
        booking: {
          ...baseSessionData.booking,
          zoomJoinUrl: null,
          zoomMeetingId: null,
        },
      }

      const res = await getSessionByTokenAction("tok_test_session_pending", {
        findBookingByAccessToken: async () => pendingData,
      })

      expect(res.success).toBe(true)
      expect(res.data?.booking.status).toBe("confirmed")
      expect(res.data?.booking.zoomJoinUrl).toBeNull()
    })
  })

  describe("US-23: Invalid / Non-Existent Session Handling", () => {
    it("returns error for unknown token to allow warm branded 404 guidance", async () => {
      const res = await getSessionByTokenAction("invalid_random_token_999", {
        findBookingByAccessToken: async () => null,
      })

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })
  })
})
