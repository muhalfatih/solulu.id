import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/db"
import {
  counselors,
  schedules,
  bookings,
  counselorWeeklyTemplates,
  scheduleModeEnum,
} from "@/db/schema"
import { eq, and, gte, lte, inArray } from "drizzle-orm"
import {
  materializeCounselorSlots,
  getMaterializationDates,
  getMondayOfWIBWeek,
  saveCounselorWeeklyTemplates,
  getCounselorTemplateMatrix,
} from "@/lib/schedules/template"
import { FIXED_SLOTS } from "@/lib/schedules/slots"

describe("Issue 01: Counselor Weekly Templates Schema & 4-Week Rolling Materializer", () => {
  let testCounselorId: string
  const referenceMonday = "2026-11-02" // Future clean test date (Monday)

  beforeAll(async () => {
    // 1. Find or verify test counselor
    const existingCounselors = await db.select().from(counselors).limit(1)
    if (existingCounselors.length > 0) {
      testCounselorId = existingCounselors[0].id
    } else {
      throw new Error("No counselor found in database to run tests against.")
    }

    // Clean up any test schedules or templates in the test window [2026-11-02 to 2026-11-29]
    await db
      .delete(counselorWeeklyTemplates)
      .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.counselorId, testCounselorId),
          gte(schedules.date, referenceMonday),
          lte(schedules.date, "2026-11-29")
        )
      )
  })

  afterAll(async () => {
    // Clean up created test schedules and templates
    if (testCounselorId) {
      await db
        .delete(counselorWeeklyTemplates)
        .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

      await db
        .delete(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, referenceMonday),
            lte(schedules.date, "2026-11-29")
          )
        )
    }
  })

  describe("1. Drizzle ORM Schema & Constraints", () => {
    it("defines counselor_weekly_templates table with required columns", () => {
      expect(counselorWeeklyTemplates).toBeDefined()
      expect(counselorWeeklyTemplates.id).toBeDefined()
      expect(counselorWeeklyTemplates.counselorId).toBeDefined()
      expect(counselorWeeklyTemplates.dayOfWeek).toBeDefined()
      expect(counselorWeeklyTemplates.slotIndex).toBeDefined()
      expect(counselorWeeklyTemplates.isActive).toBeDefined()
    })

    it("defines schedule_mode_enum with manual and automatic options", () => {
      expect(scheduleModeEnum).toBeDefined()
      expect(scheduleModeEnum.enumValues).toEqual(["manual", "automatic"])
    })

    it("verifies schedule_mode column on counselors table with default manual", () => {
      expect(counselors.scheduleMode).toBeDefined()
      expect(counselors.scheduleMode.default).toBe("manual")
    })
  })

  describe("2. Rolling Materializer Date & Window Calculation", () => {
    it("calculates Monday of WIB week accurately", () => {
      // Monday stays Monday
      expect(getMondayOfWIBWeek("2026-11-02")).toBe("2026-11-02")
      // Wednesday returns previous Monday
      expect(getMondayOfWIBWeek("2026-11-04")).toBe("2026-11-02")
      // Sunday returns previous Monday
      expect(getMondayOfWIBWeek("2026-11-08")).toBe("2026-11-02")
      // Next Monday returns next Monday
      expect(getMondayOfWIBWeek("2026-11-09")).toBe("2026-11-09")
    })

    it("generates exactly 28 days for a 4-week window (Senin to Minggu)", () => {
      const { dates, startDate, endDate } = getMaterializationDates(referenceMonday, 4)
      expect(dates).toHaveLength(28)
      expect(startDate).toBe("2026-11-02")
      expect(endDate).toBe("2026-11-29")

      // First day: Senin (1)
      expect(dates[0].dayOfWeek).toBe(1)
      expect(dates[0].date).toBe("2026-11-02")

      // Day 7: Minggu (7)
      expect(dates[6].dayOfWeek).toBe(7)
      expect(dates[6].date).toBe("2026-11-08")

      // Day 8: Next Monday (1)
      expect(dates[7].dayOfWeek).toBe(1)
      expect(dates[7].date).toBe("2026-11-09")

      // Day 28: Final Sunday (7)
      expect(dates[27].dayOfWeek).toBe(7)
      expect(dates[27].date).toBe("2026-11-29")
    })
  })

  describe("3. 4-Week Physical Slot Materialization in PostgreSQL", () => {
    it("materializes physical schedule rows for 4 weeks based on template", async () => {
      // Setup: 10 active recurring slots (Meeting 10 slots SLA target)
      // Senin (day 1): slot 1 & 2
      // Selasa (day 2): slot 3 & 4
      // Rabu (day 3): slot 5 & 6
      // Kamis (day 4): slot 1 & 2
      // Jumat (day 5): slot 6 & 7
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

      const templateMatrix = await getCounselorTemplateMatrix(testCounselorId)
      expect(templateMatrix.activeCount).toBe(10)
      expect(templateMatrix.matrix[1][1]).toBe(true)
      expect(templateMatrix.matrix[1][2]).toBe(true)
      expect(templateMatrix.matrix[1][3]).toBe(false)

      // Execute materialization for 4 weeks starting from referenceMonday
      const result = await materializeCounselorSlots(testCounselorId, 4, {
        referenceDate: referenceMonday,
      })

      expect(result.success).toBe(true)
      expect(result.weeksAhead).toBe(4)
      expect(result.createdCount).toBe(40) // 10 slots * 4 weeks = 40 rows

      // Query database directly to confirm physical rows
      const dbSchedules = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-02"),
            lte(schedules.date, "2026-11-29"),
            eq(schedules.status, "available")
          )
        )

      expect(dbSchedules).toHaveLength(40)
      for (const row of dbSchedules) {
        expect(row.status).toBe("available")
        expect(row.isLeave).toBe(false)
        expect(row.startTime).toBeDefined()
        expect(row.endTime).toBeDefined()
      }
    })

    it("is strictly idempotent: repeated executions produce no duplicate rows", async () => {
      const secondRun = await materializeCounselorSlots(testCounselorId, 4, {
        referenceDate: referenceMonday,
      })

      expect(secondRun.success).toBe(true)
      expect(secondRun.createdCount).toBe(0)
      expect(secondRun.updatedCount).toBe(0)

      const dbSchedules = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, "2026-11-02"),
            lte(schedules.date, "2026-11-29"),
            eq(schedules.status, "available")
          )
        )

      expect(dbSchedules).toHaveLength(40)
    })
  })

  describe("4. Absolute Booking Protection Guarantee", () => {
    it("never overwrites, deletes, or cancels slots that are booked or reserved", async () => {
      // Find one schedule on week 2 (2026-11-09, slot 1) and simulate a booked session
      const targetDate = "2026-11-09"
      const targetSlotIndex = 1

      const targetRows = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, targetDate),
            eq(schedules.slotIndex, targetSlotIndex)
          )
        )
      expect(targetRows).toHaveLength(1)
      const bookedScheduleId = targetRows[0].id

      // Update schedule to 'booked'
      await db
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, bookedScheduleId))

      // Also mark slot 2 on same day as 'reserved' (hold window)
      const reservedTarget = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, targetDate),
            eq(schedules.slotIndex, 2)
          )
        )
      expect(reservedTarget).toHaveLength(1)
      const reservedScheduleId = reservedTarget[0].id

      await db
        .update(schedules)
        .set({ status: "reserved" })
        .where(eq(schedules.id, reservedScheduleId))

      // Counselor updates their template and DEACTIVATES Monday slots 1 & 2!
      await saveCounselorWeeklyTemplates(testCounselorId, [
        { dayOfWeek: 1, slotIndex: 1, isActive: false },
        { dayOfWeek: 1, slotIndex: 2, isActive: false },
      ])

      // Re-run materializer
      const updateResult = await materializeCounselorSlots(testCounselorId, 4, {
        referenceDate: referenceMonday,
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.preservedBookedCount).toBeGreaterThanOrEqual(2)

      // Verify booked slot remained strictly intact
      const verifyBooked = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, bookedScheduleId))
      expect(verifyBooked[0].status).toBe("booked")

      // Verify reserved slot remained strictly intact
      const verifyReserved = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, reservedScheduleId))
      expect(verifyReserved[0].status).toBe("reserved")

      // However, unbooked Monday slots on week 1, week 3, week 4 were safely cancelled
      const unbookedMondaySlot = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, "2026-11-16"), // Week 3
            eq(schedules.slotIndex, 1)
          )
        )
      expect(unbookedMondaySlot[0].status).toBe("cancelled")
    })
  })

  describe("5. Leave Priority Guarantee (is_leave: true)", () => {
    it("skips dates marked with is_leave: true and never forces them to available", async () => {
      // Simulate counselor taking leave on Wednesday of week 2: 2026-11-11
      const leaveDate = "2026-11-11"
      const leaveSlotIndex = 5 // Slot 5 is active in template

      // Check if slot exists or create leave record
      const existing = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, leaveDate),
            eq(schedules.slotIndex, leaveSlotIndex)
          )
        )

      if (existing.length > 0) {
        await db
          .update(schedules)
          .set({
            isLeave: true,
            leaveReason: "Izin Cuti Mengikuti Seminar Psikologi",
            status: "cancelled",
          })
          .where(eq(schedules.id, existing[0].id))
      } else {
        await db.insert(schedules).values({
          counselorId: testCounselorId,
          date: leaveDate,
          slotIndex: leaveSlotIndex,
          startTime: "16:00:00",
          endTime: "18:00:00",
          status: "cancelled",
          isLeave: true,
          leaveReason: "Izin Cuti Mengikuti Seminar Psikologi",
        })
      }

      // Re-run materializer
      const leaveResult = await materializeCounselorSlots(testCounselorId, 4, {
        referenceDate: referenceMonday,
      })

      expect(leaveResult.success).toBe(true)
      expect(leaveResult.preservedLeaveCount).toBeGreaterThanOrEqual(1)

      // Query database directly: the leave slot MUST NOT have been flipped to 'available'
      const checkLeave = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, leaveDate),
            eq(schedules.slotIndex, leaveSlotIndex)
          )
        )

      expect(checkLeave[0].isLeave).toBe(true)
      expect(checkLeave[0].leaveReason).toBe("Izin Cuti Mengikuti Seminar Psikologi")
      expect(checkLeave[0].status).not.toBe("available")
    })
  })

  describe("6. Slot Reactivation", () => {
    it("reactivates previously cancelled slots when they are re-added to template", async () => {
      // Find a cancelled slot on week 3 Monday
      const week3Monday = "2026-11-16"
      const cancelledRows = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, week3Monday),
            eq(schedules.slotIndex, 1),
            eq(schedules.status, "cancelled")
          )
        )
      expect(cancelledRows).toHaveLength(1)

      // Re-activate Monday slot 1 in template
      await saveCounselorWeeklyTemplates(testCounselorId, [
        { dayOfWeek: 1, slotIndex: 1, isActive: true },
      ])

      // Run materializer
      const reactivateResult = await materializeCounselorSlots(testCounselorId, 4, {
        referenceDate: referenceMonday,
      })

      expect(reactivateResult.success).toBe(true)
      expect(reactivateResult.updatedCount).toBeGreaterThanOrEqual(1)

      // Verify that week 3 Monday slot 1 is back to 'available'
      const updatedSlot = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            eq(schedules.date, week3Monday),
            eq(schedules.slotIndex, 1)
          )
        )

      expect(updatedSlot[0].status).toBe("available")
    })
  })
})
