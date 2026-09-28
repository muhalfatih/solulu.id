import { describe, it, expect, vi } from "vitest"
import {
  computeEndTime,
  formatTimeRange,
  isTimeRangeOverlapping,
  checkSelfOverlap,
  countOverlappingActiveSessions,
  isSlotAvailableUnderConcurrencyGuard,
  canCancelSlot,
  filterSlotsByConcurrencyGuard,
  MAX_PLATFORM_CONCURRENCY,
  SESSION_DURATION_MINUTES,
} from "../lib/schedules/concurrency"
import {
  createScheduleSlotsSchema,
  cancelScheduleSlotSchema,
  catalogFilterSchema,
} from "../lib/validations/schedules"
import {
  createScheduleSlotsAction,
  cancelScheduleSlotAction,
  getCounselorSchedulesAction,
  type AuthContext,
} from "../app/counselor/schedules/actions"
import {
  getCounselorsCatalogAction,
} from "../app/counselors/actions"

describe("Issue #5: Counselor Schedule Management & Concurrency Guard", () => {
  const counselorAuth: AuthContext = {
    id: "counselor-user-1",
    counselorId: "counselor-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const patientAuth: AuthContext = {
    id: "patient-user-1",
    app_metadata: { role: "patient" },
    user_metadata: { role: "patient" },
  }

  describe("1. Time Calculation & Formatting (90-minute sessions)", () => {
    it("has a fixed 90-minute session duration and max 2 platform concurrency", () => {
      expect(SESSION_DURATION_MINUTES).toBe(90)
      expect(MAX_PLATFORM_CONCURRENCY).toBe(2)
    })

    it("auto-computes endTime as startTime + 90 minutes", () => {
      expect(computeEndTime("09:00")).toBe("10:30")
      expect(computeEndTime("13:30")).toBe("15:00")
      expect(computeEndTime("19:00")).toBe("20:30")
      expect(computeEndTime("09:00:00")).toBe("10:30:00")
      expect(computeEndTime("20:45")).toBe("22:15")
    })

    it("formats time range with WIB suffix and en-dash", () => {
      expect(formatTimeRange("09:00", "10:30")).toBe("09:00 – 10:30 WIB")
      expect(formatTimeRange("19:00:00", "20:30:00")).toBe("19:00 – 20:30 WIB")
    })
  })

  describe("2. Overlap Checking Logic", () => {
    it("detects overlapping intervals correctly", () => {
      // Identical
      expect(isTimeRangeOverlapping("09:00", "10:30", "09:00", "10:30")).toBe(true)
      // Partial overlap
      expect(isTimeRangeOverlapping("09:00", "10:30", "10:00", "11:30")).toBe(true)
      expect(isTimeRangeOverlapping("10:00", "11:30", "09:00", "10:30")).toBe(true)
      // Enclosure
      expect(isTimeRangeOverlapping("08:00", "12:00", "09:00", "10:30")).toBe(true)
      // Back-to-back adjacent intervals do NOT overlap
      expect(isTimeRangeOverlapping("09:00", "10:30", "10:30", "12:00")).toBe(false)
      expect(isTimeRangeOverlapping("10:30", "12:00", "09:00", "10:30")).toBe(false)
      // Completely disjoint
      expect(isTimeRangeOverlapping("09:00", "10:30", "13:00", "14:30")).toBe(false)
    })

    it("detects self-overlap for the same counselor on the same date", () => {
      const existingSlots = [
        { startTime: "09:00", endTime: "10:30", status: "available" as const },
        { startTime: "13:00", endTime: "14:30", status: "booked" as const },
        { startTime: "16:00", endTime: "17:30", status: "cancelled" as const },
      ]

      // Overlaps with available slot 09:00-10:30
      expect(checkSelfOverlap(existingSlots, "09:30", "11:00")).toBe(true)
      // Overlaps with booked slot 13:00-14:30
      expect(checkSelfOverlap(existingSlots, "12:30", "14:00")).toBe(true)
      // Adjacent to 09:00-10:30: starts at 10:30 -> allowed
      expect(checkSelfOverlap(existingSlots, "10:30", "12:00")).toBe(false)
      // Same time as cancelled slot 16:00-17:30 -> allowed since it was cancelled
      expect(checkSelfOverlap(existingSlots, "16:00", "17:30")).toBe(false)
    })
  })

  describe("3. Slot Cancellation Guard", () => {
    it("allows cancelling only available slots", () => {
      const res = canCancelSlot("available")
      expect(res.allowed).toBe(true)
    })

    it("rejects cancelling reserved slots (hold protection)", () => {
      const res = canCancelSlot("reserved")
      expect(res.allowed).toBe(false)
      expect(res.reason).toContain("reservasi")
    })

    it("rejects cancelling booked slots (confirmed session protection)", () => {
      const res = canCancelSlot("booked")
      expect(res.allowed).toBe(false)
      expect(res.reason).toContain("dipesan")
    })

    it("rejects cancelling already cancelled slots", () => {
      const res = canCancelSlot("cancelled")
      expect(res.allowed).toBe(false)
    })
  })

  describe("4. Concurrency Guard (Max 2 Platform-Wide Active Sessions)", () => {
    const activeSessionsOnDate = [
      { startTime: "19:00", endTime: "20:30" }, // Host 1 busy
      { startTime: "19:30", endTime: "21:00" }, // Host 2 busy
    ]

    it("counts overlapping active sessions across the platform", () => {
      // At 19:15-20:45, both sessions overlap -> 2
      expect(countOverlappingActiveSessions(activeSessionsOnDate, "19:15", "20:45")).toBe(2)

      // At 20:45-22:15, only the second session (until 21:00) overlaps -> 1
      expect(countOverlappingActiveSessions(activeSessionsOnDate, "20:45", "22:15")).toBe(1)

      // At 10:00-11:30 (morning), neither overlaps -> 0
      expect(countOverlappingActiveSessions(activeSessionsOnDate, "10:00", "11:30")).toBe(0)
    })

    it("blocks slot availability when active concurrency >= 2", () => {
      // When 2 sessions overlap, guard returns false (at capacity)
      expect(isSlotAvailableUnderConcurrencyGuard(activeSessionsOnDate, "19:00", "20:30")).toBe(false)
      expect(isSlotAvailableUnderConcurrencyGuard(activeSessionsOnDate, "19:15", "20:45")).toBe(false)
    })

    it("allows slot availability when active concurrency < 2", () => {
      // Only 1 session overlaps at 20:30 - 22:00 -> allowed
      expect(isSlotAvailableUnderConcurrencyGuard(activeSessionsOnDate, "20:30", "22:00")).toBe(true)

      // 0 sessions overlap in morning -> allowed
      expect(isSlotAvailableUnderConcurrencyGuard(activeSessionsOnDate, "09:00", "10:30")).toBe(true)
    })

    it("filters catalog slots accurately based on concurrency capacity", () => {
      const candidateSlots = [
        { id: "s1", startTime: "09:00", endTime: "10:30", status: "available" as const },
        { id: "s2", startTime: "19:00", endTime: "20:30", status: "available" as const }, // Overlaps with 2
        { id: "s3", startTime: "21:00", endTime: "22:30", status: "available" as const }, // After 21:00, 0 overlap
      ]

      const visible = filterSlotsByConcurrencyGuard(candidateSlots, activeSessionsOnDate)
      expect(visible.map((s) => s.id)).toEqual(["s1", "s3"])
      expect(visible.find((s) => s.id === "s2")).toBeUndefined()
    })
  })

  describe("5. Zod Input Validations", () => {
    it("validates schedule slot creation input", () => {
      const valid = createScheduleSlotsSchema.safeParse({
        date: "2026-10-15",
        startTimes: ["09:00", "13:30", "19:00"],
      })
      expect(valid.success).toBe(true)

      // Empty startTimes
      const emptyTimes = createScheduleSlotsSchema.safeParse({
        date: "2026-10-15",
        startTimes: [],
      })
      expect(emptyTimes.success).toBe(false)

      // Invalid date format
      const invalidDate = createScheduleSlotsSchema.safeParse({
        date: "15-10-2026",
        startTimes: ["09:00"],
      })
      expect(invalidDate.success).toBe(false)
    })

    it("validates cancel schedule slot input", () => {
      const valid = cancelScheduleSlotSchema.safeParse({
        scheduleId: "123e4567-e89b-12d3-a456-426614174000",
      })
      expect(valid.success).toBe(true)

      const invalid = cancelScheduleSlotSchema.safeParse({
        scheduleId: "not-a-uuid",
      })
      expect(invalid.success).toBe(false)
    })

    it("validates catalog query filters", () => {
      const validAll = catalogFilterSchema.safeParse({
        type: "all",
        date: "2026-10-15",
      })
      expect(validAll.success).toBe(true)

      const validPeer = catalogFilterSchema.safeParse({
        type: "peer",
      })
      expect(validPeer.success).toBe(true)

      const validPsychologist = catalogFilterSchema.safeParse({
        type: "psychologist",
      })
      expect(validPsychologist.success).toBe(true)
    })
  })

  describe("6. Server Action: createScheduleSlotsAction", () => {
    it("blocks non-counselor users from creating schedule slots", async () => {
      const res = await createScheduleSlotsAction(
        { date: "2026-10-20", startTimes: ["09:00"] },
        { currentUser: patientAuth }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("creates slots with auto-computed endTime (+90 min) and saves them", async () => {
      const insertMock = vi.fn().mockImplementation(async (records) => {
        return records.map((r: any, idx: number) => ({
          id: `slot-id-${idx}`,
          ...r,
        }))
      })

      const res = await createScheduleSlotsAction(
        { date: "2026-10-20", startTimes: ["09:00", "13:30"] },
        {
          currentUser: counselorAuth,
          checkExistingSlots: async () => [],
          insertSlots: insertMock,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.count).toBe(2)
      expect(res.data?.slots[0].startTime).toBe("09:00")
      expect(res.data?.slots[0].endTime).toBe("10:30")
      expect(res.data?.slots[0].timeRange).toBe("09:00 – 10:30 WIB")
      expect(res.data?.slots[1].startTime).toBe("13:30")
      expect(res.data?.slots[1].endTime).toBe("15:00")
      expect(res.data?.slots[1].timeRange).toBe("13:30 – 15:00 WIB")
      expect(insertMock).toHaveBeenCalledTimes(1)
    })

    it("rejects internal overlap when multiple proposed slots collide", async () => {
      const res = await createScheduleSlotsAction(
        { date: "2026-10-20", startTimes: ["09:00", "09:30"] }, // 09:00 ends 10:30, 09:30 collides
        {
          currentUser: counselorAuth,
          checkExistingSlots: async () => [],
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("bertabrakan")
      expect(res.error).toContain("90 menit")
    })

    it("rejects self-overlap with existing slot of same counselor on same date", async () => {
      const existingSlots = [
        { startTime: "09:00", endTime: "10:30", status: "available" },
      ]

      const res = await createScheduleSlotsAction(
        { date: "2026-10-20", startTimes: ["10:00"] }, // 10:00 collides with 09:00-10:30
        {
          currentUser: counselorAuth,
          checkExistingSlots: async () => existingSlots,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("bertabrakan dengan jadwal Anda yang sudah ada")
    })
  })

  describe("7. Server Action: cancelScheduleSlotAction", () => {
    it("allows cancelling available slot", async () => {
      const slot = {
        id: "slot-avail-1",
        counselorId: "counselor-1",
        status: "available",
      }
      const updateMock = vi.fn().mockResolvedValue({})

      const res = await cancelScheduleSlotAction(
        { scheduleId: "123e4567-e89b-12d3-a456-426614174000" },
        {
          currentUser: counselorAuth,
          getSlot: async () => slot,
          updateSlot: updateMock,
        }
      )

      expect(res.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "cancelled"
      )
    })

    it("rejects cancelling reserved slot", async () => {
      const slot = {
        id: "slot-res-1",
        counselorId: "counselor-1",
        status: "reserved",
      }

      const res = await cancelScheduleSlotAction(
        { scheduleId: "123e4567-e89b-12d3-a456-426614174000" },
        {
          currentUser: counselorAuth,
          getSlot: async () => slot,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("reservasi")
    })

    it("rejects cancelling booked slot", async () => {
      const slot = {
        id: "slot-bk-1",
        counselorId: "counselor-1",
        status: "booked",
      }

      const res = await cancelScheduleSlotAction(
        { scheduleId: "123e4567-e89b-12d3-a456-426614174000" },
        {
          currentUser: counselorAuth,
          getSlot: async () => slot,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("dipesan")
    })
  })

  describe("8. Server Action: getCounselorsCatalogAction", () => {
    const mockCounselors = [
      {
        id: "c-1",
        fullName: "Sarah Annisa, M.Psi., Psikolog",
        title: "Psikolog Klinis Dewasa",
        counselorType: "psychologist" as const,
        bio: "Spesialis kecemasan dan trauma.",
        specializations: ["Kecemasan", "Trauma"],
        avatarR2Url: null,
        isActive: true,
      },
      {
        id: "c-2",
        fullName: "Rian Hidayat, S.Psi",
        title: "Konselor Sebaya Senior",
        counselorType: "peer" as const,
        bio: "Pendampingan quarter-life crisis.",
        specializations: ["Stres Kuliah", "Relasi"],
        avatarR2Url: null,
        isActive: true,
      },
    ]

    const mockPricing = [
      { counselorType: "peer", basePrice: "50000", promoPrice: "35000", isSaleActive: true },
      { counselorType: "psychologist", basePrice: "150000", promoPrice: null, isSaleActive: false },
    ]

    it("filters catalog counselors by type (peer vs psychologist)", async () => {
      const res = await getCounselorsCatalogAction(
        { type: "peer" },
        {
          getCounselors: async () => mockCounselors,
          getPricing: async () => mockPricing,
          getSlots: async () => [],
          getActiveSessions: async () => ({}),
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.length).toBe(1)
      expect(res.data?.[0].fullName).toBe("Rian Hidayat, S.Psi")
      expect(res.data?.[0].pricing.isSaleActive).toBe(true)
      expect(res.data?.[0].pricing.displayPrice).toBe(35000)
    })

    it("hides slots when platform concurrency capacity >= 2 and filters by date", async () => {
      const candidateSlots = [
        {
          id: "slot-1",
          counselorId: "c-1",
          date: "2026-10-15",
          startTime: "19:00",
          endTime: "20:30",
          status: "available",
        },
        {
          id: "slot-2",
          counselorId: "c-2",
          date: "2026-10-15",
          startTime: "10:00",
          endTime: "11:30",
          status: "available",
        },
      ]

      // Active sessions on 2026-10-15: 2 sessions running at 19:00!
      const activeSessions: Record<string, any[]> = {
        "2026-10-15": [
          { startTime: "19:00", endTime: "20:30", status: "confirmed" },
          { startTime: "19:30", endTime: "21:00", status: "reserved" },
        ],
      }

      const res = await getCounselorsCatalogAction(
        { date: "2026-10-15" },
        {
          getCounselors: async () => mockCounselors,
          getPricing: async () => mockPricing,
          getSlots: async () => candidateSlots,
          getActiveSessions: async () => activeSessions,
        }
      )

      expect(res.success).toBe(true)
      // c-1 had only the 19:00 slot, which is blocked by concurrency (2 active sessions).
      // Therefore, c-1 has 0 available slots and is excluded by the date filter!
      // c-2 had the 10:00 slot, which has 0 overlap and is visible.
      expect(res.data?.length).toBe(1)
      expect(res.data?.[0].id).toBe("c-2")
      expect(res.data?.[0].availableSlots.length).toBe(1)
      expect(res.data?.[0].availableSlots[0].timeRange).toBe("10:00 – 11:30 WIB")
    })
  })
})
