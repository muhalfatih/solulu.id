import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchZoomOAuthToken,
  getZoomAccessToken,
  verifyZoomCredentials,
  createZoomMeeting,
  type ZoomAccountRecord,
} from "../lib/zoom/client"

describe("Zoom S2S OAuth Client & Meeting Integration (lib/zoom/client.ts)", () => {
  const mockAccount: ZoomAccountRecord = {
    id: "zoom-acc-1",
    name: "Akun Zoom Pro 1",
    email: "zoom1@solulu.id",
    accountId: "zm_acc_123",
    clientId: "zm_cli_456",
    clientSecretEncrypted: "encrypted_secret",
    cachedAccessToken: null,
    tokenExpiresAt: null,
    isActive: true,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("fetchZoomOAuthToken", () => {
    it("fetches access token via S2S OAuth with basic auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "mock-s2s-token-xyz",
          token_type: "bearer",
          expires_in: 3599,
          scope: "meeting:write:admin",
        }),
      })

      const tokenData = await fetchZoomOAuthToken(
        {
          accountId: "zm_acc_123",
          clientId: "zm_cli_456",
          clientSecret: "my_secret_key",
        },
        { fetchFn: mockFetch }
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain("https://zoom.us/oauth/token")
      expect(url).toContain("grant_type=account_credentials")
      expect(url).toContain("account_id=zm_acc_123")

      const expectedBasic = Buffer.from("zm_cli_456:my_secret_key").toString("base64")
      expect(options.headers["Authorization"]).toBe(`Basic ${expectedBasic}`)
      expect(tokenData.accessToken).toBe("mock-s2s-token-xyz")
      expect(tokenData.expiresIn).toBe(3599)
    })

    it("throws an informative error if Zoom OAuth request fails", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          code: 401,
          message: "Invalid client_id or client_secret",
        }),
      })

      await expect(
        fetchZoomOAuthToken(
          {
            accountId: "zm_acc_123",
            clientId: "bad_client",
            clientSecret: "bad_secret",
          },
          { fetchFn: mockFetch }
        )
      ).rejects.toThrow("Zoom OAuth Error (401): Invalid client_id or client_secret")
    })
  })

  describe("getZoomAccessToken (Caching with 3500s TTL)", () => {
    it("returns cached token if still valid without making HTTP request", async () => {
      const futureExpiry = new Date(Date.now() + 2000 * 1000) // 2000s in the future
      const accountWithCache: ZoomAccountRecord = {
        ...mockAccount,
        cachedAccessToken: "existing-valid-cached-token",
        tokenExpiresAt: futureExpiry,
      }

      const mockFetch = vi.fn()
      const mockUpdate = vi.fn()

      const token = await getZoomAccessToken(accountWithCache, {
        fetchFn: mockFetch,
        updateDbToken: mockUpdate,
        decryptFn: () => "my_secret_key",
      })

      expect(token).toBe("existing-valid-cached-token")
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it("fetches new token and updates DB with 3500s TTL if token is expired or null", async () => {
      const pastExpiry = new Date(Date.now() - 100 * 1000) // 100s in the past
      const expiredAccount: ZoomAccountRecord = {
        ...mockAccount,
        cachedAccessToken: "old-expired-token",
        tokenExpiresAt: pastExpiry,
      }

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "refreshed-new-token",
          token_type: "bearer",
          expires_in: 3600,
        }),
      })
      const mockUpdate = vi.fn().mockResolvedValue(true)

      const token = await getZoomAccessToken(expiredAccount, {
        fetchFn: mockFetch,
        updateDbToken: mockUpdate,
        decryptFn: () => "my_secret_key",
      })

      expect(token).toBe("refreshed-new-token")
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockUpdate).toHaveBeenCalledTimes(1)

      const [accountId, updateData] = mockUpdate.mock.calls[0]
      expect(accountId).toBe(expiredAccount.id)
      expect(updateData.cachedAccessToken).toBe("refreshed-new-token")
      // Check TTL: expiresAt should be roughly now + 3500s
      const diffSec = (updateData.tokenExpiresAt.getTime() - Date.now()) / 1000
      expect(diffSec).toBeGreaterThan(3400)
      expect(diffSec).toBeLessThanOrEqual(3501)
    })
  })

  describe("verifyZoomCredentials", () => {
    it("returns valid: true when OAuth handshake succeeds", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "verified-token",
          token_type: "bearer",
          expires_in: 3600,
        }),
      })

      const result = await verifyZoomCredentials(
        {
          accountId: "zm_acc_123",
          clientId: "zm_cli_456",
          clientSecret: "zm_sec_789",
        },
        { fetchFn: mockFetch }
      )

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("returns valid: false with message when credentials fail", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          code: 400,
          message: "Account not found or credentials incorrect",
        }),
      })

      const result = await verifyZoomCredentials(
        {
          accountId: "zm_acc_invalid",
          clientId: "zm_cli_456",
          clientSecret: "zm_sec_789",
        },
        { fetchFn: mockFetch }
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Account not found or credentials incorrect")
    })
  })

  describe("createZoomMeeting", () => {
    it("creates a 90-minute session with waiting room and returns URLs and password", async () => {
      const mockMeetingResponse = {
        id: 98765432101,
        join_url: "https://us05web.zoom.us/j/98765432101?pwd=abc",
        start_url: "https://us05web.zoom.us/s/98765432101?zak=xyz",
        password: "secretpassword123",
      }

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMeetingResponse,
      })

      const result = await createZoomMeeting(
        "valid-bearer-token",
        {
          topic: "Sesi Konseling Solulu - Budi Santoso",
          startTime: "2026-09-28T19:00:00+07:00",
        },
        { fetchFn: mockFetch }
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe("https://api.zoom.us/v2/users/me/meetings")
      expect(options.method).toBe("POST")
      expect(options.headers["Authorization"]).toBe("Bearer valid-bearer-token")

      const body = JSON.parse(options.body)
      expect(body.topic).toBe("Sesi Konseling Solulu - Budi Santoso")
      expect(body.duration).toBe(90) // 90 minutes fixed duration
      expect(body.timezone).toBe("Asia/Jakarta")
      expect(body.settings.waiting_room).toBe(true)
      expect(body.settings.join_before_host).toBe(false)

      expect(result.meetingId).toBe("98765432101")
      expect(result.joinUrl).toBe(mockMeetingResponse.join_url)
      expect(result.startUrl).toBe(mockMeetingResponse.start_url)
      expect(result.password).toBe("secretpassword123")
    })
  })
})
