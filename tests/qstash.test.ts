import { describe, it, expect, vi } from "vitest"
import { dispatchFulfillmentJob } from "@/lib/fulfillment/qstash"
import { POST as fulfillJobHandler } from "@/app/api/jobs/fulfill-booking/route"
import { handleCronRequest } from "@/lib/cron/handler"

describe("Upstash QStash Asynchronous Processing & Cron Architecture (ADR-0001 / US-55 / US-56 / US-58)", () => {
  describe("dispatchFulfillmentJob (Dispatcher)", () => {
    it("uses direct async fulfillment in dev/test environment by default", async () => {
      let directCalledWith: string | null = null
      const mockDirectFulfill = vi.fn().mockImplementation(async (id: string) => {
        directCalledWith = id
        return { success: true }
      })

      const res = await dispatchFulfillmentJob("booking-dev-123", {
        directFulfillFn: mockDirectFulfill,
      })

      expect(res.success).toBe(true)
      expect(res.directExecuted).toBe(true)
      expect(res.messageId).toBe("mock_qstash_msg_id")
      expect(directCalledWith).toBe("booking-dev-123")
    })

    it("publishes to Upstash QStash REST API with unencoded destination URL and retries header when forceRemote is true", async () => {
      let requestedUrl = ""
      let requestedHeaders: Record<string, string> = {}
      let requestedBody = ""

      const mockFetch = vi.fn().mockImplementation(async (url: string, init: any) => {
        requestedUrl = url
        requestedHeaders = init.headers
        requestedBody = init.body
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "msg_qstash_published_999" }),
        }
      })

      const res = await dispatchFulfillmentJob("booking-live-456", {
        forceRemote: true,
        overrideToken: "test_qstash_secret_token",
        overrideUrl: "https://qstash.upstash.io/v2",
        fetchFn: mockFetch as any,
      })

      expect(res.success).toBe(true)
      expect(res.messageId).toBe("msg_qstash_published_999")

      // CRITICAL: URL must NOT be double encoded or encodeURIComponent
      expect(requestedUrl).toContain("/publish/https://")
      expect(requestedUrl).toContain("/api/jobs/fulfill-booking")
      expect(requestedUrl).not.toContain("https%3A%2F%2F")

      // Headers check
      expect(requestedHeaders["Authorization"]).toBe("Bearer test_qstash_secret_token")
      expect(requestedHeaders["Content-Type"]).toBe("application/json")
      expect(requestedHeaders["Upstash-Retries"]).toBe("3") // 3x retry per spec US-56

      // Body check
      expect(JSON.parse(requestedBody)).toEqual({ bookingId: "booking-live-456" })
    })

    it("gracefully triggers direct fulfillment fallback if QStash API returns an error response", async () => {
      let fallbackTriggered = false
      const mockDirectFulfill = vi.fn().mockImplementation(async () => {
        fallbackTriggered = true
        return { success: true }
      })

      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 500,
          text: async () => "Internal QStash Server Error",
        }
      })

      const res = await dispatchFulfillmentJob("booking-fail-789", {
        forceRemote: true,
        overrideToken: "valid_token",
        fetchFn: mockFetch as any,
        directFulfillFn: mockDirectFulfill,
      })

      expect(res.success).toBe(false)
      expect(fallbackTriggered).toBe(true)
    })

    it("gracefully triggers direct fulfillment fallback on network connection failure", async () => {
      let fallbackTriggered = false
      const mockDirectFulfill = vi.fn().mockImplementation(async () => {
        fallbackTriggered = true
        return { success: true }
      })

      const mockFetch = vi.fn().mockImplementation(async () => {
        throw new Error("Network timeout to QStash")
      })

      const res = await dispatchFulfillmentJob("booking-net-err", {
        forceRemote: true,
        overrideToken: "valid_token",
        fetchFn: mockFetch as any,
        directFulfillFn: mockDirectFulfill,
      })

      expect(res.success).toBe(false)
      expect(fallbackTriggered).toBe(true)
    })
  })

  describe("/api/jobs/fulfill-booking Worker", () => {
    it("rejects request if missing bookingId with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/jobs/fulfill-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "upstash-signature": "sig_test_123",
        },
        body: JSON.stringify({}),
      })

      const res = await fulfillJobHandler(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Missing bookingId")
    })

    it("accepts valid request with upstash-signature and handles payload", async () => {
      const req = new Request("http://localhost:3000/api/jobs/fulfill-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "upstash-signature": "valid-qstash-signature-jwt",
        },
        body: JSON.stringify({ bookingId: "non-existent-booking-test" }),
      })

      const res = await fulfillJobHandler(req)
      // When booking is not found in DB, it returns 500 to let QStash automatically retry
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.success).toBe(false)
    })
  })

  describe("/api/cron/cleanup-slots QStash Cron Scheduler", () => {
    it("rejects unauthorized cron requests with HTTP 401 when missing bearer token", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup-slots", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-secret",
        },
      })

      const res = await handleCronRequest(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toContain("Unauthorized")
    })

    it("accepts authorized cron request with valid CRON_SECRET and executes atomic cleanup", async () => {
      let cleanupRan = false
      const mockCleanup = vi.fn().mockImplementation(async () => {
        cleanupRan = true
        return {
          success: true,
          releasedSlotsCount: 1,
          cancelledBookingsCount: 1,
          expiredTransactionsCount: 1,
          vouchersRolledBackCount: 0,
          autoArchivedSessionsCount: 2,
        }
      })

      const req = new Request("http://localhost:3000/api/cron/cleanup-slots", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-cron-secret",
        },
      })

      const res = await handleCronRequest(req, { cleanupFn: mockCleanup })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(cleanupRan).toBe(true)
      expect(data.data.releasedSlotsCount).toBe(1)
      expect(data.data.autoArchivedSessionsCount).toBe(2)
    })
  })
})
