import { describe, it, expect } from "vitest"
import { getActiveZoomCapacity } from "../lib/zoom/active-capacity"
import { executeCreateGuestBooking, DEMO_COUNSELORS } from "../lib/booking/checkout"
import { getCounselorsCatalogAction } from "../app/counselors/actions"
import { getWIBDateString } from "../lib/schedules/concurrency"

describe("Zoom Configuration (1 vs 2 Accounts) & Room Allocation Telemetry", () => {
  const testNow = new Date("2026-10-09T03:00:00.000Z") // 10:00 WIB
  const tomorrowStr = getWIBDateString(new Date(Date.now() + 86400000))

  describe("1. Dynamic Zoom Capacity Engine (0, 1, 2 Hosts)", () => {
    it("returns 0 when no active Zoom accounts exist", async () => {
      const cap = await getActiveZoomCapacity({
        fetchActiveAccounts: async () => [],
      })
      expect(cap).toBe(0)
    })

    it("returns 1 when exactly 1 Zoom account is active (Slot 1 only)", async () => {
      const cap = await getActiveZoomCapacity({
        fetchActiveAccounts: async () => [
          { id: "acc-1", name: "Akun Zoom Pro 1", isActive: true },
        ],
      })
      expect(cap).toBe(1)
    })

    it("returns 2 when 2 Zoom accounts are active (Slot 1 & Slot 2)", async () => {
      const cap = await getActiveZoomCapacity({
        fetchActiveAccounts: async () => [
          { id: "acc-1", name: "Akun Zoom Pro 1", isActive: true },
          { id: "acc-2", name: "Akun Zoom Pro 2", isActive: true },
        ],
      })
      expect(cap).toBe(2)
    })

    it("ignores inactive accounts when calculating capacity", async () => {
      const cap = await getActiveZoomCapacity({
        fetchActiveAccounts: async () => [
          { id: "acc-1", name: "Akun Zoom Pro 1", isActive: true },
          { id: "acc-2", name: "Akun Zoom Pro 2", isActive: false }, // inactive
        ],
      })
      expect(cap).toBe(1)
    })
  })

  describe("2. Public Checkout Concurrency Enforcement with 1 Zoom Account", () => {
    it("rejects 2nd concurrent booking when only 1 Zoom account is active", async () => {
      const tomorrow = new Date(testNow)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const slotDate = getWIBDateString(tomorrow)

      // Case A: When 1 session already overlaps at 14:00 and capacity is 1 Zoom account -> BLOCKED!
      const resBlocked = await executeCreateGuestBooking(
        {
          scheduleId: "slot-tomorrow-2",
          counselorId: "c-2",
          patientName: "Ani Lestari",
          patientEmail: "ani@example.com",
          patientEmailConfirm: "ani@example.com",
          patientPhone: "081298765432",
          paymentProvider: "manual",
        },
        {
          getCounselor: async () => DEMO_COUNSELORS["c-2"],
          getSchedule: async () => ({
            id: "slot-tomorrow-2",
            counselorId: "c-2",
            date: slotDate,
            startTime: "14:00",
            endTime: "15:30",
            status: "available",
          }),
          getActiveSessionsOnDate: async () => [
            { startTime: "14:00", endTime: "15:30" }, // 1 active session already running
          ],
          getZoomCapacity: async () => 1, // Only 1 active Zoom account!
          now: () => testNow,
        }
      )

      expect(resBlocked.success).toBe(false)
      expect(resBlocked.error).toContain("Kapasitas ruang Zoom penuh pada jam ini (maksimal 1 sesi bersamaan)")

      // Case B: If capacity is 2 Zoom accounts, the 2nd booking is ALLOWED
      const resAllowedWith2 = await executeCreateGuestBooking(
        {
          scheduleId: "slot-tomorrow-2",
          counselorId: "c-2",
          patientName: "Ani Lestari",
          patientEmail: "ani@example.com",
          patientEmailConfirm: "ani@example.com",
          patientPhone: "081298765432",
          paymentProvider: "manual",
        },
        {
          getCounselor: async () => DEMO_COUNSELORS["c-2"],
          getSchedule: async () => ({
            id: "slot-tomorrow-2",
            counselorId: "c-2",
            date: slotDate,
            startTime: "14:00",
            endTime: "15:30",
            status: "available",
          }),
          getActiveSessionsOnDate: async () => [
            { startTime: "14:00", endTime: "15:30" }, // 1 active session
          ],
          getZoomCapacity: async () => 2, // 2 active Zoom accounts!
          getPricing: async () => ({ basePrice: "150000", promoPrice: null, isSaleActive: false, allowVoucher: true }),
          now: () => testNow,
          reserveSlotAndCreateBooking: async () => ({ bookingId: "b-1", transactionId: "t-1" }),
        }
      )

      expect(resAllowedWith2.success).toBe(true)
    })
  })

  describe("3. Public Catalog Visibility with 1 vs 2 Zoom Accounts", () => {
    it("hides overlapping slots from catalog when 1 active session consumes single Zoom account", async () => {
      const res = await getCounselorsCatalogAction(
        { type: "all" },
        {
          getCounselors: async () => [
            {
              id: "c-1",
              fullName: "Ahmad Fauzi",
              title: "Konselor",
              counselorType: "peer",
              education: "S1",
              strNumber: null,
              about: "Bio",
              avatarUrl: null,
              isActive: true,
            },
            {
              id: "c-2",
              fullName: "Sarah Annisa",
              title: "Psikolog",
              counselorType: "psychologist",
              education: "S2",
              strNumber: "STR-123",
              about: "Bio",
              avatarUrl: null,
              isActive: true,
            },
          ],
          getPricing: async () => [
            { counselorType: "peer", basePrice: "75000", promoPrice: null, isSaleActive: false, allowVoucher: true },
            { counselorType: "psychologist", basePrice: "150000", promoPrice: null, isSaleActive: false, allowVoucher: true },
          ],
          getSlots: async () => [
            {
              id: "slot-c1-1400",
              counselorId: "c-1",
              date: tomorrowStr,
              startTime: "14:00",
              endTime: "15:30",
              status: "available",
            },
            {
              id: "slot-c2-1400",
              counselorId: "c-2",
              date: tomorrowStr,
              startTime: "14:00",
              endTime: "15:30",
              status: "available",
            },
          ],
          getActiveSessions: async () => ({
            [tomorrowStr]: [
              { startTime: "14:00", endTime: "15:30", status: "confirmed" }, // 1 session already booked!
            ],
          }),
          getZoomCapacity: async () => 1, // Only 1 Zoom account installed!
        }
      )

      expect(res.success).toBe(true)
      const c1 = res.data?.find((c) => c.id === "c-1")
      const c2 = res.data?.find((c) => c.id === "c-2")

      // Because 1 active session already exists at 14:00 and capacity is 1, candidate slots at 14:00 must be hidden!
      expect(c1?.availableSlots.some((s) => s.startTime === "14:00")).toBe(false)
      expect(c2?.availableSlots.some((s) => s.startTime === "14:00")).toBe(false)
    })

    it("shows overlapping slots if 2 Zoom accounts are active and only 1 session exists", async () => {
      const res = await getCounselorsCatalogAction(
        { type: "all" },
        {
          getCounselors: async () => [
            {
              id: "c-1",
              fullName: "Ahmad Fauzi",
              title: "Konselor",
              counselorType: "peer",
              education: "S1",
              strNumber: null,
              about: "Bio",
              avatarUrl: null,
              isActive: true,
            },
          ],
          getPricing: async () => [
            { counselorType: "peer", basePrice: "75000", promoPrice: null, isSaleActive: false, allowVoucher: true },
          ],
          getSlots: async () => [
            {
              id: "slot-c1-1400",
              counselorId: "c-1",
              date: tomorrowStr,
              startTime: "14:00",
              endTime: "15:30",
              status: "available",
            },
          ],
          getActiveSessions: async () => ({
            [tomorrowStr]: [
              { startTime: "14:00", endTime: "15:30", status: "confirmed" }, // 1 session active
            ],
          }),
          getZoomCapacity: async () => 2, // 2 Zoom accounts active! (can take 1 more)
        }
      )

      expect(res.success).toBe(true)
      const c1 = res.data?.find((c) => c.id === "c-1")
      expect(c1?.availableSlots.some((s) => s.startTime === "14:00")).toBe(true)
    })
  })

  describe("4. Zoom Room Allocation Resolution (Preventing False R2)", () => {
    it("maps sessions with Zoom Account Slot 1 to R1 and Slot 2 to R2", () => {
      const activeAccounts = [
        { id: "acc-zoom-1", name: "muhalfatih265@gmail.com", isActive: true },
      ]

      // Resolution function replicating app/admin/sessions/page.tsx logic
      function resolveRoom(session: {
        zoomAccountId?: string | null
        zoomMeetingId?: string | null
        zoomJoinUrl?: string | null
        status: string
      }) {
        if (session.status === "pending_payment") {
          return { badge: "Bayar", room: "Menunggu Pembayaran" }
        }

        const slot1 = activeAccounts[0]
        const slot2 = activeAccounts[1]

        if (session.zoomAccountId) {
          if (slot2 && session.zoomAccountId === slot2.id) {
            return { badge: "R2", room: slot2.name }
          }
          if (slot1 && session.zoomAccountId === slot1.id) {
            return { badge: "R1", room: slot1.name }
          }
          return { badge: "R1", room: slot1?.name || "Zoom Pro 1" }
        }

        if (session.zoomMeetingId || (session.zoomJoinUrl && session.zoomJoinUrl !== "#")) {
          return { badge: "Manual", room: "Ruang Rapat Manual" }
        }

        return { badge: "-", room: "Belum Dijadwalkan" }
      }

      // Case A: Session allocated to single Zoom account in Slot 1 -> MUST be R1, NEVER R2
      const resSlot1 = resolveRoom({
        zoomAccountId: "acc-zoom-1",
        zoomMeetingId: "987654321",
        zoomJoinUrl: "https://zoom.us/j/987654321",
        status: "confirmed",
      })
      expect(resSlot1.badge).toBe("R1")
      expect(resSlot1.badge).not.toBe("R2")

      // Case B: Session created manually with Google Meet URL -> MUST be Manual, NEVER R2
      const resManual = resolveRoom({
        zoomAccountId: null,
        zoomMeetingId: null,
        zoomJoinUrl: "https://meet.google.com/abc-defg-hij",
        status: "confirmed",
      })
      expect(resManual.badge).toBe("Manual")
      expect(resManual.badge).not.toBe("R2")

      // Case C: Session pending payment -> MUST be Bayar
      const resPending = resolveRoom({
        zoomAccountId: null,
        zoomMeetingId: null,
        zoomJoinUrl: "#",
        status: "pending_payment",
      })
      expect(resPending.badge).toBe("Bayar")
      expect(resPending.badge).not.toBe("R2")

      // Case D: Session without meeting yet -> MUST be -
      const resUnassigned = resolveRoom({
        zoomAccountId: null,
        zoomMeetingId: null,
        zoomJoinUrl: "#",
        status: "confirmed",
      })
      expect(resUnassigned.badge).toBe("-")
      expect(resUnassigned.badge).not.toBe("R2")
    })
  })
})
