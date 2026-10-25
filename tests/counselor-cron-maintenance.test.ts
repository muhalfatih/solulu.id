import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/db"
import {
  counselors,
  schedules,
  counselorWeeklyTemplates,
} from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import {
  saveCounselorWeeklyTemplates,
  maintainAutomaticScheduleBuffers,
} from "@/lib/schedules/template"
import {
  handleCronRequest,
} from "@/lib/cron/handler"
import {
  GET as cleanupGetHandler,
  POST as cleanupPostHandler,
} from "@/app/api/cron/cleanup-slots/route"

describe("Issue 04: Cron Maintenance & Weekly Buffer Extension", () => {
  let testCounselorId: string
  let originalScheduleMode: "manual" | "automatic"
  let originalIsActive: boolean
  const baseTestMonday = "2026-11-02" // Clean test window [2026-11-02 to 2026-12-14]
  const cleanEndWindow = "2026-12-14"

  beforeAll(async () => {
    // 1. Find existing counselor in database
    const existingCounselors = await db.select().from(counselors).limit(1)
    if (existingCounselors.length === 0) {
      throw new Error("No counselor found in database to run tests against.")
    }

    testCounselorId = existingCounselors[0].id
    originalScheduleMode = existingCounselors[0].scheduleMode
    originalIsActive = existingCounselors[0].isActive

    // 2. Clean up test window schedules & templates
    await db
      .delete(counselorWeeklyTemplates)
      .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.counselorId, testCounselorId),
          gte(schedules.date, baseTestMonday),
          lte(schedules.date, cleanEndWindow)
        )
      )
  })

  afterAll(async () => {
    if (testCounselorId) {
      // Restore counselor original properties
      await db
        .update(counselors)
        .set({
          scheduleMode: originalScheduleMode,
          isActive: originalIsActive,
        })
        .where(eq(counselors.id, testCounselorId))

      // Clean up test schedules and templates
      await db
        .delete(counselorWeeklyTemplates)
        .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

      await db
        .delete(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, baseTestMonday),
            lte(schedules.date, cleanEndWindow)
          )
        )
    }
  })

  describe("1. Automatic Counselor Scanning and Filtering", () => {
    it("skips counselors who are in manual mode", async () => {
      // Set test counselor to manual mode
      await db
        .update(counselors)
        .set({ scheduleMode: "manual", isActive: true })
        .where(eq(counselors.id, testCounselorId))

      const result = await maintainAutomaticScheduleBuffers({
        referenceDate: baseTestMonday,
        counselorId: testCounselorId,
      })

      expect(result.success).toBe(true)
      expect(result.processedCounselorsCount).toBe(0)
      expect(result.totalCreatedSlots).toBe(0)
    })

    it("skips counselors who are inactive even if scheduleMode is automatic", async () => {
      // Set test counselor to inactive
      await db
        .update(counselors)
        .set({ scheduleMode: "automatic", isActive: false })
        .where(eq(counselors.id, testCounselorId))

      const result = await maintainAutomaticScheduleBuffers({
        referenceDate: baseTestMonday,
        counselorId: testCounselorId,
      })

      expect(result.success).toBe(true)
      expect(result.processedCounselorsCount).toBe(0)
      expect(result.totalCreatedSlots).toBe(0)
    })

    it("scans and processes counselors who have scheduleMode = 'automatic' AND isActive = true", async () => {
      // Configure 10 recurring template slots (SLA compliant)
      const templateSlots = [
        { dayOfWeek: 1, slotIndex: 1, isActive: true },
        { dayOfWeek: 1, slotIndex: 2, isActive: true },
        { dayOfWeek: 2, slotIndex: 3, isActive: true },
        { dayOfWeek: 2, slotIndex: 4, isActive: true },
        { dayOfWeek: 3, slotIndex: 5, isActive: true },
        { dayOfWeek: 3, slotIndex: 6, isActive: true },
        { dayOfWeek: 4, slotIndex: 1, isActive: true },
        { dayOfWeek: 4, slotIndex: 2, isActive: true },
        { dayOfWeek: 5, slotIndex: 6, isActive: true },
        { dayOfWeek: 5, slotIndex: 7, isActive: true },
      ]
      await saveCounselorWeeklyTemplates(testCounselorId, templateSlots)

      // Set counselor to active and automatic mode
      await db
        .update(counselors)
        .set({ scheduleMode: "automatic", isActive: true })
        .where(eq(counselors.id, testCounselorId))

      const result = await maintainAutomaticScheduleBuffers({
        referenceDate: baseTestMonday,
        counselorId: testCounselorId,
      })

      expect(result.success).toBe(true)
      expect(result.processedCounselorsCount).toBe(1)
      expect(result.totalCreatedSlots).toBe(40) // 10 slots * 4 weeks
      expect(result.counselorReports).toHaveLength(1)
      expect(result.counselorReports[0].counselorId).toBe(testCounselorId)
      expect(result.counselorReports[0].createdCount).toBe(40)

      // Verify physical rows in PostgreSQL
      const dbSlots = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-02"),
            lte(schedules.date, "2026-11-29")
          )
        )
      expect(dbSlots).toHaveLength(40)
    })
  })

  describe("2. Buffer Extension Across Rolling Weeks", () => {
    it("extends the buffer by generating slots for the newly rolled-in week", async () => {
      // Currently, weeks 1 to 4 (Nov 02 - Nov 29) are materialized.
      // Now, simulate time advancing 1 week forward to Monday Nov 09 (Week 2 reference date).
      // The 4-week window from Nov 09 is: Nov 09 - Dec 06 (covering Week 2, 3, 4, 5).
      // Week 5 (Nov 30 - Dec 06) has not been materialized yet.
      const week2Monday = "2026-11-09"

      const extensionResult = await maintainAutomaticScheduleBuffers({
        referenceDate: week2Monday,
        counselorId: testCounselorId,
      })

      expect(extensionResult.success).toBe(true)
      expect(extensionResult.processedCounselorsCount).toBe(1)
      // Exactly 10 slots created for Week 5
      expect(extensionResult.totalCreatedSlots).toBe(10)

      // Verify Week 5 slots now exist in PostgreSQL
      const week5Slots = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-30"),
            lte(schedules.date, "2026-12-06"),
            eq(schedules.status, "available")
          )
        )
      expect(week5Slots).toHaveLength(10)

      // Total slots from Nov 02 to Dec 06 should now be 50 (40 original + 10 new)
      const totalSlots = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-02"),
            lte(schedules.date, "2026-12-06")
          )
        )
      expect(totalSlots).toHaveLength(50)
    })
  })

  describe("3. Strict Idempotency Guarantee", () => {
    it("produces 0 duplicate slots when executed repeatedly with the same reference date", async () => {
      const week2Monday = "2026-11-09"

      // Run second time with same date
      const secondRun = await maintainAutomaticScheduleBuffers({
        referenceDate: week2Monday,
        counselorId: testCounselorId,
      })

      expect(secondRun.success).toBe(true)
      expect(secondRun.totalCreatedSlots).toBe(0)
      expect(secondRun.totalUpdatedSlots).toBe(0)

      // Check slot total in PostgreSQL has not grown
      const totalSlots = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-02"),
            lte(schedules.date, "2026-12-06")
          )
        )
      expect(totalSlots).toHaveLength(50)
    })
  })

  describe("4. Absolute Booking & Leave Protection in Cron Maintenance", () => {
    it("never cancels or modifies booked, reserved, or leave slots during cron maintenance", async () => {
      // 1. Mark a Week 3 slot (Nov 16, slot 1) as 'booked'
      const bookedTarget = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, "2026-11-16"),
            eq(schedules.slotIndex, 1)
          )
        )
      expect(bookedTarget).toHaveLength(1)
      const bookedId = bookedTarget[0].id

      await db
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, bookedId))

      // 2. Mark a Week 3 slot (Nov 16, slot 2) as 'reserved'
      const reservedTarget = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, "2026-11-16"),
            eq(schedules.slotIndex, 2)
          )
        )
      expect(reservedTarget).toHaveLength(1)
      const reservedId = reservedTarget[0].id

      await db
        .update(schedules)
        .set({ status: "reserved" })
        .where(eq(schedules.id, reservedId))

      // 3. Mark a Week 4 slot (Nov 24, slot 3) as 'is_leave: true'
      const leaveTarget = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, "2026-11-24"),
            eq(schedules.slotIndex, 3)
          )
        )
      expect(leaveTarget).toHaveLength(1)
      const leaveId = leaveTarget[0].id

      await db
        .update(schedules)
        .set({
          isLeave: true,
          leaveReason: "Cuti Menghadiri Konferensi Psikologi Klinis",
          status: "cancelled",
        })
        .where(eq(schedules.id, leaveId))

      // 4. Counselor modifies blueprint template and deactivates Monday slot 1 & 2
      await saveCounselorWeeklyTemplates(testCounselorId, [
        { dayOfWeek: 1, slotIndex: 1, isActive: false },
        { dayOfWeek: 1, slotIndex: 2, isActive: false },
      ])

      // 5. Run cron maintenance
      const maintenanceRun = await maintainAutomaticScheduleBuffers({
        referenceDate: "2026-11-09",
        counselorId: testCounselorId,
      })

      expect(maintenanceRun.success).toBe(true)
      expect(maintenanceRun.totalPreservedBookedSlots).toBeGreaterThanOrEqual(2)
      expect(maintenanceRun.totalPreservedLeaveSlots).toBeGreaterThanOrEqual(1)

      // Verify booked slot status remains intact
      const [checkBooked] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, bookedId))
      expect(checkBooked.status).toBe("booked")

      // Verify reserved slot status remains intact
      const [checkReserved] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, reservedId))
      expect(checkReserved.status).toBe("reserved")

      // Verify leave slot remains leave and is NOT flipped back to 'available'
      const [checkLeave] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, leaveId))
      expect(checkLeave.isLeave).toBe(true)
      expect(checkLeave.status).not.toBe("available")
    })
  })

  describe("5. Cron Pipeline Route Integration (/api/cron/cleanup-slots)", () => {
    it("rejects unauthorized HTTP requests with 401", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup-slots", {
        method: "GET",
      })

      const res = await cleanupGetHandler(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toContain("Unauthorized")
    })

    it("runs both slot cleanup and recurring schedule maintenance by default", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup-slots", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-cron-secret",
        },
      })

      let cleanupCalled = false
      let maintenanceCalled = false

      const res = await handleCronRequest(req, {
        cleanupFn: async () => {
          cleanupCalled = true
          return {
            success: true,
            releasedSlotsCount: 2,
            cancelledBookingsCount: 1,
            expiredTransactionsCount: 1,
            vouchersRolledBackCount: 0,
            autoArchivedSessionsCount: 0,
          }
        },
        maintenanceFn: async () => {
          maintenanceCalled = true
          return {
            success: true,
            processedCounselorsCount: 3,
            totalCreatedSlots: 15,
            totalUpdatedSlots: 0,
            totalPreservedBookedSlots: 2,
            totalPreservedLeaveSlots: 1,
            counselorReports: [],
          }
        },
      })

      expect(res.status).toBe(200)
      expect(cleanupCalled).toBe(true)
      expect(maintenanceCalled).toBe(true)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.releasedSlotsCount).toBe(2)
      expect(body.data.recurringMaintenance).toBeDefined()
      expect(body.data.recurringMaintenance.success).toBe(true)
      expect(body.data.recurringMaintenance.processedCounselorsCount).toBe(3)
      expect(body.data.recurringMaintenance.totalCreatedSlots).toBe(15)
    })

    it("supports granular action parameter (?action=maintenance)", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup-slots?action=maintenance", {
        method: "GET",
        headers: {
          Authorization: "Bearer test-cron-secret",
        },
      })

      let cleanupCalled = false
      let maintenanceCalled = false

      const res = await handleCronRequest(req, {
        cleanupFn: async () => {
          cleanupCalled = true
          return {
            success: true,
            releasedSlotsCount: 0,
            cancelledBookingsCount: 0,
            expiredTransactionsCount: 0,
            vouchersRolledBackCount: 0,
            autoArchivedSessionsCount: 0,
          }
        },
        maintenanceFn: async () => {
          maintenanceCalled = true
          return {
            success: true,
            processedCounselorsCount: 2,
            totalCreatedSlots: 20,
            totalUpdatedSlots: 0,
            totalPreservedBookedSlots: 0,
            totalPreservedLeaveSlots: 0,
            counselorReports: [],
          }
        },
      })

      expect(res.status).toBe(200)
      expect(cleanupCalled).toBe(false)
      expect(maintenanceCalled).toBe(true)

      const body = await res.json()
      expect(body.data.recurringMaintenance.processedCounselorsCount).toBe(2)
    })
  })
})
