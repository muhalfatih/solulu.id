import { describe, it, expect } from "vitest"
import {
  MIN_WEEKLY_SLOTS_TARGET,
  CLINIC_BOOKING_CUTOFF_HOURS,
  getWeekDates,
  getMondayOfWeek,
  calculateWeeklyCommitment,
  isSlotPastH4Cutoff,
  isSlotBookableForClient,
  canCounselorToggleSlot,
} from "@/lib/schedules/commitment"
import { FIXED_SLOTS } from "@/lib/operator/types"
import {
  getCounselorWeeklyGridAction,
  toggleSlotAvailabilityAction,
  submitLeaveRequestAction,
  cancelSlotLeaveAction,
} from "@/app/counselor/schedule/actions"
import { executeGetBookingContext, executeCreateGuestBooking } from "@/lib/booking/checkout"
import type { CounselorAuthContext } from "@/lib/counselor/types"

describe("Ticket 3: Counselor Schedule Commitment Portal & Guardrails", () => {
  const counselorAuth: CounselorAuthContext = {
    id: "counselor-user-test-uuid",
    counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
    app_metadata: { role: "counselor" },
    user_metadata: {
      role: "counselor",
      full_name: "Sarah Annisa, M.Psi., Psikolog",
    },
  }

  // Reference test date: Monday, 2026-10-19 10:00:00 WIB (UTC+7)
  const testNow = new Date("2026-10-19T03:00:00.000Z") // 10:00 WIB

  describe("1. 7-Day Weekly Grid & Fixed 2-Hour Slots Alignment", () => {
    it("aligns precisely with the 7 fixed 2-hour slots", () => {
      expect(FIXED_SLOTS).toHaveLength(7)
      expect(FIXED_SLOTS[0]).toMatchObject({
        slotIndex: 1,
        startTime: "08:00:00",
        endTime: "10:00:00",
      })
      expect(FIXED_SLOTS[6]).toMatchObject({
        slotIndex: 7,
        startTime: "20:00:00",
        endTime: "22:00:00",
      })
    })

    it("generates 7 consecutive days starting Monday through Sunday in WIB", () => {
      const days = getWeekDates("2026-10-19", testNow)
      expect(days).toHaveLength(7)
      expect(days[0].dayName).toBe("Senin")
      expect(days[0].date).toBe("2026-10-19")
      expect(days[0].isToday).toBe(true)

      expect(days[6].dayName).toBe("Minggu")
      expect(days[6].date).toBe("2026-10-25")
    })

    it("returns a complete 7x7 matrix through getCounselorWeeklyGridAction", async () => {
      const res = await getCounselorWeeklyGridAction("2026-10-19", {
        currentUser: counselorAuth,
        now: testNow,
        getSchedules: async () => [
          {
            id: "sched-1",
            counselorId: counselorAuth.counselorId,
            date: "2026-10-20",
            slotIndex: 2,
            startTime: "10:00:00",
            endTime: "12:00:00",
            status: "available",
            isLeave: false,
          },
        ],
      })

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      if (!res.data) return

      expect(res.data.fixedSlots).toHaveLength(7)
      expect(res.data.weekDates).toHaveLength(7)

      // Cell Slot 2 on Tuesday 2026-10-20 should be available
      const cell = res.data.grid[2]["2026-10-20"]
      expect(cell).toBeDefined()
      expect(cell.status).toBe("available")
      expect(cell.canToggle).toBe(true)

      // Cell Slot 1 on Monday should be unopened
      const unopenedCell = res.data.grid[1]["2026-10-19"]
      expect(unopenedCell).toBeDefined()
      expect(unopenedCell.status).toBe("unopened")
    })
  })

  describe("2. Minimum Quota Validation (10 Slots / Week)", () => {
    it("enforces MIN_WEEKLY_SLOTS_TARGET of 10 slots", () => {
      expect(MIN_WEEKLY_SLOTS_TARGET).toBe(10)
    })

    it("evaluates commitment as unmet when active slots < 10", () => {
      const slots = [
        { status: "available", isLeave: false, date: "2026-10-20" },
        { status: "available", isLeave: false, date: "2026-10-20" },
        { status: "booked", isLeave: false, date: "2026-10-21" },
        { status: "available", isLeave: false, date: "2026-10-22" },
      ]

      const metrics = calculateWeeklyCommitment(slots, 10)
      expect(metrics.activeCount).toBe(4)
      expect(metrics.target).toBe(10)
      expect(metrics.isMet).toBe(false)
      expect(metrics.remaining).toBe(6)
      expect(metrics.percentage).toBe(40)
    })

    it("evaluates commitment as met when active slots >= 10", () => {
      const slots = Array.from({ length: 12 }, (_, i) => ({
        status: i % 3 === 0 ? "booked" : "available",
        isLeave: false,
        date: `2026-10-${20 + (i % 5)}`,
      }))

      const metrics = calculateWeeklyCommitment(slots, 10)
      expect(metrics.activeCount).toBe(12)
      expect(metrics.isMet).toBe(true)
      expect(metrics.remaining).toBe(0)
      expect(metrics.percentage).toBe(100)
    })

    it("excludes cancelled slots and leave slots from weekly commitment count", () => {
      const slots = [
        { status: "available", isLeave: false, date: "2026-10-20" }, // +1
        { status: "cancelled", isLeave: false, date: "2026-10-20" }, // 0
        { status: "available", isLeave: true, date: "2026-10-21" }, // 0 (leave)
        { status: "booked", isLeave: false, date: "2026-10-21" }, // +1
      ]

      const metrics = calculateWeeklyCommitment(slots, 10)
      expect(metrics.activeCount).toBe(2)
      expect(metrics.isMet).toBe(false)
      expect(metrics.remaining).toBe(8)
    })
  })

  describe("3. Slot Availability Toggle & Protected Booked Slots", () => {
    it("allows toggling an unopened slot to available", async () => {
      let insertedSlot: any = null
      const res = await toggleSlotAvailabilityAction(
        { date: "2026-10-21", slotIndex: 3 },
        {
          currentUser: counselorAuth,
          now: testNow,
          getSlot: async () => null,
          insertSlot: async (record) => {
            insertedSlot = { id: "new-uuid-1", ...record }
            return [insertedSlot]
          },
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.status).toBe("available")
      expect(insertedSlot).toBeDefined()
      expect(insertedSlot.slotIndex).toBe(3)
      expect(insertedSlot.startTime).toBe("12:00:00")
      expect(insertedSlot.endTime).toBe("14:00:00")
    })

    it("allows toggling an available slot to cancelled (off)", async () => {
      let updatedStatus = ""
      const res = await toggleSlotAvailabilityAction(
        { date: "2026-10-21", slotIndex: 3 },
        {
          currentUser: counselorAuth,
          now: testNow,
          getSlot: async () => ({
            id: "existing-slot-id",
            status: "available",
            isLeave: false,
          }),
          updateSlot: async (id, updates) => {
            updatedStatus = updates.status
            return [{ id, ...updates }]
          },
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.status).toBe("cancelled")
      expect(updatedStatus).toBe("cancelled")
    })

    it("STRICTLY REJECTS toggling off slots that are already booked by a client", async () => {
      const res = await toggleSlotAvailabilityAction(
        { date: "2026-10-21", slotIndex: 4 },
        {
          currentUser: counselorAuth,
          now: testNow,
          getSlot: async () => ({
            id: "booked-slot-id",
            status: "booked",
            booking: { id: "booking-uuid-1", status: "confirmed" },
          }),
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("sudah dipesan")
    })

    it("rejects toggling slots that are currently in reserved payment hold", async () => {
      const res = await toggleSlotAvailabilityAction(
        { date: "2026-10-21", slotIndex: 5 },
        {
          currentUser: counselorAuth,
          now: testNow,
          getSlot: async () => ({
            id: "reserved-slot-id",
            status: "reserved",
          }),
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("hold proses pembayaran")
    })

    it("rejects toggling slots that are in the past", async () => {
      const res = await toggleSlotAvailabilityAction(
        { date: "2026-10-18", slotIndex: 1 }, // Yesterday
        {
          currentUser: counselorAuth,
          now: testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("terlewat")
    })
  })

  describe("4. Leave / Permission Request Dialog & Database Guardrails", () => {
    it("records leave requests with is_leave: true and leave_reason in the database", async () => {
      const savedRecords: any[] = []
      const res = await submitLeaveRequestAction(
        {
          startDate: "2026-10-22",
          endDate: "2026-10-23",
          leaveReason: "Menghadiri Konferensi Psikologi Klinis Nasional",
          slotIndices: [1, 2, 3],
        },
        {
          currentUser: counselorAuth,
          now: testNow,
          getExistingSlotsInRange: async () => [],
          saveLeaveSlots: async (records) => {
            savedRecords.push(...records)
            return records
          },
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.affectedDays).toBe(2) // 22 and 23
      expect(res.data?.affectedSlots).toBe(6) // 3 slots * 2 days
      expect(savedRecords.length).toBeGreaterThan(0)
      expect(savedRecords[0].isLeave).toBe(true)
      expect(savedRecords[0].leaveReason).toBe("Menghadiri Konferensi Psikologi Klinis Nasional")
    })

    it("rejects leave requests with invalid date ordering", async () => {
      const res = await submitLeaveRequestAction(
        {
          startDate: "2026-10-25",
          endDate: "2026-10-22",
          leaveReason: "Sakit",
        },
        {
          currentUser: counselorAuth,
          now: testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("tidak valid")
    })

    it("allows cancelling leave on a specific slot", async () => {
      let restoredUpdates: any = null
      const res = await cancelSlotLeaveAction("slot-leave-1", {
        currentUser: counselorAuth,
        updateSlot: async (id, updates) => {
          restoredUpdates = updates
          return [{ id, ...updates }]
        },
      })

      expect(res.success).toBe(true)
      expect(restoredUpdates.isLeave).toBe(false)
      expect(restoredUpdates.leaveReason).toBeNull()
      expect(restoredUpdates.status).toBe("available")
    })
  })

  describe("5. Client Booking Guardrails: Leave Prevention & H-4 Hour Cutoff", () => {
    it("strictly blocks clients from booking any slot marked with is_leave: true", () => {
      const leaveSlot = {
        date: "2026-10-21",
        startTime: "14:00:00",
        status: "available",
        isLeave: true,
        leaveReason: "Cuti Menikah",
      }

      const check = isSlotBookableForClient(leaveSlot, testNow, CLINIC_BOOKING_CUTOFF_HOURS)
      expect(check.bookable).toBe(false)
      expect(check.reason).toContain("izin/cuti praktik")
      expect(check.reason).toContain("Cuti Menikah")
    })

    it("blocks checkout context generation if the selected slot is marked as leave", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: "leave-slot-uuid", counselorId: counselorAuth.counselorId! },
        {
          getCounselor: async () => ({
            id: counselorAuth.counselorId!,
            fullName: "Sarah Annisa",
            title: "Psikolog Klinis",
            counselorType: "psychologist",
            isActive: true,
          }),
          getSchedule: async () => ({
            id: "leave-slot-uuid",
            counselorId: counselorAuth.counselorId!,
            date: "2026-10-22",
            startTime: "14:00",
            endTime: "16:00",
            status: "available",
            isLeave: true,
            leaveReason: "Sakit",
          }),
          now: () => testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("izin/cuti")
    })

    it("blocks guest booking creation if the slot is marked as leave", async () => {
      const res = await executeCreateGuestBooking(
        {
          scheduleId: "leave-slot-uuid",
          counselorId: counselorAuth.counselorId!,
          patientName: "Budi Santoso",
          patientEmail: "budi@example.com",
          patientEmailConfirm: "budi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "manual",
        },
        {
          getCounselor: async () => ({
            id: counselorAuth.counselorId!,
            fullName: "Sarah Annisa",
            title: "Psikolog Klinis",
            counselorType: "psychologist",
            isActive: true,
          }),
          getSchedule: async () => ({
            id: "leave-slot-uuid",
            counselorId: counselorAuth.counselorId!,
            date: "2026-10-22",
            startTime: "14:00",
            endTime: "16:00",
            status: "available",
            isLeave: true,
          }),
          now: () => testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("izin/cuti")
    })

    it("enforces the H-4 hour cutoff: prevents booking slots starting in < 4 hours", () => {
      // testNow is 2026-10-19 10:00 WIB
      // Slot at 12:00 (2 hours away) -> REJECTED by H-4 cutoff
      const slot2HoursAway = isSlotPastH4Cutoff("2026-10-19", "12:00:00", testNow, 4)
      expect(slot2HoursAway).toBe(true)

      // Slot at 13:30 (3.5 hours away) -> REJECTED by H-4 cutoff
      const slot3HalfHoursAway = isSlotPastH4Cutoff("2026-10-19", "13:30:00", testNow, 4)
      expect(slot3HalfHoursAway).toBe(true)

      // Slot at 14:00 (exactly 4 hours away) -> ALLOWED (diff = 240 mins)
      const slot4HoursAway = isSlotPastH4Cutoff("2026-10-19", "14:00:00", testNow, 4)
      expect(slot4HoursAway).toBe(false)

      // Slot at 16:00 (6 hours away) -> ALLOWED
      const slot6HoursAway = isSlotPastH4Cutoff("2026-10-19", "16:00:00", testNow, 4)
      expect(slot6HoursAway).toBe(false)
    })

    it("validates client booking eligibility according to H-4 cutoff rule", () => {
      // Slot today at 12:00 when now is 10:00 (< 4 hours)
      const tooSoonSlot = {
        date: "2026-10-19",
        startTime: "12:00:00",
        status: "available",
        isLeave: false,
      }
      const checkTooSoon = isSlotBookableForClient(tooSoonSlot, testNow, 4)
      expect(checkTooSoon.bookable).toBe(false)
      expect(checkTooSoon.reason).toContain("H-4 jam")

      // Slot today at 16:00 (6 hours away)
      const validSlot = {
        date: "2026-10-19",
        startTime: "16:00:00",
        status: "available",
        isLeave: false,
      }
      const checkValid = isSlotBookableForClient(validSlot, testNow, 4)
      expect(checkValid.bookable).toBe(true)
    })
  })
})
