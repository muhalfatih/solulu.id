import { describe, it, expect } from "vitest"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings } from "@/db/schema"
import {
  FIXED_SLOTS,
  type FixedSlot,
} from "@/lib/operator/types"
import {
  determineSlotMode,
  formatBreakoutRoomName,
  generateBatchBreakoutNames,
  generateWaitingRoomChatTemplate,
  dispatchZoomForSession,
  getTodayWibDateString,
  getCurrentSlotIndex,
} from "@/lib/operator/dispatcher"
import {
  getOperatorSlotMatrixAction,
  admitParticipantAction,
  unadmitParticipantAction,
} from "@/app/operator/actions"

describe("Ticket 2: Operator Slot Matrix and Zoom Dispatcher", () => {
  describe("1. 7 Fixed Slots Specification (08.00–22.00 WIB)", () => {
    it("defines exactly 7 fixed slots covering the full operational window", () => {
      expect(FIXED_SLOTS).toHaveLength(7)
      const slotIndices = FIXED_SLOTS.map((s) => s.slotIndex)
      expect(slotIndices).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it("verifies that each slot is exactly 2 hours (120 minutes)", () => {
      FIXED_SLOTS.forEach((slot: FixedSlot) => {
        const [startH, startM] = slot.startTime.split(":").map(Number)
        const [endH, endM] = slot.endTime.split(":").map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        const duration = endMinutes - startMinutes

        expect(duration).toBe(120)
      })
    })

    it("matches exact SOP time windows", () => {
      expect(FIXED_SLOTS[0]).toMatchObject({
        slotIndex: 1,
        startTime: "08:00:00",
        endTime: "10:00:00",
        displayTime: "08.00 – 10.00 WIB",
      })
      expect(FIXED_SLOTS[6]).toMatchObject({
        slotIndex: 7,
        startTime: "20:00:00",
        endTime: "22:00:00",
        displayTime: "20.00 – 22.00 WIB",
      })
    })
  })

  describe("2. Slot Mode Determination: Standalone Mode vs Zoom 4 Breakout Mode", () => {
    it("assigns Standalone Mode for 0 to 4 sessions in a slot", () => {
      expect(determineSlotMode(0)).toBe("standalone")
      expect(determineSlotMode(1)).toBe("standalone")
      expect(determineSlotMode(2)).toBe("standalone")
      expect(determineSlotMode(3)).toBe("standalone")
      expect(determineSlotMode(4)).toBe("standalone")
    })

    it("switches to Zoom 4 Breakout Mode when slot has more than 4 sessions", () => {
      expect(determineSlotMode(5)).toBe("breakout_room")
      expect(determineSlotMode(6)).toBe("breakout_room")
      expect(determineSlotMode(10)).toBe("breakout_room")
    })
  })

  describe("3. Breakout Room Name Formatting & 1-Click Copy String", () => {
    it("formats the exact string [Kode Booking] - [Nama Konselor]", () => {
      const roomName = formatBreakoutRoomName("SL-4821", "Dimas (Konselor)")
      expect(roomName).toBe("SL-4821 - Dimas (Konselor)")
    })

    it("trims excess whitespace and handles edge cases cleanly", () => {
      expect(formatBreakoutRoomName("  SL-1001  ", "  Dr. Sarah  ")).toBe(
        "SL-1001 - Dr. Sarah"
      )
      expect(formatBreakoutRoomName("SL-9999", "")).toBe("SL-9999")
      expect(formatBreakoutRoomName("", "Konselor Maya")).toBe("Konselor Maya")
    })

    it("generates multiline batch string for 'Salin Batch Nama Breakout'", () => {
      const sessions = [
        { bookingCode: "SL-4001", counselorName: "Konselor Budi" },
        { bookingCode: "SL-4002", counselorName: "Psikolog Sarah" },
        { bookingCode: "SL-4003", counselorName: "Konselor Rina" },
      ]

      const batchString = generateBatchBreakoutNames(sessions)
      expect(batchString).toBe(
        "SL-4001 - Konselor Budi\nSL-4002 - Psikolog Sarah\nSL-4003 - Konselor Rina"
      )
    })
  })

  describe("4. Waiting Room Chat Guidance Template", () => {
    it("generates personalized rename template with booking code and client name", () => {
      const template = generateWaitingRoomChatTemplate({
        bookingCode: "SL-4821",
        patientName: "Dimas",
      })

      expect(template).toContain("Halo Kak Dimas")
      expect(template).toContain("SL-4821 - Dimas")
      expect(template).toContain("Participants")
      expect(template).toContain("Rename")
      expect(template).toContain("Breakout Room")
    })

    it("generates general fallback template when client details are omitted", () => {
      const template = generateWaitingRoomChatTemplate()
      expect(template).toContain("Halo Kak,")
      expect(template).toContain("[Kode Booking] - [Nama Panggilan]")
      expect(template).toContain("Breakout Room")
    })
  })

  describe("5. 4 Zoom Pro Accounts Hybrid Dispatching Algorithm", () => {
    it("dispatches sessions 1 to 3 to standalone accounts 1, 2, and 3", () => {
      expect(dispatchZoomForSession(1, 6)).toEqual({
        accountNumber: 1,
        mode: "standalone",
      })
      expect(dispatchZoomForSession(2, 6)).toEqual({
        accountNumber: 2,
        mode: "standalone",
      })
      expect(dispatchZoomForSession(3, 6)).toEqual({
        accountNumber: 3,
        mode: "standalone",
      })
    })

    it("dispatches session 4 to standalone if total sessions <= 4", () => {
      expect(dispatchZoomForSession(4, 4)).toEqual({
        accountNumber: 4,
        mode: "standalone",
      })
    })

    it("dispatches session 4 to breakout_room if total sessions > 4", () => {
      expect(dispatchZoomForSession(4, 5)).toEqual({
        accountNumber: 4,
        mode: "breakout_room",
      })
    })

    it("dispatches sessions 5 to 10 to Zoom 4 in breakout_room mode", () => {
      expect(dispatchZoomForSession(5, 7)).toEqual({
        accountNumber: 4,
        mode: "breakout_room",
      })
      expect(dispatchZoomForSession(10, 10)).toEqual({
        accountNumber: 4,
        mode: "breakout_room",
      })
    })
  })

  const testOperatorAuth = {
    id: "test-operator-id",
    app_metadata: { role: "operator" },
    user_metadata: { role: "operator", email: "operator@solulu.id" },
  }

  describe("6. Server Action: Slot Matrix Query & Strict Privacy Isolation", () => {
    it("queries PostgreSQL and returns 7 slots with live data", async () => {
      const matrix = await getOperatorSlotMatrixAction("2026-10-15", { currentUser: testOperatorAuth })

      expect(matrix.slots).toHaveLength(7)
      expect(matrix.date).toBe("2026-10-15")
      expect(matrix.summary).toBeDefined()
      expect(matrix.maxQuota).toBeGreaterThanOrEqual(10)

      // Verify that every slot has valid fixed structure
      matrix.slots.forEach((slot, index) => {
        expect(slot.slotIndex).toBe(index + 1)
        expect(slot.displayTime).toBeDefined()
        expect(["standalone", "breakout_room"]).toContain(slot.mode)
        expect(Array.isArray(slot.sessions)).toBe(true)
      })
    })

    it("STRICT PRIVACY GUARD: never exposes clinical notes or financial transactions to operator", async () => {
      const matrix = await getOperatorSlotMatrixAction("2026-10-15", { currentUser: testOperatorAuth })

      matrix.slots.forEach((slot) => {
        slot.sessions.forEach((session) => {
          // Clinical notes fields that MUST NOT exist on operator payload
          const anySession = session as any
          expect(anySession.internalNotes).toBeUndefined()
          expect(anySession.mainIssue).toBeUndefined()
          expect(anySession.summary).toBeUndefined()
          expect(anySession.actionPlan).toBeUndefined()
          expect(anySession.attachmentR2Keys).toBeUndefined()

          // Financial fields that MUST NOT exist on operator payload
          expect(anySession.grossAmount).toBeUndefined()
          expect(anySession.netAmount).toBeUndefined()
          expect(anySession.discountAmount).toBeUndefined()
          expect(anySession.manualPaymentProofR2Key).toBeUndefined()
          expect(anySession.extensionFee).toBeUndefined()
        })
      })
    })
  })

  describe("7. Server Action: Admit Participant Mutation", () => {
    it("updates operator_admitted_at timestamp in PostgreSQL", async () => {
      // Find a real booking in the database
      const existingBookings = await db
        .select({ id: bookings.id, operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .limit(1)

      expect(existingBookings.length).toBeGreaterThan(0)
      const testBooking = existingBookings[0]

      // 1. Execute admit action
      const admitResult = await admitParticipantAction(
        { bookingId: testBooking.id },
        { currentUser: testOperatorAuth }
      )

      expect(admitResult.success).toBe(true)
      expect(admitResult.bookingId).toBe(testBooking.id)
      expect(admitResult.admittedAt).toBeDefined()

      // 2. Query database directly to verify real persistence
      const [persisted] = await db
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, testBooking.id))

      expect(persisted.operatorAdmittedAt).not.toBeNull()

      // 3. Test unadmit action to verify reversibility and cleanup
      const unadmitResult = await unadmitParticipantAction(
        { bookingId: testBooking.id },
        { currentUser: testOperatorAuth }
      )
      expect(unadmitResult.success).toBe(true)

      const [reverted] = await db
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, testBooking.id))

      expect(reverted.operatorAdmittedAt).toBeNull()
    })

    it("returns descriptive error if booking ID is invalid", async () => {
      const res = await admitParticipantAction(
        { bookingId: "00000000-0000-0000-0000-000000000000" },
        { currentUser: testOperatorAuth }
      )
      expect(res.success).toBe(false)
      expect(res.error).toBe("Pemesanan tidak ditemukan")
    })
  })
})
