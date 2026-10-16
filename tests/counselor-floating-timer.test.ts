import { describe, it, expect, vi } from "vitest"
import {
  getTimerStage,
  calculateExtendFee,
  formatTimerDisplay,
  getTimerProgressPercentage,
  STAGE_CONFIG,
} from "@/lib/counselor/timer"
import {
  recordSessionExtensionAction,
  recordSessionTimerAction,
} from "@/app/counselor/actions"
import type { CounselorAuthContext } from "@/lib/counselor/types"

describe("Ticket 04: Counselor Console, Floating Timer & Extend Fee", () => {
  const counselorAuthPeer: CounselorAuthContext = {
    id: "counselor-user-peer",
    counselorId: "00000000-0000-0000-0000-000000000002", // Dimas (Peer)
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const counselorAuthPsych: CounselorAuthContext = {
    id: "counselor-user-psych",
    counselorId: "00000000-0000-0000-0000-000000000001", // Sarah (Psychologist)
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  // ===========================================================================
  // 1. Timer Stage Progression & SOP Boundaries
  // ===========================================================================
  describe("1. Floating Timer Stage Progression Logic", () => {
    it("returns Green (Normal) stage for duration 0 to 84 minutes", () => {
      // 0 minutes (0s)
      const stage0 = getTimerStage(0)
      expect(stage0.key).toBe("normal")
      expect(stage0.color).toBe("green")

      // 45 minutes (2700s)
      const stage45 = getTimerStage(45 * 60)
      expect(stage45.key).toBe("normal")
      expect(stage45.color).toBe("green")

      // 84 minutes 59 seconds (5099s)
      const stage84 = getTimerStage(84 * 60 + 59)
      expect(stage84.key).toBe("normal")
      expect(stage84.color).toBe("green")
    })

    it("returns Amber stage at minute 85 (5 minutes before standard 90m boundary)", () => {
      // Exactly 85:00 (5100s)
      const stage85 = getTimerStage(85 * 60)
      expect(stage85.key).toBe("warning_85")
      expect(stage85.color).toBe("amber")
      expect(stage85.toastMessage).toContain("5 menit menuju batas standar 90 menit")

      // 89:59 (5399s)
      const stage89 = getTimerStage(89 * 60 + 59)
      expect(stage89.key).toBe("warning_85")
      expect(stage89.color).toBe("amber")
    })

    it("returns Blue stage for 5-minute Grace Period (minutes 90 to 95)", () => {
      // Exactly 90:00 (5400s)
      const stage90 = getTimerStage(90 * 60)
      expect(stage90.key).toBe("grace_period")
      expect(stage90.color).toBe("blue")
      expect(stage90.description).toContain("menit 90–95")

      // 92:30 (5550s)
      const stage92 = getTimerStage(92 * 60 + 30)
      expect(stage92.key).toBe("grace_period")
      expect(stage92.color).toBe("blue")

      // 95:59 (5759s)
      const stage95 = getTimerStage(95 * 60 + 59)
      expect(stage95.key).toBe("grace_period")
      expect(stage95.color).toBe("blue")
    })

    it("returns Orange stage for Session Extension (minutes 96 to 119)", () => {
      // Exactly 96:00 (5760s)
      const stage96 = getTimerStage(96 * 60)
      expect(stage96.key).toBe("extension")
      expect(stage96.color).toBe("orange")
      expect(stage96.toastMessage).toContain("Biaya perpanjangan 30 menit otomatis dihitung")

      // 105:00 (6300s)
      const stage105 = getTimerStage(105 * 60)
      expect(stage105.key).toBe("extension")
      expect(stage105.color).toBe("orange")

      // 119:59 (7199s)
      const stage119 = getTimerStage(119 * 60 + 59)
      expect(stage119.key).toBe("extension")
      expect(stage119.color).toBe("orange")
    })

    it("returns Red stage at minute 120 (hard stop, slot boundary)", () => {
      // Exactly 120:00 (7200s)
      const stage120 = getTimerStage(120 * 60)
      expect(stage120.key).toBe("hard_stop")
      expect(stage120.color).toBe("red")
      expect(stage120.toastMessage).toContain("120 menit")

      // Beyond 120 (e.g. 125m)
      const stage125 = getTimerStage(125 * 60)
      expect(stage125.key).toBe("hard_stop")
      expect(stage125.color).toBe("red")
    })
  })

  // ===========================================================================
  // 2. Extend Fee Calculation Rules
  // ===========================================================================
  describe("2. Extend Fee Calculation Rules", () => {
    it("charges Rp 0 for standard duration <= 90 minutes", () => {
      const res60 = calculateExtendFee(60, "peer")
      expect(res60.isExtended).toBe(false)
      expect(res60.fee).toBe(0)
      expect(res60.extensionMinutes).toBe(0)

      const res90 = calculateExtendFee(90, "psychologist")
      expect(res90.isExtended).toBe(false)
      expect(res90.fee).toBe(0)
    })

    it("charges Rp 0 during 5-minute grace period (90–95 minutes)", () => {
      const res92 = calculateExtendFee(92, "peer")
      expect(res92.isExtended).toBe(false)
      expect(res92.fee).toBe(0)

      const res95 = calculateExtendFee(95, "psychologist")
      expect(res95.isExtended).toBe(false)
      expect(res95.fee).toBe(0)
    })

    it("charges Rp 35.000 for Konselor Sebaya (Peer) starting at minute 96", () => {
      const res96 = calculateExtendFee(96, "peer")
      expect(res96.isExtended).toBe(true)
      expect(res96.extensionMinutes).toBe(30)
      expect(res96.fee).toBe(35000)
      expect(res96.formattedFee).toContain("35.000")

      const res110 = calculateExtendFee(110, "peer")
      expect(res110.fee).toBe(35000)
    })

    it("charges Rp 50.000 for Psikolog Klinis starting at minute 96", () => {
      const res96 = calculateExtendFee(96, "psychologist")
      expect(res96.isExtended).toBe(true)
      expect(res96.extensionMinutes).toBe(30)
      expect(res96.fee).toBe(50000)
      expect(res96.formattedFee).toContain("50.000")
    })

    it("supports custom dynamic rates from platform settings", () => {
      const resCustom = calculateExtendFee(98, "peer", {
        peerRate: 40000,
        psychologistRate: 60000,
      })
      expect(resCustom.fee).toBe(40000)

      const resCustomPsych = calculateExtendFee(98, "psychologist", {
        peerRate: 40000,
        psychologistRate: 60000,
      })
      expect(resCustomPsych.fee).toBe(60000)
    })
  })

  // ===========================================================================
  // 3. Display Formatting & Progress
  // ===========================================================================
  describe("3. Display Formatting & Progress Calculation", () => {
    it("formats MM:SS correctly across all thresholds", () => {
      expect(formatTimerDisplay(0)).toBe("00:00")
      expect(formatTimerDisplay(59)).toBe("00:59")
      expect(formatTimerDisplay(60)).toBe("01:00")
      expect(formatTimerDisplay(85 * 60)).toBe("85:00")
      expect(formatTimerDisplay(85 * 60 + 5)).toBe("85:05")
      expect(formatTimerDisplay(95 * 60 + 59)).toBe("95:59")
      expect(formatTimerDisplay(96 * 60)).toBe("96:00")
      expect(formatTimerDisplay(120 * 60)).toBe("120:00")
    })

    it("calculates progress percentage towards 120-minute maximum", () => {
      expect(getTimerProgressPercentage(0)).toBe(0)
      expect(getTimerProgressPercentage(60 * 60)).toBe(50) // 60/120 = 50%
      expect(getTimerProgressPercentage(90 * 60)).toBe(75) // 90/120 = 75%
      expect(getTimerProgressPercentage(120 * 60)).toBe(100)
      expect(getTimerProgressPercentage(130 * 60)).toBe(100) // capped at 100%
    })
  })

  // ===========================================================================
  // 4. Server Actions: Database Extension Recording
  // ===========================================================================
  describe("4. recordSessionExtensionAction & recordSessionTimerAction", () => {
    const validBookingId = "123e4567-e89b-12d3-a456-426614174000"

    it("rejects invalid booking UUID", async () => {
      const res = await recordSessionExtensionAction("invalid-uuid", {
        currentUser: counselorAuthPeer,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("tidak valid")
    })

    it("rejects unauthenticated requests", async () => {
      const res = await recordSessionExtensionAction(validBookingId, {
        currentUser: null,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("successfully records Rp 35.000 extend fee for Peer Counselor in database", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: validBookingId }]),
        }),
      })

      const mockDb: any = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    booking: { id: validBookingId },
                    counselor: {
                      id: counselorAuthPeer.counselorId,
                      counselorType: "peer",
                    },
                  },
                ]),
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // no custom settings, use defaults
            }),
          }),
        }),
        update: mockUpdate,
      }

      const res = await recordSessionExtensionAction(validBookingId, {
        currentUser: counselorAuthPeer,
        dbClient: mockDb,
      })

      expect(res.success).toBe(true)
      expect(res.data?.isExtended).toBe(true)
      expect(res.data?.extensionMinutes).toBe(30)
      expect(res.data?.fee).toBe(35000)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it("successfully records Rp 50.000 extend fee for Psychologist in database", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: validBookingId }]),
        }),
      })

      const mockDb: any = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    booking: { id: validBookingId },
                    counselor: {
                      id: counselorAuthPsych.counselorId,
                      counselorType: "psychologist",
                    },
                  },
                ]),
              }),
            }),
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        update: mockUpdate,
      }

      const res = await recordSessionExtensionAction(validBookingId, {
        currentUser: counselorAuthPsych,
        dbClient: mockDb,
      })

      expect(res.success).toBe(true)
      expect(res.data?.isExtended).toBe(true)
      expect(res.data?.extensionMinutes).toBe(30)
      expect(res.data?.fee).toBe(50000)
    })

    it("records timer metadata in session_reports via recordSessionTimerAction", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "rep-1" }]),
        }),
      })

      const mockDb: any = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: validBookingId }]),
            }),
          }),
        }),
        update: mockUpdate,
      }

      const res = await recordSessionTimerAction(
        validBookingId,
        {
          actualDurationMinutes: 98,
          timerStartedAt: new Date(Date.now() - 98 * 60 * 1000).toISOString(),
          timerStoppedAt: new Date().toISOString(),
        },
        {
          currentUser: counselorAuthPeer,
          dbClient: mockDb,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.actualDurationMinutes).toBe(98)
    })
  })
})
