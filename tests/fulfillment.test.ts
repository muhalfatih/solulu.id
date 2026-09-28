import { describe, it, expect, vi, beforeEach } from "vitest"
import { allocateZoomAccount } from "@/lib/fulfillment/allocate-zoom"
import { fulfillBooking } from "@/lib/fulfillment/fulfill"
import { confirmManualPayment } from "@/lib/fulfillment/manual"
import { POST as xenditWebhookHandler } from "@/app/api/webhooks/xendit/route"
import { POST as fulfillJobHandler } from "@/app/api/jobs/fulfill-booking/route"

describe("Decoupled Fulfillment & Dynamic Zoom Allocation (Issue #8 / Solulu v1)", () => {
  const mockZoomAccounts = [
    {
      id: "zoom-acc-1",
      name: "Akun Zoom Pro 1",
      email: "zoom1@solulu.id",
      accountId: "acc-1",
      clientId: "client-1",
      clientSecretEncrypted: "encrypted-secret-1",
      isActive: true,
    },
    {
      id: "zoom-acc-2",
      name: "Akun Zoom Pro 2",
      email: "zoom2@solulu.id",
      accountId: "acc-2",
      clientId: "client-2",
      clientSecretEncrypted: "encrypted-secret-2",
      isActive: true,
    },
  ]

  describe("allocateZoomAccount (ADR-0001 & ADR-0002 Concurrency Guard)", () => {
    it("allocates the first available account when no active sessions overlap", async () => {
      const result = await allocateZoomAccount("2026-09-29", "19:00:00", "20:30:00", {
        fetchAccounts: async () => mockZoomAccounts,
        fetchOverlappingBookings: async () => [],
      })

      expect(result.success).toBe(true)
      expect(result.account?.id).toBe("zoom-acc-1")
    })

    it("allocates account 2 when account 1 is occupied by an overlapping session", async () => {
      const result = await allocateZoomAccount("2026-09-29", "19:00:00", "20:30:00", {
        fetchAccounts: async () => mockZoomAccounts,
        fetchOverlappingBookings: async () => [
          { zoomAccountId: "zoom-acc-1" },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.account?.id).toBe("zoom-acc-2")
    })

    it("rejects allocation when both Zoom Pro accounts are occupied during overlapping slot", async () => {
      const result = await allocateZoomAccount("2026-09-29", "19:00:00", "20:30:00", {
        fetchAccounts: async () => mockZoomAccounts,
        fetchOverlappingBookings: async () => [
          { zoomAccountId: "zoom-acc-1" },
          { zoomAccountId: "zoom-acc-2" },
        ],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Semua akun Zoom Pro (maksimal 2) sedang digunakan")
    })

    it("returns error if no active Zoom accounts exist in the system", async () => {
      const result = await allocateZoomAccount("2026-09-29", "19:00:00", "20:30:00", {
        fetchAccounts: async () => [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Tidak ada akun Zoom Pro aktif")
    })
  })

  describe("fulfillBooking (Decoupled Worker Engine)", () => {
    const mockBookingData = {
      booking: {
        id: "b-12345",
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
        startTime: "19:00:00",
        endTime: "20:30:00",
      },
    }

    it("successfully creates Zoom meeting and dispatches confirmation emails", async () => {
      let patientEmailSent = false
      let counselorEmailSent = false

      const result = await fulfillBooking("b-12345", {
        fetchBookingData: async () => mockBookingData,
        allocateAccount: async () => ({
          success: true,
          account: mockZoomAccounts[0],
        }),
        getAccessToken: async () => "mock_valid_access_token",
        createMeeting: async (token, input) => ({
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
      expect(result.zoomMeetingId).toBe("91234567890")
      expect(result.zoomJoinUrl).toBe("https://zoom.us/j/91234567890")
      expect(result.zoomStartUrl).toBe("https://zoom.us/s/91234567890")
      expect(patientEmailSent).toBe(true)
      expect(counselorEmailSent).toBe(true)
    })

    it("is idempotent: returns existing meeting details if booking is already fulfilled", async () => {
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
  })

  describe("confirmManualPayment (Admin Path B Fulfillment)", () => {
    const mockManualSession = {
      booking: {
        id: "b-manual-1",
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
        startTime: "14:00:00",
        endTime: "15:30:00",
      },
      transaction: {
        id: "t-manual-1",
        status: "PENDING",
      },
    }

    it("executes dynamic Zoom host allocation and sends emails upon confirmation", async () => {
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
          allocateAccount: async () => ({
            success: true,
            account: mockZoomAccounts[1],
          }),
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

  describe("API Handlers: Xendit Webhook & QStash Worker", () => {
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
