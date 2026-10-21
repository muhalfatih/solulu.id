import { describe, it, expect, beforeAll } from "vitest"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, sessionReports } from "@/db/schema"
import {
  counselorAdmitClientAction,
  counselorUnadmitClientAction,
  recordSessionTimerAction,
  submitSessionReportAction,
  getSessionReportAction,
} from "@/app/counselor/actions"
import { getOperatorSlotMatrixAction } from "@/app/operator/actions"
import type { CounselorAuthContext } from "@/lib/counselor/types"

describe("Features: Counselor Admit, Standalone Auto-Admit via Timer, and Timer Reports", () => {
  let realBookingId: string
  let realCounselorId: string
  let mockCounselorAuth: CounselorAuthContext

  const mockOtherCounselorAuth: CounselorAuthContext = {
    id: "99999999-9999-9999-9999-999999999999",
    counselorId: "99999999-9999-9999-9999-999999999999",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const testOperatorAuth = {
    id: "test-operator-id",
    app_metadata: { role: "operator" },
    user_metadata: { role: "operator", email: "operator@solulu.id" },
  }

  beforeAll(async () => {
    // Pick an existing real booking from the database
    const existing = await db
      .select({ id: bookings.id, counselorId: bookings.counselorId })
      .from(bookings)
      .limit(1)

    expect(existing.length).toBeGreaterThan(0)
    realBookingId = existing[0].id
    realCounselorId = existing[0].counselorId

    mockCounselorAuth = {
      id: "test-counselor-user",
      counselorId: realCounselorId,
      app_metadata: { role: "counselor" },
      user_metadata: { role: "counselor" },
    }
  }, 35000)

  describe("1. Counselor Admit & Unadmit Actions", () => {
    it("allows counselor to admit client and updates operator_admitted_at in DB", async () => {
      // 1. Admit client as counselor
      const admitRes = await counselorAdmitClientAction(
        { bookingId: realBookingId },
        { currentUser: mockCounselorAuth }
      )

      expect(admitRes.success).toBe(true)
      expect(admitRes.data?.admittedAt).toBeDefined()

      // Verify in DB
      const [persisted] = await db
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, realBookingId))

      expect(persisted.operatorAdmittedAt).not.toBeNull()

      // 2. Unadmit client
      const unadmitRes = await counselorUnadmitClientAction(
        { bookingId: realBookingId },
        { currentUser: mockCounselorAuth }
      )

      expect(unadmitRes.success).toBe(true)

      const [reverted] = await db
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, realBookingId))

      expect(reverted.operatorAdmittedAt).toBeNull()
    }, 35000)

    it("prevents other counselor from admitting someone else's session", async () => {
      const res = await counselorAdmitClientAction(
        { bookingId: realBookingId },
        { currentUser: mockOtherCounselorAuth }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("tidak ditemukan atau bukan milik Anda")
    }, 35000)
  })

  describe("2. Private Zoom: Auto-Admit when Timer Starts", () => {
    it("automatically populates operator_admitted_at in bookings when timer metadata is recorded", async () => {
      // Reset operatorAdmittedAt to null first
      await db
        .update(bookings)
        .set({ operatorAdmittedAt: null })
        .where(eq(bookings.id, realBookingId))

      const startTime = new Date()
      const timerRes = await recordSessionTimerAction(
        realBookingId,
        {
          actualDurationMinutes: 0,
          timerStartedAt: startTime.toISOString(),
        },
        { currentUser: mockCounselorAuth }
      )

      expect(timerRes.success).toBe(true)

      // Verify that bookings.operatorAdmittedAt is now automatically populated
      const [updatedBooking] = await db
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, realBookingId))

      expect(updatedBooking.operatorAdmittedAt).not.toBeNull()
    }, 35000)
  })

  describe("3. Operator Slot Matrix: Pending Admit counts Breakout Rooms Only", () => {
    it("computes totalPendingAdmit for breakout_room sessions only", async () => {
      const matrixRes = await getOperatorSlotMatrixAction("2026-10-20", {
        currentUser: testOperatorAuth,
      })

      expect(matrixRes.summary).toBeDefined()
      expect(matrixRes.summary.totalPendingAdmit).toBeGreaterThanOrEqual(0)

      // Verify that all slots with standalone sessions don't force operator pending
      let manualBreakoutPendingCount = 0
      matrixRes.slots.forEach((slot) => {
        slot.sessions.forEach((s) => {
          if (!s.operatorAdmittedAt && s.zoomAllocationMode === "breakout_room") {
            manualBreakoutPendingCount++
          }
        })
      })

      expect(matrixRes.summary.totalPendingAdmit).toBe(manualBreakoutPendingCount)
    }, 35000)
  })

  describe("4. Clinical Session Report: Timer and Duration Recording", () => {
    it("saves and retrieves actualDurationMinutes, timerStartedAt, and timerStoppedAt", async () => {
      const timerStart = new Date("2026-10-20T14:02:00.000Z")
      const timerStop = new Date("2026-10-20T15:36:00.000Z")
      const duration = 94 // 94 minutes

      const submitRes = await submitSessionReportAction(
        {
          bookingId: realBookingId,
          attendanceStatus: "attended",
          mainIssue: "Kecemasan Karir & Stres Kerja",
          summary: "Klien mengeksplorasi kecemasan menjelang evaluasi kerja tahunan.",
          actionPlan: "Latihan teknik grounding 5-4-3-2-1 setiap kali merasa overthinking.",
          internalNotes: "Catatan klinis internal konselor.",
          actualDurationMinutes: duration,
          timerStartedAt: timerStart.toISOString(),
          timerStoppedAt: timerStop.toISOString(),
        },
        { currentUser: mockCounselorAuth }
      )

      expect(submitRes.success).toBe(true)
      expect(submitRes.data?.reportId).toBeDefined()

      // Query database directly to confirm persistence
      const [reportInDb] = await db
        .select({
          actualDurationMinutes: sessionReports.actualDurationMinutes,
          timerStartedAt: sessionReports.timerStartedAt,
          timerStoppedAt: sessionReports.timerStoppedAt,
        })
        .from(sessionReports)
        .where(eq(sessionReports.bookingId, realBookingId))

      expect(reportInDb.actualDurationMinutes).toBe(94)
      expect(reportInDb.timerStartedAt).toBeDefined()
      expect(reportInDb.timerStoppedAt).toBeDefined()

      // Also verify via getSessionReportAction
      const detailRes = await getSessionReportAction(realBookingId, {
        currentUser: mockCounselorAuth,
      })

      expect(detailRes.success).toBe(true)
      expect(detailRes.data?.actualDurationMinutes).toBe(94)
      expect(detailRes.data?.timerStartedAt).toBeDefined()
      expect(detailRes.data?.timerStoppedAt).toBeDefined()
      expect(detailRes.data?.booking.operatorAdmittedAt).toBeDefined()
    }, 35000)
  })
})
