import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/db"
import {
  counselors,
  schedules,
  counselorWeeklyTemplates,
} from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import {
  getCounselorTemplateAction,
  saveCounselorTemplateAction,
  toggleScheduleModeAction,
} from "@/app/counselor/schedule/actions"
import type { CounselorAuthContext } from "@/lib/counselor/types"
import { MIN_WEEKLY_SLOTS_TARGET } from "@/lib/schedules/commitment"

describe("Issue 02: Recurring Schedule Template Server Actions & Quota Validation", () => {
  let testCounselorId: string
  let counselorAuth: CounselorAuthContext
  const referenceMonday = "2026-11-09" // Clean future Monday test window
  const windowEnd = "2026-12-06" // 4 weeks later

  beforeAll(async () => {
    // 1. Find or verify test counselor
    const existing = await db.select().from(counselors).limit(1)
    if (existing.length === 0) {
      throw new Error("No counselor found in database to run tests against.")
    }

    testCounselorId = existing[0].id
    counselorAuth = {
      id: "test-auth-uuid",
      counselorId: testCounselorId,
      app_metadata: { role: "counselor" },
      user_metadata: {
        role: "counselor",
        full_name: existing[0].fullName,
      },
    }

    // Reset counselor to manual mode and standard 10 target
    await db
      .update(counselors)
      .set({ scheduleMode: "manual", weeklySlotTarget: 10 })
      .where(eq(counselors.id, testCounselorId))

    // Clean up test templates and schedules in test window
    await db
      .delete(counselorWeeklyTemplates)
      .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.counselorId, testCounselorId),
          gte(schedules.date, referenceMonday),
          lte(schedules.date, windowEnd)
        )
      )
  })

  afterAll(async () => {
    if (testCounselorId) {
      // Revert counselor mode to manual
      await db
        .update(counselors)
        .set({ scheduleMode: "manual" })
        .where(eq(counselors.id, testCounselorId))

      // Clean up templates and schedules in test window
      await db
        .delete(counselorWeeklyTemplates)
        .where(eq(counselorWeeklyTemplates.counselorId, testCounselorId))

      await db
        .delete(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, referenceMonday),
            lte(schedules.date, windowEnd)
          )
        )
    }
  })

  describe("1. getCounselorTemplateAction()", () => {
    it("rejects unauthorized requests when no counselor auth is provided", async () => {
      const res = await getCounselorTemplateAction({ currentUser: null })
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/akses ditolak/i)
    })

    it("fetches the complete 7x7 matrix (49 slots) and commitment metrics", async () => {
      const res = await getCounselorTemplateAction({ currentUser: counselorAuth })
      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      if (!res.data) return

      expect(res.data.counselorId).toBe(testCounselorId)
      expect(res.data.weeklySlotTarget).toBe(MIN_WEEKLY_SLOTS_TARGET)
      expect(res.data.scheduleMode).toBe("manual")
      expect(res.data.days).toHaveLength(7)
      expect(res.data.fixedSlots).toHaveLength(7)
      expect(res.data.slots).toHaveLength(49)

      // Initial state has 0 active slots
      expect(res.data.activeCount).toBe(0)
      expect(res.data.isTargetMet).toBe(false)
      expect(res.data.remainingSlots).toBe(10)
      expect(res.data.percentage).toBe(0)

      // Days info mapping
      expect(res.data.days[0]).toEqual({ dayOfWeek: 1, dayName: "Senin", dayShort: "Sen" })
      expect(res.data.days[6]).toEqual({ dayOfWeek: 7, dayName: "Minggu", dayShort: "Min" })
    })
  })

  describe("2. saveCounselorTemplateAction() & Quota Guardrail (< 10 slots)", () => {
    it("rejects saving with automatic mode if selected active slots < 10", async () => {
      // Create 8 active slots (Senin slots 1-4, Selasa slots 1-4)
      const subQuotaSlots = [
        { dayOfWeek: 1, slotIndex: 1, isActive: true },
        { dayOfWeek: 1, slotIndex: 2, isActive: true },
        { dayOfWeek: 1, slotIndex: 3, isActive: true },
        { dayOfWeek: 1, slotIndex: 4, isActive: true },
        { dayOfWeek: 2, slotIndex: 1, isActive: true },
        { dayOfWeek: 2, slotIndex: 2, isActive: true },
        { dayOfWeek: 2, slotIndex: 3, isActive: true },
        { dayOfWeek: 2, slotIndex: 4, isActive: true },
      ]

      const res = await saveCounselorTemplateAction(
        {
          slots: subQuotaSlots,
          scheduleMode: "automatic",
        },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/minimal 10 slot aktif/i)
      expect(res.error).toContain("8")

      // Ensure scheduleMode in DB remains manual
      const [c] = await db.select().from(counselors).where(eq(counselors.id, testCounselorId))
      expect(c.scheduleMode).toBe("manual")
    })

    it("allows saving sub-quota slots (< 10) when scheduleMode is 'manual'", async () => {
      const manualSlots = [
        { dayOfWeek: 1, slotIndex: 1, isActive: true },
        { dayOfWeek: 1, slotIndex: 2, isActive: true },
        { dayOfWeek: 1, slotIndex: 3, isActive: true },
        { dayOfWeek: 1, slotIndex: 4, isActive: true },
        { dayOfWeek: 1, slotIndex: 5, isActive: true },
      ]

      const res = await saveCounselorTemplateAction(
        {
          slots: manualSlots,
          scheduleMode: "manual",
        },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(res.success).toBe(true)
      expect(res.data?.activeCount).toBe(5)
      expect(res.data?.scheduleMode).toBe("manual")
      // In manual mode, materializer is not triggered
      expect(res.data?.materialized).toBeUndefined()

      // Verify in DB
      const templateData = await getCounselorTemplateAction({ currentUser: counselorAuth })
      expect(templateData.data?.activeCount).toBe(5)
      expect(templateData.data?.isTargetMet).toBe(false)
      expect(templateData.data?.remainingSlots).toBe(5)
    })

    it("successfully saves template and triggers 4-week materialization when mode is automatic and active slots >= 10", async () => {
      // Build 12 active slots (Senin: 6 slots, Selasa: 6 slots)
      const validAutomaticSlots: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
      for (let s = 1; s <= 6; s++) {
        validAutomaticSlots.push({ dayOfWeek: 1, slotIndex: s, isActive: true })
        validAutomaticSlots.push({ dayOfWeek: 2, slotIndex: s, isActive: true })
      }
      // Fill remaining with inactive
      for (let d = 3; d <= 7; d++) {
        for (let s = 1; s <= 7; s++) {
          validAutomaticSlots.push({ dayOfWeek: d, slotIndex: s, isActive: false })
        }
      }
      validAutomaticSlots.push({ dayOfWeek: 1, slotIndex: 7, isActive: false })
      validAutomaticSlots.push({ dayOfWeek: 2, slotIndex: 7, isActive: false })

      const res = await saveCounselorTemplateAction(
        {
          slots: validAutomaticSlots,
          scheduleMode: "automatic",
        },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data?.activeCount).toBe(12)
      expect(res.data?.scheduleMode).toBe("automatic")

      // Materializer was automatically invoked for 4 weeks ahead
      expect(res.data?.materialized).toBeDefined()
      expect(res.data?.materialized?.success).toBe(true)
      expect(res.data?.materialized?.weeksAhead).toBe(4)
      expect(res.data?.materialized?.createdCount).toBeGreaterThan(0)

      // Verify in database that physical schedules exist for the 4 weeks
      const createdSchedules = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, referenceMonday),
            lte(schedules.date, windowEnd),
            eq(schedules.status, "available")
          )
        )

      // 12 slots/week * 4 weeks = 48 physical slots
      expect(createdSchedules.length).toBe(48)

      // Counselor scheduleMode in DB is automatic
      const [c] = await db.select().from(counselors).where(eq(counselors.id, testCounselorId))
      expect(c.scheduleMode).toBe("automatic")
    })

    it("rejects updating template with < 10 slots when counselor is currently in automatic mode", async () => {
      // Counselor is currently in automatic mode from previous test.
      // Attempting to save only 6 active slots without specifying scheduleMode should reject!
      const reducedSlots: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
      // Set all to false first
      for (let d = 1; d <= 7; d++) {
        for (let s = 1; s <= 7; s++) {
          reducedSlots.push({ dayOfWeek: d, slotIndex: s, isActive: false })
        }
      }
      // Only 6 slots active
      for (let s = 1; s <= 6; s++) {
        const target = reducedSlots.find((item) => item.dayOfWeek === 1 && item.slotIndex === s)
        if (target) target.isActive = true
      }

      const res = await saveCounselorTemplateAction(
        { slots: reducedSlots },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/mode otomatis membutuhkan komitmen minimal 10 slot aktif/i)
      expect(res.error).toContain("6")
    })
  })

  describe("3. toggleScheduleModeAction() & Seamless Switching", () => {
    it("rejects switching to automatic if the existing saved template has < 10 slots", async () => {
      // First, set template to 5 slots in manual mode
      const manual5Slots: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
      for (let d = 1; d <= 7; d++) {
        for (let s = 1; s <= 7; s++) {
          manual5Slots.push({ dayOfWeek: d, slotIndex: s, isActive: false })
        }
      }
      for (let s = 1; s <= 5; s++) {
        const item = manual5Slots.find((x) => x.dayOfWeek === 1 && x.slotIndex === s)
        if (item) item.isActive = true
      }

      await saveCounselorTemplateAction(
        { slots: manual5Slots, scheduleMode: "manual" },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      // Now attempt to toggle to automatic
      const toggleRes = await toggleScheduleModeAction(
        { scheduleMode: "automatic" },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(toggleRes.success).toBe(false)
      expect(toggleRes.error).toMatch(/tidak dapat mengaktifkan mode otomatis/i)
      expect(toggleRes.error).toContain("5")

      // Ensure mode remains manual
      const [c] = await db.select().from(counselors).where(eq(counselors.id, testCounselorId))
      expect(c.scheduleMode).toBe("manual")
    })

    it("successfully toggles to automatic when template has >= 10 slots and materializes calendar", async () => {
      // Setup template with 10 slots (Senin 1-5, Selasa 1-5)
      const valid10Slots: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
      for (let d = 1; d <= 7; d++) {
        for (let s = 1; s <= 7; s++) {
          valid10Slots.push({ dayOfWeek: d, slotIndex: s, isActive: false })
        }
      }
      for (let s = 1; s <= 5; s++) {
        const item1 = valid10Slots.find((x) => x.dayOfWeek === 1 && x.slotIndex === s)
        if (item1) item1.isActive = true
        const item2 = valid10Slots.find((x) => x.dayOfWeek === 2 && x.slotIndex === s)
        if (item2) item2.isActive = true
      }

      await saveCounselorTemplateAction(
        { slots: valid10Slots, scheduleMode: "manual" },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      // Now toggle to automatic
      const toggleRes = await toggleScheduleModeAction(
        { scheduleMode: "automatic" },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(toggleRes.success).toBe(true)
      expect(toggleRes.data?.scheduleMode).toBe("automatic")
      expect(toggleRes.data?.activeCount).toBe(10)
      expect(toggleRes.data?.materialized).toBeDefined()
      expect(toggleRes.data?.materialized?.success).toBe(true)

      // Check DB
      const [c] = await db.select().from(counselors).where(eq(counselors.id, testCounselorId))
      expect(c.scheduleMode).toBe("automatic")
    })

    it("switching to manual preserves all previously materialized calendar slots", async () => {
      // Count current available slots created during automatic mode
      const countBefore = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, referenceMonday),
            lte(schedules.date, windowEnd),
            eq(schedules.status, "available")
          )
        )

      expect(countBefore.length).toBeGreaterThanOrEqual(40) // 10 slots/week * 4 weeks

      // Switch to manual mode
      const toggleRes = await toggleScheduleModeAction(
        { scheduleMode: "manual" },
        { currentUser: counselorAuth, referenceDate: referenceMonday }
      )

      expect(toggleRes.success).toBe(true)
      expect(toggleRes.data?.scheduleMode).toBe("manual")

      // Verify in DB that scheduleMode is manual
      const [c] = await db.select().from(counselors).where(eq(counselors.id, testCounselorId))
      expect(c.scheduleMode).toBe("manual")

      // Crucial requirement: Future slots in calendar remain intact (preserved, not deleted or cancelled)
      const countAfter = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.counselorId, testCounselorId),
            gte(schedules.date, referenceMonday),
            lte(schedules.date, windowEnd),
            eq(schedules.status, "available")
          )
        )

      expect(countAfter.length).toBe(countBefore.length)
    })
  })
})
