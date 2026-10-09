import { describe, it, expect, vi } from "vitest"
import {
  isSlotInPast,
  isSlotBookable,
  filterBookableSlots,
  getNowWIB,
  getWIBDateString,
  getMaxBookableDateString,
  canCancelSlot,
  MIN_BOOKING_LEAD_TIME_MINUTES,
  MAX_BOOKING_HORIZON_DAYS,
  MAX_COUNSELOR_DAILY_SESSIONS,
} from "../lib/schedules/concurrency"
import {
  executeGetBookingContext,
  executeCreateGuestBooking,
  DEMO_SCHEDULES,
  DEMO_COUNSELORS,
} from "../lib/booking/checkout"
import {
  createScheduleSlotsAction,
  getCounselorSchedulesAction,
  type AuthContext,
} from "../app/counselor/schedules/actions"
import { getCounselorsCatalogAction } from "../app/counselors/actions"

describe("Booking Limits, Lead-Time Buffer & Past Slots Prevention", () => {
  const counselorAuth: AuthContext = {
    id: "counselor-user-test",
    counselorId: "counselor-test-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  // Reference test date: 2026-10-09 10:00:00 WIB (UTC+7)
  const testNow = new Date("2026-10-09T03:00:00.000Z") // 10:00 WIB

  describe("1. Time & Horizon Guardrails (WIB Timezone)", () => {
    it("returns correct WIB date components", () => {
      const wib = getNowWIB(testNow)
      expect(wib.dateStr).toBe("2026-10-09")
      expect(wib.hours).toBe(10)
      expect(wib.minutes).toBe(0)
      expect(wib.timeMinutes).toBe(600)
    })

    it("identifies past slots accurately", () => {
      // Yesterday
      expect(isSlotInPast("2026-10-08", "19:00", testNow)).toBe(true)
      // Today earlier (09:00 < 10:00)
      expect(isSlotInPast("2026-10-09", "09:00", testNow)).toBe(true)
      // Today exactly now (10:00 <= 10:00)
      expect(isSlotInPast("2026-10-09", "10:00", testNow)).toBe(true)
      // Today later (11:00 > 10:00)
      expect(isSlotInPast("2026-10-09", "11:00", testNow)).toBe(false)
      // Tomorrow
      expect(isSlotInPast("2026-10-10", "09:00", testNow)).toBe(false)
    })

    it("enforces 2-hour lead time buffer and 14-day booking horizon", () => {
      // 1. Past date -> rejected
      const past = isSlotBookable("2026-10-08", "19:00", testNow)
      expect(past.bookable).toBe(false)
      expect(past.reason).toContain("sudah terlewat")

      // 2. Beyond 14 days -> rejected
      const farFuture = isSlotBookable("2026-10-30", "10:00", testNow)
      expect(farFuture.bookable).toBe(false)
      expect(farFuture.reason).toContain("14 hari")

      // 3. Today, but only 1 hour ahead (11:00 when now is 10:00) -> rejected (< 120 mins)
      const tooSoon = isSlotBookable("2026-10-09", "11:00", testNow)
      expect(tooSoon.bookable).toBe(false)
      expect(tooSoon.reason).toContain("minimal 2 jam")

      // 4. Today, but exactly 90 mins ahead (11:30 when now is 10:00) -> rejected
      const stillTooSoon = isSlotBookable("2026-10-09", "11:30", testNow)
      expect(stillTooSoon.bookable).toBe(false)

      // 5. Today, with >= 2 hours buffer (13:00 when now is 10:00 is 180 mins) -> allowed
      const validToday = isSlotBookable("2026-10-09", "13:00", testNow)
      expect(validToday.bookable).toBe(true)

      // 6. Tomorrow -> allowed
      const validTomorrow = isSlotBookable("2026-10-10", "09:00", testNow)
      expect(validTomorrow.bookable).toBe(true)
    })

    it("filters a list of slots keeping only bookable ones", () => {
      const slots = [
        { id: "1", date: "2026-10-08", startTime: "19:00" }, // Yesterday
        { id: "2", date: "2026-10-09", startTime: "09:00" }, // Today past
        { id: "3", date: "2026-10-09", startTime: "11:00" }, // Today 1 hr away (no buffer)
        { id: "4", date: "2026-10-09", startTime: "14:00" }, // Today 4 hrs away (bookable)
        { id: "5", date: "2026-10-10", startTime: "09:00" }, // Tomorrow (bookable)
      ]

      const bookable = filterBookableSlots(slots, testNow)
      expect(bookable.map((s) => s.id)).toEqual(["4", "5"])
    })

    it("rejects cancellation of past slots", () => {
      expect(canCancelSlot("available", true).allowed).toBe(false)
      expect(canCancelSlot("available", true).reason).toContain("sudah terlewat")
      expect(canCancelSlot("available", false).allowed).toBe(true)
    })
  })

  describe("2. Public Checkout & Anti-Hoarding Prevention", () => {
    it("rejects booking context if slot is in the past or within 2-hour buffer", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: "past-slot", counselorId: "c-1" },
        {
          getCounselor: async () => DEMO_COUNSELORS["c-1"],
          getSchedule: async () => ({
            id: "past-slot",
            counselorId: "c-1",
            date: "2026-10-08",
            startTime: "19:00",
            endTime: "20:30",
            status: "available",
          }),
          now: () => testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("terlewat")
    })

    it("rejects guest booking if slot is within 2-hour buffer", async () => {
      const res = await executeCreateGuestBooking(
        {
          scheduleId: "slot-too-soon",
          counselorId: "c-1",
          patientName: "Budi Santoso",
          patientEmail: "budi@example.com",
          patientEmailConfirm: "budi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "manual",
        },
        {
          getCounselor: async () => DEMO_COUNSELORS["c-1"],
          getSchedule: async () => ({
            id: "slot-too-soon",
            counselorId: "c-1",
            date: "2026-10-09",
            startTime: "11:00",
            endTime: "12:30",
            status: "available",
          }),
          now: () => testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("minimal 2 jam")
    })

    it("rejects guest booking if patient already has 1 unexpired pending hold (Anti-Hoarding)", async () => {
      const res = await executeCreateGuestBooking(
        {
          scheduleId: "valid-slot-tomorrow",
          counselorId: "c-1",
          patientName: "Budi Santoso",
          patientEmail: "budi@example.com",
          patientEmailConfirm: "budi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "manual",
        },
        {
          getCounselor: async () => DEMO_COUNSELORS["c-1"],
          getSchedule: async () => ({
            id: "valid-slot-tomorrow",
            counselorId: "c-1",
            date: "2026-10-10",
            startTime: "14:00",
            endTime: "15:30",
            status: "available",
          }),
          checkExistingPendingHold: async () => true, // Simulating patient currently holds another slot
          now: () => testNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("masih memiliki 1 transaksi pemesanan yang sedang berjalan")
    })
  })

  describe("3. Counselor Dashboard Schedule Actions", () => {
    it("rejects creating slots for past date or past hour today", async () => {
      // Past date
      const pastRes = await createScheduleSlotsAction(
        {
          date: "2026-10-08",
          startTimes: ["09:00"],
        },
        { currentUser: counselorAuth }
      )
      expect(pastRes.success).toBe(false)
      expect(pastRes.error).toContain("sudah terlewat")

      // Today, but past hour (09:00 when now is 10:00)
      const todayPastRes = await createScheduleSlotsAction(
        {
          date: getWIBDateString(new Date()),
          startTimes: ["00:00"], // definitely past
        },
        { currentUser: counselorAuth }
      )
      expect(todayPastRes.success).toBe(false)
      expect(todayPastRes.error).toContain("sudah terlewat")
    })

    it("enforces maximum daily workload of 4 sessions per counselor", async () => {
      const tomorrowStr = getWIBDateString(new Date(Date.now() + 86400000))
      const res = await createScheduleSlotsAction(
        {
          date: tomorrowStr,
          startTimes: ["09:00", "11:00"],
        },
        {
          currentUser: counselorAuth,
          checkExistingSlots: async () => [
            { startTime: "13:30", endTime: "15:00", status: "available" },
            { startTime: "15:30", endTime: "17:00", status: "available" },
            { startTime: "19:00", endTime: "20:30", status: "booked" },
          ], // already 3 active slots
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("Batas maksimal jadwal praktik adalah 4 sesi per hari")
    })

    it("marks past slots as isPast: true with disabled cancellation in getCounselorSchedulesAction", async () => {
      const res = await getCounselorSchedulesAction("all", {
        currentUser: counselorAuth,
        getSchedules: async () => [
          {
            id: "past-slot-1",
            counselorId: counselorAuth.counselorId,
            date: "2026-10-08",
            startTime: "19:00",
            endTime: "20:30",
            status: "available",
          },
          {
            id: "future-slot-1",
            counselorId: counselorAuth.counselorId,
            date: "2026-10-15",
            startTime: "09:00",
            endTime: "10:30",
            status: "available",
          },
        ],
      })

      expect(res.success).toBe(true)
      const items = res.data!
      const pastItem = items.find((i) => i.id === "past-slot-1")!
      const futureItem = items.find((i) => i.id === "future-slot-1")!

      expect(pastItem.isPast).toBe(true)
      expect(pastItem.canCancel).toBe(false)
      expect(pastItem.cancelRestrictionReason).toContain("sudah terlewat")

      expect(futureItem.isPast).toBe(false)
      expect(futureItem.canCancel).toBe(true)
    })
  })

  describe("4. Public Counselor Catalog Server Action", () => {
    it("filters out past slots and slots within 2 hours buffer from catalog", async () => {
      const counselorId = "c-test-1"
      const res = await getCounselorsCatalogAction(
        { type: "all" },
        {
          getCounselors: async () => [
            {
              id: counselorId,
              fullName: "Ahmad Fauzi, S.Psi.",
              title: "Konselor Sebaya Senior",
              counselorType: "peer",
              education: "S1 Psikologi",
              strNumber: null,
              about: "Teman cerita terpercaya.",
              avatarUrl: null,
              isActive: true,
            },
          ],
          getPricing: async () => [
            {
              counselorType: "peer",
              basePrice: "75000",
              promoPrice: null,
              isSaleActive: false,
              allowVoucher: true,
            },
          ],
          getSlots: async () => [
            {
              id: "slot-past",
              counselorId,
              date: "2026-10-08",
              startTime: "19:00",
              endTime: "20:30",
              status: "available",
            },
            {
              id: "slot-future",
              counselorId,
              date: getWIBDateString(new Date(Date.now() + 86400000)),
              startTime: "19:00",
              endTime: "20:30",
              status: "available",
            },
          ],
          getActiveSessions: async () => ({}),
        }
      )

      expect(res.success).toBe(true)
      const counselor = res.data?.find((c) => c.id === counselorId)
      expect(counselor).toBeDefined()
      expect(counselor?.availableSlots.some((s) => s.id === "slot-past")).toBe(false)
      expect(counselor?.availableSlots.some((s) => s.id === "slot-future")).toBe(true)
    })
  })
})
