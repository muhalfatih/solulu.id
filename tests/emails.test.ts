import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  sendPatientConfirmationEmail,
  sendCounselorNotificationEmail,
  type PatientEmailPayload,
  type CounselorEmailPayload,
} from "@/lib/fulfillment/emails"

describe("Resend Email Delivery Services (lib/fulfillment/emails.ts)", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_dummy_key_123"
    process.env.RESEND_FROM_EMAIL = "Solulu Support <halo@solulu.id>"
    process.env.NEXT_PUBLIC_APP_URL = "https://solulu.id"
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe("sendPatientConfirmationEmail", () => {
    const mockPatientPayload: PatientEmailPayload = {
      patientEmail: "pasien@example.com",
      patientName: "Budi Santoso",
      counselorName: "Sarah Annisa, M.Psi.",
      date: "Senin, 15 September 2026",
      timeRange: "14:00 - 15:30 WIB",
      accessToken: "tok_test_patient_123",
    }

    it("sends booking confirmation email with correct headers and payload to Resend API", async () => {
      let capturedUrl = ""
      let capturedOptions: any = null

      const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedUrl = url.toString()
        capturedOptions = opts
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "resend_msg_patient_001" }),
        } as Response
      })

      const result = await sendPatientConfirmationEmail(mockPatientPayload, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe("resend_msg_patient_001")
      expect(capturedUrl).toBe("https://api.resend.com/emails")
      expect(capturedOptions.method).toBe("POST")
      expect(capturedOptions.headers["Authorization"]).toBe(
        "Bearer re_test_dummy_key_123"
      )
      expect(capturedOptions.headers["Content-Type"]).toBe("application/json")

      const body = JSON.parse(capturedOptions.body)
      expect(body.from).toBe("Solulu Support <halo@solulu.id>")
      expect(body.to).toEqual(["pasien@example.com"])
      expect(body.subject).toContain("Sarah Annisa, M.Psi.")
      expect(body.html).toContain("Budi Santoso")
      expect(body.html).toContain("https://solulu.id/session/tok_test_patient_123")
      expect(body.html).toContain("14:00 - 15:30 WIB")
    })

    it("handles Resend API error responses gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 400,
          text: async () => "Validation error: invalid from domain",
        } as Response
      })

      const result = await sendPatientConfirmationEmail(mockPatientPayload, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result.success).toBe(false)
      expect(result.id).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Resend API error (patient):",
        "Validation error: invalid from domain"
      )

      consoleErrorSpy.mockRestore()
    })

    it("uses mock fallback in dev/test environment when fetchFn is not provided", async () => {
      process.env.RESEND_API_KEY = "mock"
      const result = await sendPatientConfirmationEmail(mockPatientPayload)

      expect(result.success).toBe(true)
      expect(result.id).toBe("mock_patient_email_id")
    })
  })

  describe("sendCounselorNotificationEmail", () => {
    const mockCounselorPayload: CounselorEmailPayload = {
      counselorEmail: "sarah@solulu.id",
      counselorName: "Sarah Annisa, M.Psi.",
      patientName: "Budi Santoso",
      date: "Senin, 15 September 2026",
      timeRange: "14:00 - 15:30 WIB",
      initialNotes: "Keluhan kecemasan menghadapi ujian skripsi.",
    }

    it("sends notification email with initialNotes to counselor via Resend", async () => {
      let capturedOptions: any = null

      const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedOptions = opts
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "resend_msg_counselor_002" }),
        } as Response
      })

      const result = await sendCounselorNotificationEmail(mockCounselorPayload, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe("resend_msg_counselor_002")

      const body = JSON.parse(capturedOptions.body)
      expect(body.from).toBe("Solulu Support <halo@solulu.id>")
      expect(body.to).toEqual(["sarah@solulu.id"])
      expect(body.subject).toContain("Budi Santoso")
      expect(body.html).toContain("Sarah Annisa, M.Psi.")
      expect(body.html).toContain("Keluhan kecemasan menghadapi ujian skripsi.")
      expect(body.html).toContain("https://solulu.id/counselor/dashboard")
    })

    it("sends notification email without initialNotes when omitted", async () => {
      let capturedOptions: any = null

      const payloadWithoutNotes: CounselorEmailPayload = {
        ...mockCounselorPayload,
        initialNotes: undefined,
      }

      const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedOptions = opts
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "resend_msg_counselor_003" }),
        } as Response
      })

      const result = await sendCounselorNotificationEmail(payloadWithoutNotes, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result.success).toBe(true)
      const body = JSON.parse(capturedOptions.body)
      expect(body.html).not.toContain("Catatan Awal Pasien:")
    })

    it("handles Resend API error responses for counselor email", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 403,
          text: async () => "Forbidden: Restricted API key",
        } as Response
      })

      const result = await sendCounselorNotificationEmail(mockCounselorPayload, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result.success).toBe(false)
      expect(result.id).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Resend API error (counselor):",
        "Forbidden: Restricted API key"
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe("sendCounselorWelcomeCredentialsEmail", () => {
    it("sends welcome email with temporary password and login portal link via Resend", async () => {
      let capturedUrl = ""
      let capturedOptions: any = null

      const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedUrl = url.toString()
        capturedOptions = opts
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "resend_msg_welcome_001" }),
        } as Response
      })

      const { sendCounselorWelcomeCredentialsEmail } = await import("@/lib/fulfillment/emails")
      const result = await sendCounselorWelcomeCredentialsEmail(
        {
          counselorEmail: "nurul@solulu.id",
          counselorName: "Nurul Hidayah, M.Psi.",
          temporaryPassword: "SolTest2026!#",
          counselorType: "psychologist",
        },
        { fetchFn: mockFetch as unknown as typeof fetch }
      )

      expect(result.success).toBe(true)
      expect(result.id).toBe("resend_msg_welcome_001")
      expect(capturedUrl).toBe("https://api.resend.com/emails")
      const body = JSON.parse(capturedOptions.body)
      expect(body.to).toContain("nurul@solulu.id")
      expect(body.subject).toContain("Kredensial Login Akun")
      expect(body.html).toContain("SolTest2026!#")
      expect(body.html).toContain("https://solulu.id/login")
    })
  })
})
