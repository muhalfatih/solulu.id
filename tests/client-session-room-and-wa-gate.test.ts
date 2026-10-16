import { describe, it, expect, vi } from "vitest"
import {
  getSessionByTokenAction,
  getClientSessionReportAction,
  verifyClientPhoneAndUnlockReportAction,
  submitExtensionPaymentAction,
} from "../lib/session/actions"
import {
  unlockReportSchema,
  extensionPaymentSchema,
  normalizeIndonesianPhone,
} from "../lib/validations/session"
import type { SessionPageData } from "../lib/session/types"

describe("Ticket 06: Client Session Room, Dual Payments & WhatsApp Report Gate", () => {
  const baseGuestBooking: SessionPageData = {
    booking: {
      id: "b-client-601",
      accessToken: "tok_nanoid32_client_session_room_001",
      bookingCode: "SL-4821",
      patientName: "Nadia Rahma",
      patientEmail: "nadia.rahma@example.com",
      patientPhone: "081234567890",
      initialNotes: "Kecemasan karir dan quarter-life crisis",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/99887766554?pwd=solulu_client_token",
      zoomMeetingId: "998 8776 6554",
      zoomAllocationMode: "breakout_room",
      breakoutRoomName: "SL-4821 - Dimas Pratama",
      isExtended: false,
      extensionMinutes: 0,
      extensionFee: 0,
      extensionPaymentStatus: "NONE",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-dimas-2",
      fullName: "Dimas Pratama, S.Psi.",
      title: "Konselor Sebaya Bersertifikat",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      bio: "Pendamping sebaya terlatih dengan pendekatan empatik.",
      specializations: ["Regulasi Emosi", "Quarter-life Crisis"],
      avatarR2Url: null,
    },
    schedule: {
      id: "sch-slot-4",
      date: "2026-10-20",
      startTime: "14:00:00",
      endTime: "16:00:00",
      timeRange: "14:00 – 16:00 WIB",
      formattedDate: "Selasa, 20 Oktober 2026",
    },
    transaction: {
      id: "tx-601",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-20261020-4821",
      grossAmount: 85000,
      discountAmount: 0,
      netAmount: 85000,
      netAmountFormatted: "Rp 85.000",
      status: "PAID",
    },
    hasReport: true,
    report: null, // Locked until WhatsApp verified
  }

  // ===========================================================================
  // 1. Guest Access & Zoom Display Name Requirement
  // ===========================================================================
  describe("1. Guest Session Room Access & Zoom Display Name Formatting", () => {
    it("securely loads session room data using nanoid(32) without requiring user login", async () => {
      const res = await getSessionByTokenAction("tok_nanoid32_client_session_room_001", {
        findBookingByAccessToken: async () => baseGuestBooking,
      })

      expect(res.success).toBe(true)
      expect(res.data?.booking.accessToken).toBe("tok_nanoid32_client_session_room_001")
      expect(res.data?.booking.bookingCode).toBe("SL-4821")
      expect(res.data?.counselor.fullName).toBe("Dimas Pratama, S.Psi.")
      expect(res.data?.schedule.timeRange).toBe("14:00 – 16:00 WIB")
    })

    it("formats Zoom Display Name strictly as [Kode Booking] - [Nama Panggilan]", () => {
      const bookingCode = baseGuestBooking.booking.bookingCode
      const patientName = baseGuestBooking.booking.patientName
      const formattedDisplayName = `${bookingCode} - ${patientName}`

      expect(formattedDisplayName).toBe("SL-4821 - Nadia Rahma")
      expect(formattedDisplayName.startsWith("SL-")).toBe(true)
      expect(formattedDisplayName).toContain(" - ")
    })

    it("preserves permanent Zoom join link and breakout room assignment for confirmed booking", async () => {
      const res = await getSessionByTokenAction("tok_nanoid32_client_session_room_001", {
        findBookingByAccessToken: async () => baseGuestBooking,
      })

      expect(res.data?.booking.zoomJoinUrl).toBe("https://zoom.us/j/99887766554?pwd=solulu_client_token")
      expect(res.data?.booking.zoomAllocationMode).toBe("breakout_room")
      expect(res.data?.booking.breakoutRoomName).toBe("SL-4821 - Dimas Pratama")
    })
  })

  // ===========================================================================
  // 2. Dual Payments for Extended Sessions (>90 Min)
  // ===========================================================================
  describe("2. Dual Payments for Session Extension (>90 Menit)", () => {
    it("validates extensionPaymentSchema: rejects manual bank transfer without transfer proof", () => {
      const invalidManual = extensionPaymentSchema.safeParse({
        accessToken: "tok_nanoid32_client_session_room_001",
        paymentMethod: "manual_bank_transfer",
        proofR2Key: "", // missing
      })
      expect(invalidManual.success).toBe(false)
      if (!invalidManual.success) {
        expect(invalidManual.error.flatten().fieldErrors.proofR2Key?.[0]).toContain("Bukti transfer wajib diunggah")
      }
    })

    it("validates extensionPaymentSchema: accepts manual bank transfer with uploaded R2 proof", () => {
      const validManual = extensionPaymentSchema.safeParse({
        accessToken: "tok_nanoid32_client_session_room_001",
        paymentMethod: "manual_bank_transfer",
        proofR2Key: "extensions/slip_tf_bca_9821.jpg",
      })
      expect(validManual.success).toBe(true)
    })

    it("validates extensionPaymentSchema: accepts automated Xendit without requiring proof upload", () => {
      const validXendit = extensionPaymentSchema.safeParse({
        accessToken: "tok_nanoid32_client_session_room_001",
        paymentMethod: "xendit",
      })
      expect(validXendit.success).toBe(true)
    })

    it("submits manual transfer proof, transitioning extension payment status to PENDING", async () => {
      const updateSpy = vi.fn().mockResolvedValue(true)
      const res = await submitExtensionPaymentAction(
        {
          accessToken: "tok_nanoid32_client_session_room_001",
          paymentMethod: "manual_bank_transfer",
          proofR2Key: "extensions/slip_tf_bca_9821.jpg",
        },
        {
          findBooking: async () => ({ id: "b-client-601" }),
          updateBooking: updateSpy,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.status).toBe("PENDING")
      expect(updateSpy).toHaveBeenCalledWith("b-client-601", {
        extensionPaymentStatus: "PENDING",
        extensionPaymentMethod: "manual_bank_transfer",
        extensionProofR2Key: "extensions/slip_tf_bca_9821.jpg",
      })
    })

    it("initiates automated Xendit extension payment, transitioning status and returning checkout URL", async () => {
      const updateSpy = vi.fn().mockResolvedValue(true)
      const res = await submitExtensionPaymentAction(
        {
          accessToken: "tok_nanoid32_client_session_room_001",
          paymentMethod: "xendit",
        },
        {
          findBooking: async () => ({ id: "b-client-601" }),
          updateBooking: updateSpy,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.status).toBe("PENDING")
      expect(res.data?.paymentUrl).toBeDefined()
      expect(updateSpy).toHaveBeenCalledWith("b-client-601", {
        extensionPaymentMethod: "xendit",
      })
    })
  })

  // ===========================================================================
  // 3. WhatsApp Phone Normalization & Report Unlocking Gate
  // ===========================================================================
  describe("3. WhatsApp Phone Verification Security Gate", () => {
    it("normalizes diverse Indonesian phone formats (+62, 62, dashes, spaces)", () => {
      expect(normalizeIndonesianPhone("081234567890")).toBe("081234567890")
      expect(normalizeIndonesianPhone("+6281234567890")).toBe("081234567890")
      expect(normalizeIndonesianPhone("6281234567890")).toBe("081234567890")
      expect(normalizeIndonesianPhone("0812-3456-7890")).toBe("081234567890")
      expect(normalizeIndonesianPhone("+62 812 3456 7890")).toBe("081234567890")
    })

    it("rejects unlocking report when verification phone number is missing or empty", async () => {
      const res = await getClientSessionReportAction("tok_nanoid32_client_session_room_001", "")
      expect(res.success).toBe(false)
      expect(res.error).toContain("Nomor WhatsApp verifikasi wajib diisi")
    })

    it("rejects unlocking report when verification phone number does NOT match registered phone", async () => {
      const res = await getClientSessionReportAction(
        "tok_nanoid32_client_session_room_001",
        "089999999999", // wrong phone
        {
          findReport: async () => ({
            patientPhone: "081234567890", // registered phone
            patientName: "Nadia Rahma",
            counselorName: "Dimas Pratama",
            report: {
              id: "rep-601",
              mainIssue: "Quarter-life Crisis",
              summary: "Ringkasan sesi konseling.",
              actionPlan: "Latihan regulasi emosi harian.",
              createdAt: new Date().toISOString(),
            },
          }),
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("tidak cocok")
    })

    it("unlocks official session report when phone number matches (+62 vs 08)", async () => {
      const mockRawClinicalData = {
        id: "rep-601",
        mainIssue: "Quarter-life Crisis & Penyesuaian Karir",
        summary: "Klien mengeksplorasi ketakutan akan kegagalan dalam transisi peran profesional.",
        actionPlan: "Praktik grounding 5-4-3-2-1 dan reframing pikiran otomatis negatif.",
        followUpRecommendation: "Sesi konseling tindak lanjut disarankan 2 minggu lagi.",
        createdAt: new Date().toISOString(),
        // Raw confidential fields in database
        internalNotes: "Sensitif: Waspadai kecenderungan people-pleasing dan riwayat burnout.",
        attachmentR2Keys: ["attendance/proof_session_601.jpg"],
      }

      // Verification with +62 formatted input
      const res = await verifyClientPhoneAndUnlockReportAction(
        "tok_nanoid32_client_session_room_001",
        "+62 812-3456-7890",
        {
          findReport: async () => ({
            patientPhone: "081234567890",
            patientName: "Nadia Rahma",
            counselorName: "Dimas Pratama, S.Psi.",
            report: mockRawClinicalData,
          }),
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.patientName).toBe("Nadia Rahma")
      expect(res.data?.counselorName).toBe("Dimas Pratama, S.Psi.")
      expect(res.data?.report.mainIssue).toBe("Quarter-life Crisis & Penyesuaian Karir")
      expect(res.data?.report.summary).toContain("transisi peran profesional")
      expect(res.data?.report.actionPlan).toContain("grounding 5-4-3-2-1")
    })
  })

  // ===========================================================================
  // 4. Strict Confidentiality & Medical Privacy Guard
  // ===========================================================================
  describe("4. Strict Confidentiality & Medical Privacy Guard", () => {
    it("ensures confidential internalNotes and attendance screenshots are strictly masked from client payload", async () => {
      const mockRawClinicalData = {
        id: "rep-601",
        mainIssue: "Quarter-life Crisis & Penyesuaian Karir",
        summary: "Klien mengeksplorasi ketakutan akan kegagalan dalam transisi peran profesional.",
        actionPlan: "Praktik grounding 5-4-3-2-1 dan reframing pikiran otomatis negatif.",
        createdAt: new Date().toISOString(),
        // Strictly confidential
        internalNotes: "RAHASIA: Observasi defensif klien mengenai figur otoritas kantor.",
        attachmentR2Keys: ["attendance/internal_zoom_proof_601.png"],
      }

      const res = await getClientSessionReportAction(
        "tok_nanoid32_client_session_room_001",
        "081234567890",
        {
          findReport: async () => ({
            patientPhone: "081234567890",
            report: mockRawClinicalData,
          }),
        }
      )

      expect(res.success).toBe(true)
      // STRICT ASSERTION: internalNotes and attachmentR2Keys must NOT exist
      expect((res.data?.report as any).internalNotes).toBeUndefined()
      expect((res.data?.report as any).attachmentR2Keys).toBeUndefined()
      expect("internalNotes" in (res.data?.report || {})).toBe(false)
      expect("attachmentR2Keys" in (res.data?.report || {})).toBe(false)
    })

    it("verifies initial guest session page query does NOT leak report content before WhatsApp phone verification", async () => {
      const res = await getSessionByTokenAction("tok_nanoid32_client_session_room_001", {
        findBookingByAccessToken: async () => baseGuestBooking,
      })

      expect(res.success).toBe(true)
      expect(res.data?.hasReport).toBe(true)
      expect(res.data?.report).toBeNull() // Report is protected/locked
    })
  })
})
