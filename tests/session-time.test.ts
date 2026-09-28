import { describe, it, expect } from "vitest"
import {
  parseWibDateTime,
  calculateSessionTimeInfo,
  getSessionCountdown,
  formatIndonesianDate,
} from "@/lib/session/time"

describe("Session Time & Countdown Calculations", () => {
  const dateStr = "2026-09-28"
  const startTime = "19:00:00"
  const endTime = "20:30:00"

  it("correctly parses WIB (UTC+7) timestamps consistently regardless of local timezone", () => {
    const parsed = parseWibDateTime(dateStr, startTime)
    // 19:00:00 WIB is 12:00:00 UTC
    expect(parsed.toISOString()).toBe("2026-09-28T12:00:00.000Z")
  })

  it("handles time formats with or without seconds", () => {
    const withSec = parseWibDateTime("2026-09-28", "19:00:00")
    const withoutSec = parseWibDateTime("2026-09-28", "19:00")
    expect(withSec.getTime()).toBe(withoutSec.getTime())
  })

  describe("Session Time States & Zoom Lock Rules (US-16, US-17)", () => {
    it("locks Zoom button when more than 10 minutes before session start (UPCOMING_LOCKED)", () => {
      // 18:45:00 WIB (15 minutes before start)
      const now = new Date("2026-09-28T18:45:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("UPCOMING_LOCKED")
      expect(info.isZoomActive).toBe(false)
      expect(info.msUntilStart).toBe(15 * 60 * 1000)
      expect(info.msUntilUnlock).toBe(5 * 60 * 1000)
    })

    it("unlocks Zoom button exactly 10 minutes before session start (ROOM_OPEN_PREPARING)", () => {
      // 18:50:00 WIB (exactly 10 minutes before start)
      const now = new Date("2026-09-28T18:50:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("ROOM_OPEN_PREPARING")
      expect(info.isZoomActive).toBe(true)
      expect(info.msUntilStart).toBe(10 * 60 * 1000)
      expect(info.msUntilUnlock).toBe(0)
    })

    it("keeps Zoom button active during preparation window (e.g. 5 minutes before)", () => {
      // 18:55:00 WIB
      const now = new Date("2026-09-28T18:55:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("ROOM_OPEN_PREPARING")
      expect(info.isZoomActive).toBe(true)
      expect(info.msUntilStart).toBe(5 * 60 * 1000)
    })

    it("keeps Zoom button active while session is IN_PROGRESS", () => {
      // 19:30:00 WIB (30 minutes into the 90-minute session)
      const now = new Date("2026-09-28T19:30:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("IN_PROGRESS")
      expect(info.isZoomActive).toBe(true)
      expect(info.msUntilEnd).toBe(60 * 60 * 1000)
    })

    it("keeps Zoom active at exact end boundary (20:30:00 WIB)", () => {
      const now = new Date("2026-09-28T20:30:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("IN_PROGRESS")
      expect(info.isZoomActive).toBe(true)
      expect(info.msUntilEnd).toBe(0)
    })

    it("marks session as ENDED and locks Zoom button after session end time", () => {
      // 20:30:01 WIB (1 second past end)
      const now = new Date("2026-09-28T20:30:01+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)

      expect(info.state).toBe("ENDED")
      expect(info.isZoomActive).toBe(false)
      expect(info.msUntilEnd).toBe(0)
    })
  })

  describe("Countdown Formatting", () => {
    it("formats countdown correctly before session starts", () => {
      // 1 hour 25 minutes 10 seconds before start
      const now = new Date("2026-09-28T17:34:50+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)
      const countdown = getSessionCountdown(info, now)

      expect(countdown.hours).toBe(1)
      expect(countdown.minutes).toBe(25)
      expect(countdown.seconds).toBe(10)
      expect(countdown.formatted).toBe("01:25:10")
      expect(countdown.label).toBe("Sesi dimulai dalam")
    })

    it("formats countdown during room preparation", () => {
      // 7 minutes 30 seconds before start
      const now = new Date("2026-09-28T18:52:30+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)
      const countdown = getSessionCountdown(info, now)

      expect(countdown.hours).toBe(0)
      expect(countdown.minutes).toBe(7)
      expect(countdown.seconds).toBe(30)
      expect(countdown.formatted).toBe("00:07:30")
      expect(countdown.label).toContain("Ruang Zoom siap")
    })

    it("formats countdown for days ahead", () => {
      // 2 days before
      const now = new Date("2026-09-26T19:00:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)
      const countdown = getSessionCountdown(info, now)

      expect(countdown.days).toBe(2)
      expect(countdown.formatted).toContain("2h")
    })

    it("shows zero state when ended", () => {
      const now = new Date("2026-09-28T21:00:00+07:00")
      const info = calculateSessionTimeInfo(dateStr, startTime, endTime, now)
      const countdown = getSessionCountdown(info, now)

      expect(countdown.isZero).toBe(true)
      expect(countdown.formatted).toBe("00:00:00")
      expect(countdown.label).toBe("Sesi telah berakhir")
    })
  })

  describe("Indonesian Date Formatting", () => {
    it("formats date to Indonesian weekday and full date", () => {
      const formatted = formatIndonesianDate("2026-09-28")
      expect(formatted).toBe("Senin, 28 September 2026")
    })
  })
})
