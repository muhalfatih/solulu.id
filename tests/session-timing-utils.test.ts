import { describe, it, expect } from "vitest"
import {
  resolveSessionTimingAndStatus,
  groupSessionsByTime,
  normalizeDateString,
} from "@/components/admin/session-utils"
import type { BookingSession } from "@/lib/types/admin"

describe("Session Timing & Status Resolution Utils", () => {
  it("normalizes Date objects and ISO strings correctly", () => {
    expect(normalizeDateString("2026-10-12")).toBe("2026-10-12")
    expect(normalizeDateString("2026-10-12T07:00:00.000Z")).toBe("2026-10-12")
    expect(normalizeDateString(new Date(2026, 9, 12))).toBe("2026-10-12")
    expect(normalizeDateString(null)).toBe("")
  })

  it("marks pending_payment as expired when startTime has passed", () => {
    // Current time: 2026-10-12 11:00
    const now = new Date(2026, 9, 12, 11, 0, 0)

    // Session that was at 09:00 - 10:30 (startTime in the past)
    const result = resolveSessionTimingAndStatus(
      {
        date: "2026-10-12",
        startTime: "09:00:00",
        endTime: "10:30:00",
        status: "pending_payment",
      },
      now
    )

    expect(result.status).toBe("expired")
    expect(result.isPast).toBe(true)
    expect(result.isExpired).toBe(true)
    expect(result.hoursUntilSession).toBeLessThan(0)
  })

  it("keeps pending_payment active when session is in the future", () => {
    const now = new Date(2026, 9, 12, 11, 0, 0)

    // Session scheduled for 14:00 - 15:30 (future)
    const result = resolveSessionTimingAndStatus(
      {
        date: "2026-10-12",
        startTime: "14:00:00",
        endTime: "15:30:00",
        status: "pending_payment",
      },
      now
    )

    expect(result.status).toBe("pending_payment")
    expect(result.isPast).toBe(false)
    expect(result.isExpired).toBe(false)
    expect(result.hoursUntilSession).toBe(3)
  })

  it("resolves confirmed sessions to in_session during the session window", () => {
    const now = new Date(2026, 9, 12, 14, 15, 0) // 14:15

    const result = resolveSessionTimingAndStatus(
      {
        date: "2026-10-12",
        startTime: "14:00:00",
        endTime: "15:30:00",
        status: "confirmed",
      },
      now
    )

    expect(result.status).toBe("in_session")
    expect(result.isOngoing).toBe(true)
    expect(result.isPast).toBe(false)
  })

  it("resolves confirmed sessions to completed after endTime has passed", () => {
    const now = new Date(2026, 9, 12, 16, 0, 0) // 16:00

    const result = resolveSessionTimingAndStatus(
      {
        date: "2026-10-12",
        startTime: "14:00:00",
        endTime: "15:30:00",
        status: "confirmed",
      },
      now
    )

    expect(result.status).toBe("completed")
    expect(result.isPast).toBe(true)
  })

  it("correctly groups upcoming vs past sessions", () => {
    const sessions = [
      { id: "1", status: "confirmed", isPast: false } as BookingSession,
      { id: "2", status: "in_session", isPast: false } as BookingSession,
      { id: "3", status: "pending_payment", isPast: false } as BookingSession,
      { id: "4", status: "expired", isPast: true } as BookingSession,
      { id: "5", status: "completed", isPast: true } as BookingSession,
      { id: "6", status: "cancelled", isPast: true } as BookingSession,
    ]

    const { upcomingSessions, pastSessions } = groupSessionsByTime(sessions)

    expect(upcomingSessions.map((s) => s.id)).toEqual(["1", "2", "3"])
    expect(pastSessions.map((s) => s.id)).toEqual(["4", "5", "6"])
  })
})
