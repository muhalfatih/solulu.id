import { describe, it, expect, vi } from "vitest"
import { canRescheduleSession } from "../lib/admin/reschedule"
import {
  validateVoucherEligibility,
  type PricingTierConfig,
  type VoucherConfig,
} from "../lib/admin/pricing"
import {
  testimonialValidationSchema,
  galleryUploadValidationSchema,
  adminProfileContactSchema,
} from "../lib/validations/admin"
import { confirmManualPayment } from "../lib/fulfillment/manual"

describe("Issue #12: Admin Portal, Session Management, Pricing, Vouchers & Gallery", () => {
  // ===========================================================================
  // 1. Reschedule H-12 Rule Enforcement
  // ===========================================================================
  describe("1. Reschedule H-12 Rule Enforcement", () => {
    const fixedNow = new Date("2026-09-28T09:00:00+07:00") // 09:00 WIB

    it("allows reschedule when session is > 12 hours away (e.g. 24 hours)", () => {
      // Tomorrow at 09:00 WIB (24 hours away)
      const res = canRescheduleSession("2026-09-29", "09:00", fixedNow)
      expect(res.allowed).toBe(true)
      expect(res.hoursUntilSession).toBe(24)
    })

    it("allows reschedule when session is exactly 14 hours away", () => {
      // Tonight at 23:00 WIB (14 hours away)
      const res = canRescheduleSession("2026-09-28", "23:00", fixedNow)
      expect(res.allowed).toBe(true)
      expect(res.hoursUntilSession).toBe(14)
    })

    it("blocks reschedule when session is less than 12 hours away (e.g. 6 hours)", () => {
      // Today at 15:00 WIB (6 hours away)
      const res = canRescheduleSession("2026-09-28", "15:00", fixedNow)
      expect(res.allowed).toBe(false)
      expect(res.hoursUntilSession).toBe(6)
      expect(res.reason).toContain("H-12")
    })

    it("blocks reschedule when session is 30 minutes away or in the past", () => {
      const past = canRescheduleSession("2026-09-28", "08:00", fixedNow)
      expect(past.allowed).toBe(false)
      expect(past.reason).toContain("telah lewat")
    })
  })

  // ===========================================================================
  // 2. Pricing & Voucher Restrictions (allowVoucher and isSaleActive)
  // ===========================================================================
  describe("2. Pricing Tier & Voucher Eligibility Checks", () => {
    const peerPricingWithPromoNett: PricingTierConfig = {
      counselorType: "peer",
      basePrice: "50000",
      promoPrice: "35000",
      isSaleActive: true,
      allowVoucher: false, // Net sale, no vouchers allowed
    }

    const psychologistPricingWithVouchers: PricingTierConfig = {
      counselorType: "psychologist",
      basePrice: "150000",
      promoPrice: null,
      isSaleActive: false,
      allowVoucher: true, // Vouchers permitted
    }

    const fixedVoucher: VoucherConfig = {
      code: "SOLULUHEMAT20K",
      discountType: "fixed",
      discountValue: 20000,
      quota: 100,
      usedCount: 5,
      expiresAt: "2026-12-31T23:59:59Z",
      isActive: true,
    }

    const percentVoucher: VoucherConfig = {
      code: "SEHAT50",
      discountType: "percentage",
      discountValue: 50,
      quota: 50,
      usedCount: 10,
      expiresAt: "2026-12-31T23:59:59Z",
      isActive: true,
    }

    it("blocks voucher application when allowVoucher is false for the pricing tier", () => {
      const res = validateVoucherEligibility(peerPricingWithPromoNett, fixedVoucher)
      expect(res.valid).toBe(false)
      expect(res.reason).toContain("promo nett")
    })

    it("allows voucher and correctly calculates fixed discount when allowVoucher is true", () => {
      const res = validateVoucherEligibility(psychologistPricingWithVouchers, fixedVoucher)
      expect(res.valid).toBe(true)
      expect(res.discountAmount).toBe(20000)
      expect(res.finalPrice).toBe(130000) // 150000 - 20000
    })

    it("allows voucher and correctly calculates percentage discount", () => {
      const res = validateVoucherEligibility(psychologistPricingWithVouchers, percentVoucher)
      expect(res.valid).toBe(true)
      expect(res.discountAmount).toBe(75000) // 50% of 150000
      expect(res.finalPrice).toBe(75000)
    })

    it("rejects inactive voucher", () => {
      const inactiveVoucher = { ...fixedVoucher, isActive: false }
      const res = validateVoucherEligibility(psychologistPricingWithVouchers, inactiveVoucher)
      expect(res.valid).toBe(false)
      expect(res.reason).toContain("tidak aktif")
    })

    it("rejects voucher when quota is exhausted", () => {
      const exhaustedVoucher = { ...fixedVoucher, quota: 10, usedCount: 10 }
      const res = validateVoucherEligibility(psychologistPricingWithVouchers, exhaustedVoucher)
      expect(res.valid).toBe(false)
      expect(res.reason).toContain("telah habis")
    })

    it("rejects voucher when expired", () => {
      const expiredVoucher = {
        ...fixedVoucher,
        expiresAt: "2026-01-01T00:00:00Z",
      }
      const res = validateVoucherEligibility(
        psychologistPricingWithVouchers,
        expiredVoucher,
        new Date("2026-09-28T12:00:00Z")
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain("kedaluwarsa")
    })
  })

  // ===========================================================================
  // 3. Gallery Privacy & Consent Validation (US-50)
  // ===========================================================================
  describe("3. Gallery Legal Consent Validation", () => {
    it("rejects gallery photo upload if consent checkbox is false", () => {
      const invalid = galleryUploadValidationSchema.safeParse({
        imageUrl: "https://pub-r2.solulu.id/gallery/photo1.webp",
        caption: "Workshop Kesehatan Mental Offline",
        isCensoredAndConsented: false,
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.flatten().fieldErrors.isCensoredAndConsented?.[0]).toContain(
          "Persetujuan sensor wajah"
        )
      }
    })

    it("accepts gallery photo upload when consent is affirmed", () => {
      const valid = galleryUploadValidationSchema.safeParse({
        imageUrl: "https://pub-r2.solulu.id/gallery/photo1.webp",
        caption: "Workshop Kesehatan Mental Offline",
        isCensoredAndConsented: true,
      })
      expect(valid.success).toBe(true)
    })
  })

  // ===========================================================================
  // 4. Testimonials Validation & Star Ratings
  // ===========================================================================
  describe("4. Testimonial Moderation & Schema Validation", () => {
    it("validates client reviews with rating 1 to 5 and anonymous display", () => {
      const valid = testimonialValidationSchema.safeParse({
        clientName: "Rian Arya",
        isAnonymous: true,
        anonymousDisplay: "R.A.",
        sessionCode: "b-101",
        counselorName: "Sarah Annisa, M.Psi., Psikolog",
        counselorType: "Psikolog Klinis",
        rating: 5,
        quoteHighlight: "Sangat menenangkan dan membantu saya memecahkan beban pikiran.",
        comment:
          "Sesi konseling pertama yang sangat nyaman. Konselor sangat mendengar tanpa menghakimi dan memberikan teknik praktis.",
        topic: "Kecemasan Kerja",
        isActive: true,
        isFeatured: true,
      })
      expect(valid.success).toBe(true)
    })

    it("rejects review with rating > 5 or comment < 20 chars", () => {
      const invalid = testimonialValidationSchema.safeParse({
        clientName: "User",
        anonymousDisplay: "U",
        counselorName: "Konselor",
        rating: 6, // > 5
        quoteHighlight: "Bagus", // < 10 chars
        comment: "Bagus sekali", // < 20 chars
        topic: "Umum",
      })
      expect(invalid.success).toBe(false)
    })
  })

  // ===========================================================================
  // 5. Admin Profile & Support Validation
  // ===========================================================================
  describe("5. Admin Profile Settings Validation", () => {
    it("validates contact and notification preferences", () => {
      const valid = adminProfileContactSchema.safeParse({
        email: "admin@solulu.id",
        phone: "081234567890",
        notifyUrgent: true,
        notifyCounselor: true,
        notifySession: false,
      })
      expect(valid.success).toBe(true)
    })
  })

  // ===========================================================================
  // 6. Manual Bank Payment Verification
  // ===========================================================================
  describe("6. Manual Payment Verification Flow", () => {
    it("successfully confirms manual transfer with mutation ID and allocates Zoom room", async () => {
      const mockBooking = {
        id: "b-manual-1",
        status: "pending_payment",
        accessToken: "token-manual-1",
        patientName: "Doni Pratama",
        patientEmail: "doni@example.com",
        scheduleId: "s-1",
        counselorId: "c-1",
      }

      const mockSchedule = {
        id: "s-1",
        date: "2026-09-28",
        startTime: "19:00",
        endTime: "20:30",
        status: "reserved",
      }

      const mockCounselor = {
        id: "c-1",
        fullName: "Sarah Annisa, M.Psi., Psikolog",
        email: "sarah@solulu.id",
      }

      const mockAllocateAccount = vi.fn().mockResolvedValue({
        success: true,
        account: {
          id: "zoom-acc-1",
          name: "Akun Zoom Pro 1",
          clientId: "zoom-client-id",
          clientSecretEncrypted: "encrypted-secret",
        },
      })

      const mockCreateMeeting = vi.fn().mockResolvedValue({
        meetingId: "987654321",
        joinUrl: "https://zoom.us/j/987654321",
        startUrl: "https://zoom.us/s/987654321?tk=counselor",
      })

      const res = await confirmManualPayment(
        {
          bookingId: "b-manual-1",
          paymentMethod: "BCA",
          referenceNumber: "TRX-BCA-982143",
        },
        {
          fetchBookingData: async () => ({
            booking: mockBooking,
            schedule: mockSchedule,
            counselor: mockCounselor,
            transaction: null,
          }),
          allocateAccount: mockAllocateAccount as any,
          getAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
          createMeeting: mockCreateMeeting as any,
          sendPatientEmail: vi.fn().mockResolvedValue(undefined),
          sendCounselorEmail: vi.fn().mockResolvedValue(undefined),
        }
      )

      expect(res.success).toBe(true)
      expect(res.zoomRoom).toBe("Akun Zoom Pro 1")
      expect(res.zoomJoinUrl).toBe("https://zoom.us/j/987654321")
      expect(res.zoomStartUrl).toBe("https://zoom.us/s/987654321?tk=counselor")
      expect(mockAllocateAccount).toHaveBeenCalledWith("2026-09-28", "19:00", "20:30")
      expect(mockCreateMeeting).toHaveBeenCalled()
    })
  })
})
