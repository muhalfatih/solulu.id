import { describe, it, expect, vi } from "vitest"
import { fulfillSession, fulfillBooking } from "@/lib/fulfillment/fulfill"
import { confirmManualPayment } from "@/lib/fulfillment/manual"
import { POST as xenditWebhookHandler } from "@/app/api/webhooks/xendit/route"
import { POST as fulfillJobHandler } from "@/app/api/jobs/fulfill-booking/route"

describe("Deep Module: Session Fulfillment (Pemenuhan Sesi & Dispatcher 4 Zoom)", () => {
  const mockZoomAccounts = [
    {
      id: "zoom-acc-1",
      name: "Akun Zoom Pro 1",
      accountNumber: 1,
      email: "zoom1@solulu.id",
      accountId: "acc-1",
      clientId: "client-1",
      clientSecretEncrypted: "encrypted-secret-1",
      hostKey: "123456",
      isActive: true,
    },
    {
      id: "zoom-acc-2",
      name: "Akun Zoom Pro 2",
      accountNumber: 2,
      email: "zoom2@solulu.id",
      accountId: "acc-2",
      clientId: "client-2",
      clientSecretEncrypted: "encrypted-secret-2",
      hostKey: "234567",
      isActive: true,
    },
    {
      id: "zoom-acc-4",
      name: "Akun Zoom Pro 4",
      accountNumber: 4,
      email: "zoom4@solulu.id",
      accountId: "acc-4",
      clientId: "client-4",
      clientSecretEncrypted: "encrypted-secret-4",
      hostKey: "456789",
      isActive: true,
    },
  ]

  const mockBookingData = {
    booking: {
      id: "b-12345",
      bookingCode: "SL-1001",
      accessToken: "tok_test_abc12345",
      patientName: "Budi Santoso",
      patientEmail: "budi@example.com",
      initialNotes: "Perlu pendampingan stres kerja",
      zoomJoinUrl: null,
      zoomStartUrl: null,
      zoomMeetingId: null,
      zoomAccountId: null,
    },
    counselor: {
      id: "c-12345",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      email: "sarah@solulu.id",
    },
    schedule: {
      id: "s-12345",
      date: "2026-09-29",
      slotIndex: 1,
      startTime: "08:00:00",
      endTime: "10:00:00",
    },
  }

  // =========================================================================
  // 1. Unified Fulfillment Seam & 4-Zoom Hybrid Dispatcher (ADR-0005)
  // =========================================================================
  describe("1. Canonical 4-Zoom Dispatcher & Meeting Generation", () => {
    it("allocates Zoom 1 in standalone mode for initial booking in slot", async () => {
      let patientEmailSent = false
      let counselorEmailSent = false

      const result = await fulfillSession("b-12345", {
        fetchBookingData: async () => mockBookingData,
        getZoomAccount: async (accNum) => mockZoomAccounts.find((a) => a.accountNumber === accNum),
        getAccessToken: async () => "mock_valid_access_token",
        createMeeting: async () => ({
          meetingId: "91234567890",
          joinUrl: "https://zoom.us/j/91234567890",
          startUrl: "https://zoom.us/s/91234567890",
        }),
        sendPatientEmail: async (payload) => {
          patientEmailSent = true
          expect(payload.patientEmail).toBe("budi@example.com")
          expect(payload.accessToken).toBe("tok_test_abc12345")
          return { success: true }
        },
        sendCounselorEmail: async (payload) => {
          counselorEmailSent = true
          expect(payload.counselorEmail).toBe("sarah@solulu.id")
          return { success: true }
        },
      })

      expect(result.success).toBe(true)
      expect(result.zoomAccountNumber).toBe(1)
      expect(result.zoomAllocationMode).toBe("standalone")
      expect(result.zoomMeetingId).toBe("91234567890")
      expect(result.zoomJoinUrl).toBe("https://zoom.us/j/91234567890")
      expect(result.breakoutRoomName).toBe("SL-1001 - Sarah Annisa, M.Psi., Psikolog")
      expect(patientEmailSent).toBe(true)
      expect(counselorEmailSent).toBe(true)
    })

    it("allocates Zoom 4 in breakout_room mode when slot session rank > 4", async () => {
      const highRankBooking = {
        ...mockBookingData,
        booking: {
          ...mockBookingData.booking,
          id: "b-high-5",
          bookingCode: "SL-1005",
        },
      }

      const result = await fulfillSession("b-high-5", {
        fetchBookingData: async () => highRankBooking,
        dispatchZoom: () => ({ accountNumber: 4, mode: "breakout_room" }),
        getZoomAccount: async () => mockZoomAccounts[2], // Zoom 4
        getAccessToken: async () => "mock_token_zoom4",
        createMeeting: async () => ({
          meetingId: "94444444444",
          joinUrl: "https://zoom.us/j/94444444444",
          startUrl: "https://zoom.us/s/94444444444",
        }),
        sendPatientEmail: async () => ({ success: true }),
        sendCounselorEmail: async () => ({ success: true }),
      })

      expect(result.success).toBe(true)
      expect(result.zoomAccountNumber).toBe(4)
      expect(result.zoomAllocationMode).toBe("breakout_room")
      expect(result.breakoutRoomName).toBe("SL-1005 - Sarah Annisa, M.Psi., Psikolog")
    })

    it("handles manual meeting URL override without calling Zoom S2S API", async () => {
      let createMeetingCalled = false

      const result = await fulfillSession(
        "b-12345",
        {
          source: "admin_bypass",
          manualMeetingUrl: "https://meet.google.com/abc-defg-hij",
          skipEmails: true,
        },
        {
          fetchBookingData: async () => mockBookingData,
          zoomClient: {
            createMeeting: async () => {
              createMeetingCalled = true
              return { meetingId: "", joinUrl: "", startUrl: "" }
            },
          },
        }
      )

      expect(result.success).toBe(true)
      expect(result.zoomJoinUrl).toBe("https://meet.google.com/abc-defg-hij")
      expect(result.zoomAllocationMode).toBe("standalone")
      expect(createMeetingCalled).toBe(false)
    })
  })

  // =========================================================================
  // 2. Invariants: Idempotency & Failure Resilience
  // =========================================================================
  describe("2. Invariants: Idempotency & Failure Resilience", () => {
    it("is strictly idempotent: returns existing room without recreating Zoom URLs", async () => {
      const alreadyFulfilledBooking = {
        ...mockBookingData,
        booking: {
          ...mockBookingData.booking,
          zoomJoinUrl: "https://zoom.us/j/already_fulfilled",
          zoomStartUrl: "https://zoom.us/s/already_fulfilled",
          zoomMeetingId: "99999999",
          zoomAccountId: "zoom-acc-1",
        },
      }

      let createMeetingCalled = false

      const result = await fulfillBooking("b-12345", {
        fetchBookingData: async () => alreadyFulfilledBooking,
        createMeeting: async () => {
          createMeetingCalled = true
          return { meetingId: "fail", joinUrl: "", startUrl: "" }
        },
      })

      expect(result.success).toBe(true)
      expect(result.zoomJoinUrl).toBe("https://zoom.us/j/already_fulfilled")
      expect(createMeetingCalled).toBe(false)
    })

    it("enforces payment resilience: returns error on Zoom failure without rolling back payment", async () => {
      const result = await fulfillSession("b-12345", {
        fetchBookingData: async () => mockBookingData,
        getZoomAccount: async () => mockZoomAccounts[0],
        getAccessToken: async () => "mock_token",
        createMeeting: async () => {
          throw new Error("Zoom S2S API Rate Limit Exceeded")
        },
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Gagal membuat ruang Zoom")
      expect(result.error).toContain("Rate Limit Exceeded")
    })
  })

  // =========================================================================
  // 3. Admin Manual Bank Transfer Verification (US-42 Delegation)
  // =========================================================================
  describe("3. confirmManualPayment (Admin Path B Delegation)", () => {
    const mockManualSession = {
      booking: {
        id: "b-manual-1",
        bookingCode: "SL-1042",
        accessToken: "tok_manual_999",
        patientName: "Citra Lestari",
        patientEmail: "citra@example.com",
      },
      counselor: {
        fullName: "Dimas Pratama, S.Psi.",
        email: "dimas@solulu.id",
      },
      schedule: {
        id: "s-manual-1",
        date: "2026-09-30",
        slotIndex: 2,
        startTime: "10:00:00",
        endTime: "12:00:00",
      },
      transaction: {
        id: "t-manual-1",
        status: "PENDING",
      },
    }

    it("verifies transaction and delegates host allocation to fulfillSession", async () => {
      let patientEmailSent = false

      const result = await confirmManualPayment(
        {
          bookingId: "b-manual-1",
          paymentMethod: "Transfer Bank BCA (Manual)",
          referenceNumber: "TRF-BCA-12345",
          adminNotes: "Bukti mutasi diverifikasi",
        },
        {
          fetchBookingData: async () => mockManualSession,
          getZoomAccount: async () => mockZoomAccounts[1],
          getAccessToken: async () => "mock_token",
          createMeeting: async () => ({
            meetingId: "88887777",
            joinUrl: "https://zoom.us/j/88887777",
            startUrl: "https://zoom.us/s/88887777",
          }),
          sendPatientEmail: async () => {
            patientEmailSent = true
            return { success: true }
          },
          sendCounselorEmail: async () => ({ success: true }),
        }
      )

      expect(result.success).toBe(true)
      expect(result.zoomRoom).toBe("Akun Zoom Pro 2")
      expect(result.zoomJoinUrl).toBe("https://zoom.us/j/88887777")
      expect(patientEmailSent).toBe(true)
    })

    it("rejects confirmation if required fields are missing", async () => {
      const result = await confirmManualPayment({
        bookingId: "",
        paymentMethod: "",
        referenceNumber: "",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("wajib diisi")
    })

    it("rejects confirmation if transaction is already PAID", async () => {
      const alreadyPaidData = {
        ...mockManualSession,
        transaction: {
          ...mockManualSession.transaction,
          status: "PAID",
        },
      }

      const result = await confirmManualPayment(
        {
          bookingId: "b-manual-1",
          paymentMethod: "BCA",
          referenceNumber: "123",
        },
        {
          fetchBookingData: async () => alreadyPaidData,
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("berstatus LUNAS sebelumnya")
    })
  })

  // =========================================================================
  // 4. API Handlers: Xendit Webhook & QStash Worker
  // =========================================================================
  describe("4. API Handlers: Xendit Webhook & QStash Worker", () => {
    it("rejects Xendit webhook request with missing or invalid callback token (HTTP 403)", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/xendit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-callback-token": "invalid-token",
        },
        body: JSON.stringify({ id: "inv_123" }),
      })

      const res = await xenditWebhookHandler(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain("Invalid or missing Xendit callback token")
    })

    it("rejects QStash worker request if missing bookingId (HTTP 400)", async () => {
      const req = new Request("http://localhost:3000/api/jobs/fulfill-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "upstash-signature": "test-signature",
        },
        body: JSON.stringify({}),
      })

      const res = await fulfillJobHandler(req)
      expect(res.status).toBe(400)
    })
  })
})
