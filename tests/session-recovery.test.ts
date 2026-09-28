import { describe, it, expect, beforeEach } from "vitest"
import { recoverSessionLinkAction } from "@/lib/session/recovery"
import { PRIVACY_SAFE_SUCCESS_MESSAGE } from "@/lib/session/types"
import { checkRateLimit, _resetRateLimits } from "@/lib/session/rate-limit"

describe("Guest Session Link Recovery & Rate Limiting (Issue #8 / #9)", () => {
  beforeEach(() => {
    _resetRateLimits()
  })

  describe("checkRateLimit", () => {
    it("allows up to 3 requests per 15 minutes per IP and blocks the 4th", async () => {
      const testIp = "192.168.1.50"

      const first = await checkRateLimit(testIp, 3, 60000)
      expect(first.success).toBe(true)
      expect(first.remaining).toBe(2)

      const second = await checkRateLimit(testIp, 3, 60000)
      expect(second.success).toBe(true)
      expect(second.remaining).toBe(1)

      const third = await checkRateLimit(testIp, 3, 60000)
      expect(third.success).toBe(true)
      expect(third.remaining).toBe(0)

      // 4th request must be blocked
      const fourth = await checkRateLimit(testIp, 3, 60000)
      expect(fourth.success).toBe(false)
      expect(fourth.remaining).toBe(0)
    })

    it("tracks different IP addresses separately", async () => {
      const ipA = "10.0.0.1"
      const ipB = "10.0.0.2"

      await checkRateLimit(ipA, 1, 60000)
      const ipABlocked = await checkRateLimit(ipA, 1, 60000)
      expect(ipABlocked.success).toBe(false)

      // ipB should still be allowed
      const ipBAllowed = await checkRateLimit(ipB, 1, 60000)
      expect(ipBAllowed.success).toBe(true)
    })
  })

  describe("recoverSessionLinkAction", () => {
    const mockBookings = [
      {
        accessToken: "token-budi-active-12345",
        patientName: "Budi Santoso",
        patientEmail: "budi.santoso@example.com",
        counselorName: "Sarah Annisa, M.Psi.",
        date: "Selasa, 29 September 2026",
        timeRange: "19:00 – 20:30 WIB",
        status: "confirmed",
      },
    ]

    it("rejects invalid email formats", async () => {
      const res = await recoverSessionLinkAction({
        email: "not-an-email",
        phone: "081234567890",
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("Format email tidak valid")
    })

    it("rejects invalid Indonesian phone numbers", async () => {
      const res = await recoverSessionLinkAction({
        email: "budi@example.com",
        phone: "12345", // too short, invalid prefix
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("Nomor WhatsApp")
    })

    it("sends email and returns privacy-safe message when matching session exists", async () => {
      let emailSent = false
      let recipient = ""

      const res = await recoverSessionLinkAction(
        {
          email: "budi.santoso@example.com",
          phone: "081234567890",
        },
        {
          getClientIp: async () => "172.16.0.1",
          findActiveBookings: async (email, phone) => {
            if (email === "budi.santoso@example.com") return mockBookings
            return []
          },
          sendRecoveryEmail: async (to, sessions) => {
            emailSent = true
            recipient = to
            return true
          },
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toBe(PRIVACY_SAFE_SUCCESS_MESSAGE)
      expect(res.debugMatchesFound).toBe(1)
      expect(emailSent).toBe(true)
      expect(recipient).toBe("budi.santoso@example.com")
    })

    it("returns identical privacy-safe message even when no session is found (anti-enumeration)", async () => {
      let emailSent = false

      const res = await recoverSessionLinkAction(
        {
          email: "unknown.patient@example.com",
          phone: "089999999999",
        },
        {
          getClientIp: async () => "172.16.0.2",
          findActiveBookings: async () => [],
          sendRecoveryEmail: async () => {
            emailSent = true
            return true
          },
        }
      )

      // Must succeed and show the exact same privacy-safe message without revealing non-existence
      expect(res.success).toBe(true)
      expect(res.message).toBe(PRIVACY_SAFE_SUCCESS_MESSAGE)
      expect(res.debugMatchesFound).toBe(0)
      expect(emailSent).toBe(false)
    })

    it("enforces rate limit: blocks the 4th attempt from the same IP within 15 minutes", async () => {
      const clientIp = "203.0.113.42"

      const deps = {
        getClientIp: async () => clientIp,
        findActiveBookings: async () => [],
      }

      // Attempts 1 to 3 should pass
      const res1 = await recoverSessionLinkAction(
        { email: "test1@example.com", phone: "081234567890" },
        deps
      )
      expect(res1.success).toBe(true)

      const res2 = await recoverSessionLinkAction(
        { email: "test2@example.com", phone: "081234567890" },
        deps
      )
      expect(res2.success).toBe(true)

      const res3 = await recoverSessionLinkAction(
        { email: "test3@example.com", phone: "081234567890" },
        deps
      )
      expect(res3.success).toBe(true)

      // Attempt 4 must be rate-limited
      const res4 = await recoverSessionLinkAction(
        { email: "test4@example.com", phone: "081234567890" },
        deps
      )
      expect(res4.success).toBe(false)
      expect(res4.rateLimited).toBe(true)
      expect(res4.error).toContain("Batas permintaan pengecekan tercapai")
    })
  })
})
