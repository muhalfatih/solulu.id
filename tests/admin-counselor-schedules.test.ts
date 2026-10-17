import { describe, it, expect, beforeEach } from "vitest"
import {
  getCounselorSlotsAdminAction,
  createCounselorSlotsAdminAction,
  deleteCounselorSlotAdminAction,
  type AdminAuthContext,
} from "../app/admin/counselors/actions"

describe("Admin Counselor Schedules Management", () => {
  const adminUser: AdminAuthContext = {
    id: "admin-uuid-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const counselorUser: AdminAuthContext = {
    id: "counselor-uuid-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const testCounselorId = "counselor-sch-test-1"
  const testDate = "2026-10-15"

  let mockSchedules: Record<string, any> = {}

  beforeEach(() => {
    mockSchedules = {}
  })

  const getAdminOptions = () => ({
    currentUser: adminUser,
    fetchSlotsFn: async (counselorId: string, dateFilter?: string) => {
      return Object.values(mockSchedules).filter(
        (s: any) =>
          s.counselorId === counselorId &&
          (!dateFilter || dateFilter === "all" || s.date === dateFilter)
      )
    },
    fetchExistingSlotsFn: async (counselorId: string, date: string) => {
      return Object.values(mockSchedules).filter(
        (s: any) => s.counselorId === counselorId && s.date === date
      )
    },
    insertSlotsFn: async (slots: any[]) => {
      return slots.map((s, idx) => {
        const id = `s-${Date.now()}-${idx}`
        const record = { id, ...s }
        mockSchedules[id] = record
        return record
      })
    },
    fetchSlotByIdFn: async (slotId: string) => {
      return mockSchedules[slotId] || null
    },
    deleteSlotFn: async (slotId: string) => {
      delete mockSchedules[slotId]
    },
  })

  // ===========================================================================
  // 1. RBAC Security Guards
  // ===========================================================================
  describe("1. RBAC Security Guards", () => {
    it("rejects unauthenticated or non-admin access for slot retrieval", async () => {
      const unauth = await getCounselorSlotsAdminAction(testCounselorId, undefined, {
        currentUser: null,
      })
      expect(unauth.success).toBe(false)
      expect(unauth.error).toContain("Akses ditolak")

      const forbidden = await getCounselorSlotsAdminAction(testCounselorId, undefined, {
        currentUser: counselorUser,
      })
      expect(forbidden.success).toBe(false)
      expect(forbidden.error).toContain("Akses ditolak")
    })

    it("rejects unauthenticated or non-admin access for slot creation", async () => {
      const unauth = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["09:00"] },
        { currentUser: null }
      )
      expect(unauth.success).toBe(false)
      expect(unauth.error).toContain("Akses ditolak")

      const forbidden = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["09:00"] },
        { currentUser: counselorUser }
      )
      expect(forbidden.success).toBe(false)
      expect(forbidden.error).toContain("Akses ditolak")
    })

    it("rejects unauthenticated or non-admin access for slot deletion", async () => {
      const res = await deleteCounselorSlotAdminAction("s-any-id", {
        currentUser: counselorUser,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })
  })

  // ===========================================================================
  // 2. Slot Creation, 90-Minute Computation, and Overlap Prevention
  // ===========================================================================
  describe("2. Slot Creation & Overlap Rules", () => {
    it("validates input payload completeness and formatting", async () => {
      const invalidDate = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: "15-10-2026", startTimes: ["09:00"] },
        getAdminOptions()
      )
      expect(invalidDate.success).toBe(false)
      expect(invalidDate.error).toContain("Format tanggal tidak valid")

      const invalidTime = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["25:00"] },
        getAdminOptions()
      )
      expect(invalidTime.success).toBe(false)
      expect(invalidTime.error).toContain("Format jam mulai tidak valid")
    })

    it("rejects internal overlap between requested slots due to 90-minute session duration", async () => {
      // 09:00 + 90m = 10:30. A slot at 10:00 overlaps with 09:00-10:30.
      const res = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["09:00", "10:00"] },
        getAdminOptions()
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Slot bentrok internal")
      expect(res.error).toContain("90 menit")
    })

    it("creates multiple slots and computes endTime (+90 mins) accurately when non-overlapping", async () => {
      // 09:00 - 10:30, 11:00 - 12:30, 14:00 - 15:30
      const res = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["09:00", "11:00", "14:00"] },
        getAdminOptions()
      )
      expect(res.success).toBe(true)
      expect(res.count).toBe(3)
      expect(res.slots).toHaveLength(3)

      expect(res.slots![0].startTime).toBe("09:00")
      expect(res.slots![0].endTime).toBe("10:30")
      expect(res.slots![0].timeRange).toBe("09:00 – 10:30 WIB")
      expect(res.slots![0].canDelete).toBe(true)

      expect(res.slots![1].startTime).toBe("11:00")
      expect(res.slots![1].endTime).toBe("12:30")

      expect(res.slots![2].startTime).toBe("14:00")
      expect(res.slots![2].endTime).toBe("15:30")
    })

    it("rejects creation if a slot overlaps with an existing counselor slot on the same date", async () => {
      // Seed existing slot 13:00 - 14:30
      mockSchedules["seed-slot-1"] = {
        id: "seed-slot-1",
        counselorId: testCounselorId,
        date: testDate,
        startTime: "13:00",
        endTime: "14:30",
        status: "available",
      }

      // Trying to add 13:30 - 15:00 should fail
      const res = await createCounselorSlotsAdminAction(
        { counselorId: testCounselorId, date: testDate, startTimes: ["13:30"] },
        getAdminOptions()
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Jadwal bentrok")
      expect(res.error).toContain("tumpang tindih")
    })
  })

  // ===========================================================================
  // 3. Slot Retrieval & Filtering
  // ===========================================================================
  describe("3. Slot Retrieval & Date Filtering", () => {
    it("returns formatted slot list for counselor", async () => {
      mockSchedules["seed-slot-a"] = {
        id: "seed-slot-a",
        counselorId: testCounselorId,
        date: testDate,
        startTime: "09:00",
        endTime: "10:30",
        status: "available",
      }
      mockSchedules["seed-slot-b"] = {
        id: "seed-slot-b",
        counselorId: testCounselorId,
        date: "2026-10-16",
        startTime: "14:00",
        endTime: "15:30",
        status: "booked",
      }

      const allSlots = await getCounselorSlotsAdminAction(
        testCounselorId,
        undefined,
        getAdminOptions()
      )
      expect(allSlots.success).toBe(true)
      expect(allSlots.data.length).toBeGreaterThanOrEqual(2)

      const filtered = await getCounselorSlotsAdminAction(
        testCounselorId,
        testDate,
        getAdminOptions()
      )
      expect(filtered.success).toBe(true)
      const found = filtered.data.find((s) => s.id === "seed-slot-a")
      expect(found).toBeDefined()
      expect(found?.canDelete).toBe(true)
      expect(found?.status).toBe("available")
    })
  })

  // ===========================================================================
  // 4. Slot Deletion Guard: Protecting Booked and Reserved Sessions
  // ===========================================================================
  describe("4. Slot Deletion Guard & Policy", () => {
    it("allows deletion of available slot", async () => {
      const slotId = "slot-to-delete-1"
      mockSchedules[slotId] = {
        id: slotId,
        counselorId: testCounselorId,
        date: testDate,
        startTime: "16:00",
        endTime: "17:30",
        status: "available",
      }

      const res = await deleteCounselorSlotAdminAction(slotId, getAdminOptions())
      expect(res.success).toBe(true)
      expect(res.message).toContain("berhasil dihapus")
      expect(mockSchedules[slotId]).toBeUndefined()
    })

    it("rejects deletion of a booked slot and points to clinical sessions module", async () => {
      const bookedSlotId = "slot-booked-1"
      mockSchedules[bookedSlotId] = {
        id: bookedSlotId,
        counselorId: testCounselorId,
        date: testDate,
        startTime: "10:00",
        endTime: "11:30",
        status: "booked",
      }

      const res = await deleteCounselorSlotAdminAction(bookedSlotId, getAdminOptions())
      expect(res.success).toBe(false)
      expect(res.error).toContain("sudah dikonfirmasi dan dipesan")
      expect(res.error).toContain("modul Sesi")
      expect(mockSchedules[bookedSlotId]).toBeDefined()
    })

    it("rejects deletion of a reserved (locked checkout) slot", async () => {
      const reservedSlotId = "slot-reserved-1"
      mockSchedules[reservedSlotId] = {
        id: reservedSlotId,
        counselorId: testCounselorId,
        date: testDate,
        startTime: "10:00",
        endTime: "11:30",
        status: "reserved",
      }

      const res = await deleteCounselorSlotAdminAction(reservedSlotId, getAdminOptions())
      expect(res.success).toBe(false)
      expect(res.error).toContain("sedang dalam proses pembayaran/reservasi aktif")
      expect(mockSchedules[reservedSlotId]).toBeDefined()
    })
  })
})
