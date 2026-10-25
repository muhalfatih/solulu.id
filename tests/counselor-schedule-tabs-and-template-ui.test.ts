import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/db"
import {
  counselors,
  schedules,
  counselorWeeklyTemplates,
} from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import {
  getCounselorWeeklyGridAction,
  getCounselorTemplateAction,
  saveCounselorTemplateAction,
  toggleScheduleModeAction,
  toggleSlotAvailabilityAction,
} from "@/app/counselor/schedule/actions"
import { FIXED_SLOTS } from "@/lib/schedules/slots"
import { TEMPLATE_DAYS } from "@/lib/schedules/template"
import type { CounselorAuthContext } from "@/lib/counselor/types"
import { MIN_WEEKLY_SLOTS_TARGET } from "@/lib/schedules/commitment"

describe("Issue 03: Counselor Schedule Tabs & Template UI Integration", () => {
  let testCounselorId: string
  let counselorAuth: CounselorAuthContext
  const testMonday = "2026-11-16" // Future test Monday
  const testSunday = "2026-11-22"

  beforeAll(async () => {
    // 1. Fetch real counselor for testing (Strict Zero-Mock Policy)
    const existing = await db.select().from(counselors).limit(1)
    if (existing.length === 0) {
      throw new Error("No counselor found in PostgreSQL database.")
    }

    testCounselorId = existing[0].id
    counselorAuth = {
      id: "test-auth-counselor-uuid",
      counselorId: testCounselorId,
      app_metadata: { role: "counselor" },
      user_metadata: {
        role: "counselor",
        full_name: existing[0].fullName,
      },
    }

    // Clean templates and test window schedules
    await db
      .delete(counselorWeeklyTemplates)
      .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.counselorId, testCounselorId),
          gte(schedules.date, testMonday),
          lte(schedules.date, testSunday)
        )
      )

    await db
      .update(counselors)
      .set({ scheduleMode: "manual", weeklySlotTarget: 10 })
      .where(eq(counselors.id, testCounselorId))
  })

  afterAll(async () => {
    // Clean up
    await db
      .delete(counselorWeeklyTemplates)
      .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

    await db
      .update(counselors)
      .set({ scheduleMode: "manual" })
      .where(eq(counselors.id, testCounselorId))
  })

  describe("1. Dual Tab Data Contracts (Weekly Calendar & Template Matrix)", () => {
    it("provides complete weekly grid contract with scheduleMode awareness for Tab 1", async () => {
      const gridRes = await getCounselorWeeklyGridAction(testMonday, {
        currentUser: counselorAuth,
      })

      expect(gridRes.success).toBe(true)
      expect(gridRes.data).toBeDefined()
      expect(gridRes.data?.scheduleMode).toBe("manual")
      expect(gridRes.data?.fixedSlots).toHaveLength(7)
      expect(gridRes.data?.weekDates).toHaveLength(7)
      expect(gridRes.data?.commitment.target).toBe(MIN_WEEKLY_SLOTS_TARGET)
    })

    it("provides complete 7x7 matrix contract (49 slots) with commitment progress for Tab 2", async () => {
      const templateRes = await getCounselorTemplateAction({
        currentUser: counselorAuth,
      })

      expect(templateRes.success).toBe(true)
      expect(templateRes.data).toBeDefined()
      expect(templateRes.data?.scheduleMode).toBe("manual")
      expect(templateRes.data?.slots).toHaveLength(49)
      expect(templateRes.data?.days).toHaveLength(7)
      expect(templateRes.data?.fixedSlots).toHaveLength(7)
      expect(templateRes.data?.activeCount).toBe(0)
      expect(templateRes.data?.isTargetMet).toBe(false)
      expect(templateRes.data?.remainingSlots).toBe(10)
      expect(templateRes.data?.percentage).toBe(0)
    })
  })

  describe("2. Template Quota Guardrails & Automatic Mode Gating (< 10 vs >= 10 slots)", () => {
    it("allows drafting sub-quota templates (< 10 slots) when in manual mode", async () => {
      // 5 slots: Senin slots 1..5
      const draftSlots = [1, 2, 3, 4, 5].map((s) => ({
        dayOfWeek: 1,
        slotIndex: s,
        isActive: true,
      }))

      const saveRes = await saveCounselorTemplateAction(
        {
          scheduleMode: "manual",
          slots: draftSlots,
        },
        { currentUser: counselorAuth }
      )

      expect(saveRes.success).toBe(true)
      expect(saveRes.data?.activeCount).toBe(5)
      expect(saveRes.data?.scheduleMode).toBe("manual")

      // Verify template state in getCounselorTemplateAction
      const checkRes = await getCounselorTemplateAction({ currentUser: counselorAuth })
      expect(checkRes.data?.activeCount).toBe(5)
      expect(checkRes.data?.isTargetMet).toBe(false)
      expect(checkRes.data?.remainingSlots).toBe(5)
      expect(checkRes.data?.percentage).toBe(50)
    })

    it("strictly blocks enabling automatic mode while active slot count is < 10", async () => {
      // Attempt to toggle to automatic mode
      const toggleRes = await toggleScheduleModeAction(
        { scheduleMode: "automatic" },
        { currentUser: counselorAuth }
      )

      expect(toggleRes.success).toBe(false)
      expect(toggleRes.error).toContain("10")
    })

    it("successfully enables automatic mode and triggers rolling materialization when >= 10 slots are configured", async () => {
      // 11 active slots (Senin slots 1..5 + Selasa slots 1..6)
      const elevenSlots = [
        ...[1, 2, 3, 4, 5].map((s) => ({ dayOfWeek: 1, slotIndex: s, isActive: true })),
        ...[1, 2, 3, 4, 5, 6].map((s) => ({ dayOfWeek: 2, slotIndex: s, isActive: true })),
      ]

      const saveRes = await saveCounselorTemplateAction(
        {
          scheduleMode: "automatic",
          slots: elevenSlots,
        },
        {
          currentUser: counselorAuth,
          referenceDate: testMonday,
        }
      )

      expect(saveRes.success).toBe(true)
      expect(saveRes.data?.activeCount).toBe(11)
      expect(saveRes.data?.scheduleMode).toBe("automatic")
      expect(saveRes.data?.materialized).toBeDefined()
      expect(saveRes.data?.materialized?.createdCount).toBeGreaterThanOrEqual(11)

      // Verify Weekly Grid in Tab 1 now reports scheduleMode === 'automatic'
      const gridRes = await getCounselorWeeklyGridAction(testMonday, {
        currentUser: counselorAuth,
      })
      expect(gridRes.data?.scheduleMode).toBe("automatic")
    })
  })

  describe("3. Weekly Calendar Override Separation from Main Template Blueprint", () => {
    it("allows ad-hoc slot overrides on the weekly calendar without mutating the blueprint template in database", async () => {
      // Slot 1 on testMonday should be available due to template materialization
      // Counselor overrides it by toggling it OFF on the weekly calendar
      const toggleCalendarRes = await toggleSlotAvailabilityAction(
        { date: testMonday, slotIndex: 1 },
        { currentUser: counselorAuth }
      )

      expect(toggleCalendarRes.success).toBe(true)
      expect(toggleCalendarRes.data?.status).toBe("cancelled")

      // Verify the weekly calendar reflects the override (status: cancelled)
      const gridRes = await getCounselorWeeklyGridAction(testMonday, {
        currentUser: counselorAuth,
      })
      const cell = gridRes.data?.grid[1]?.[testMonday]
      expect(cell?.status).toBe("cancelled")

      // CRITICAL: Verify blueprint template in Tab 2 is STILL active (untouched blueprint)
      const templateRes = await getCounselorTemplateAction({
        currentUser: counselorAuth,
      })
      expect(templateRes.data?.matrix[1]?.[1]).toBe(true) // Day 1 (Senin), Slot 1 is still true!
      expect(templateRes.data?.activeCount).toBe(11) // Total blueprint slots unchanged!
    })

    it("switching from automatic back to manual mode preserves all existing calendar slots", async () => {
      const toggleModeRes = await toggleScheduleModeAction(
        { scheduleMode: "manual" },
        { currentUser: counselorAuth }
      )

      expect(toggleModeRes.success).toBe(true)
      expect(toggleModeRes.data?.scheduleMode).toBe("manual")

      // Physical slots in test window still exist in DB
      const gridRes = await getCounselorWeeklyGridAction(testMonday, {
        currentUser: counselorAuth,
      })
      expect(gridRes.data?.scheduleMode).toBe("manual")

      // Slots that were created remain available
      const tuesdaySlot1 = gridRes.data?.grid[1]?.[`${testMonday.slice(0, 8)}17`] // Tuesday is 2026-11-17
      expect(tuesdaySlot1?.status).toBe("available")
    })
  })
})
