import { describe, it, expect, vi } from "vitest"
import {
  calculateDiscount,
  evaluateVoucherEligibility,
  type VoucherRecord,
} from "../lib/booking/voucher"
import {
  computeHoldExpiry,
  isHoldExpired,
  generateSessionAccessToken,
  generateReferenceNumber,
  SLOT_HOLD_MINUTES,
  OFFICIAL_BANK_ACCOUNTS,
} from "../lib/booking/hold"
import {
  validateVoucherSchema,
  createGuestBookingSchema,
} from "../lib/validations/booking"
import {
  validateVoucherAction,
  getBookingContextAction,
  createGuestBookingAction,
  getBookingByTokenAction,
} from "../app/booking/actions"

describe("Issue #7: Guest Patient Booking Flow (Slot Hold, Checkout, Voucher, Xendit & Manual Transfer)", () => {
  const mockNow = new Date("2026-10-15T10:00:00.000Z")

  describe("1. Voucher Calculation & Policy Rules", () => {
    it("calculates fixed discount correctly and caps at grossAmount", () => {
      // Normal fixed discount
      const res1 = calculateDiscount(100000, "fixed", 25000)
      expect(res1.discountAmount).toBe(25000)
      expect(res1.netAmount).toBe(75000)

      // Fixed discount greater than grossAmount
      const res2 = calculateDiscount(50000, "fixed", 60000)
      expect(res2.discountAmount).toBe(50000)
      expect(res2.netAmount).toBe(0)
    })

    it("calculates percentage discount correctly and caps at grossAmount", () => {
      // 20% discount on 100000
      const res1 = calculateDiscount(100000, "percentage", 20)
      expect(res1.discountAmount).toBe(20000)
      expect(res1.netAmount).toBe(80000)

      // 100% discount
      const res2 = calculateDiscount(50000, "percentage", 100)
      expect(res2.discountAmount).toBe(50000)
      expect(res2.netAmount).toBe(0)
    })

    it("rejects voucher if counselor type has allowVoucher=false", () => {
      const voucher: VoucherRecord = {
        id: "v-1",
        code: "HEMAT20",
        discountType: "percentage",
        discountValue: "20",
        quota: 100,
        usedCount: 10,
        expiresAt: new Date("2026-12-31"),
        isActive: true,
      }

      const res = evaluateVoucherEligibility({
        voucher,
        allowVoucher: false,
        grossAmount: 100000,
        now: mockNow,
      })

      expect(res.eligible).toBe(false)
      expect(res.reason).toContain("tidak berlaku untuk tipe konselor ini")
      expect(res.discountAmount).toBe(0)
      expect(res.netAmount).toBe(100000)
    })

    it("rejects inactive voucher", () => {
      const voucher: VoucherRecord = {
        id: "v-2",
        code: "HEMAT50",
        discountType: "fixed",
        discountValue: "50000",
        quota: 50,
        usedCount: 0,
        expiresAt: null,
        isActive: false,
      }

      const res = evaluateVoucherEligibility({
        voucher,
        allowVoucher: true,
        grossAmount: 100000,
        now: mockNow,
      })

      expect(res.eligible).toBe(false)
      expect(res.reason).toContain("tidak aktif")
    })

    it("rejects expired voucher", () => {
      const voucher: VoucherRecord = {
        id: "v-3",
        code: "EXPIRED",
        discountType: "fixed",
        discountValue: "10000",
        quota: 50,
        usedCount: 5,
        expiresAt: new Date("2026-10-01"), // Expired before mockNow (2026-10-15)
        isActive: true,
      }

      const res = evaluateVoucherEligibility({
        voucher,
        allowVoucher: true,
        grossAmount: 100000,
        now: mockNow,
      })

      expect(res.eligible).toBe(false)
      expect(res.reason).toContain("kedaluwarsa")
    })

    it("rejects exhausted voucher when usedCount >= quota", () => {
      const voucher: VoucherRecord = {
        id: "v-4",
        code: "QUOTAHABIS",
        discountType: "fixed",
        discountValue: "20000",
        quota: 10,
        usedCount: 10,
        expiresAt: null,
        isActive: true,
      }

      const res = evaluateVoucherEligibility({
        voucher,
        allowVoucher: true,
        grossAmount: 100000,
        now: mockNow,
      })

      expect(res.eligible).toBe(false)
      expect(res.reason).toContain("habis")
    })

    it("accepts valid voucher and applies discount", () => {
      const voucher: VoucherRecord = {
        id: "v-5",
        code: "SOLULUBARU",
        discountType: "fixed",
        discountValue: "25000",
        quota: 100,
        usedCount: 42,
        expiresAt: new Date("2026-12-31"),
        isActive: true,
      }

      const res = evaluateVoucherEligibility({
        voucher,
        allowVoucher: true,
        grossAmount: 100000,
        now: mockNow,
      })

      expect(res.eligible).toBe(true)
      expect(res.discountAmount).toBe(25000)
      expect(res.netAmount).toBe(75000)
    })
  })

  describe("2. Slot Hold & Timing Guardrails", () => {
    it("computes hold expiry as NOW + 17 minutes", () => {
      expect(SLOT_HOLD_MINUTES).toBe(17)
      const expiry = computeHoldExpiry(mockNow)
      expect(expiry.getTime() - mockNow.getTime()).toBe(17 * 60 * 1000)
    })

    it("detects whether a hold has expired", () => {
      const futureHold = new Date(mockNow.getTime() + 5 * 60 * 1000)
      const pastHold = new Date(mockNow.getTime() - 1 * 60 * 1000)

      expect(isHoldExpired(futureHold, mockNow)).toBe(false)
      expect(isHoldExpired(pastHold, mockNow)).toBe(true)
      expect(isHoldExpired(null, mockNow)).toBe(true)
    })

    it("generates 32-character hex session access token", () => {
      const token = generateSessionAccessToken()
      expect(token).toHaveLength(32)
      expect(/^[0-9a-f]{32}$/.test(token)).toBe(true)
    })

    it("generates human-friendly reference number with date prefix", () => {
      const ref = generateReferenceNumber(new Date("2026-10-15T00:00:00Z"))
      expect(ref.startsWith("SOL-20261015-")).toBe(true)
    })

    it("provides official platform bank accounts for manual transfer", () => {
      expect(OFFICIAL_BANK_ACCOUNTS.length).toBeGreaterThanOrEqual(3)
      const bca = OFFICIAL_BANK_ACCOUNTS.find((b) => b.bankName.includes("BCA"))
      expect(bca).toBeDefined()
      expect(bca?.accountNumber).toBe("1234567890")
      expect(bca?.accountHolder).toBe("PT Solulu Kesehatan Indonesia")
    })
  })

  describe("3. Zod Form Validations", () => {
    it("validates guest booking form with email confirmation match", () => {
      const valid = createGuestBookingSchema.safeParse({
        scheduleId: "123e4567-e89b-12d3-a456-426614174000",
        counselorId: "123e4567-e89b-12d3-a456-426614174001",
        patientName: "Budi Santoso",
        patientEmail: "budi@example.com",
        patientEmailConfirm: "budi@example.com",
        patientPhone: "081234567890",
        paymentProvider: "xendit",
      })
      expect(valid.success).toBe(true)

      // Mismatched emails
      const mismatch = createGuestBookingSchema.safeParse({
        scheduleId: "123e4567-e89b-12d3-a456-426614174000",
        counselorId: "123e4567-e89b-12d3-a456-426614174001",
        patientName: "Budi Santoso",
        patientEmail: "budi@example.com",
        patientEmailConfirm: "budi2@example.com",
        patientPhone: "081234567890",
        paymentProvider: "xendit",
      })
      expect(mismatch.success).toBe(false)
      if (!mismatch.success) {
        expect(mismatch.error.issues[0].message).toContain("tidak cocok")
      }
    })

    it("validates Indonesian phone numbers accurately", () => {
      const validPhones = ["081234567890", "+6281234567890", "628987654321"]
      for (const phone of validPhones) {
        const res = createGuestBookingSchema.safeParse({
          scheduleId: "123e4567-e89b-12d3-a456-426614174000",
          counselorId: "123e4567-e89b-12d3-a456-426614174001",
          patientName: "Budi Santoso",
          patientEmail: "budi@example.com",
          patientEmailConfirm: "budi@example.com",
          patientPhone: phone,
          paymentProvider: "manual",
        })
        expect(res.success).toBe(true)
      }

      const invalidPhone = createGuestBookingSchema.safeParse({
        scheduleId: "123e4567-e89b-12d3-a456-426614174000",
        counselorId: "123e4567-e89b-12d3-a456-426614174001",
        patientName: "Budi Santoso",
        patientEmail: "budi@example.com",
        patientEmailConfirm: "budi@example.com",
        patientPhone: "12345",
        paymentProvider: "manual",
      })
      expect(invalidPhone.success).toBe(false)
    })
  })

  describe("4. Server Action: validateVoucherAction", () => {
    it("returns discount and net amount for valid voucher", async () => {
      const mockVoucher: VoucherRecord = {
        id: "v-valid",
        code: "DISKON15",
        discountType: "percentage",
        discountValue: "15",
        quota: 100,
        usedCount: 5,
        expiresAt: new Date("2026-12-31"),
        isActive: true,
      }

      const res = await validateVoucherAction(
        {
          code: "diskon15",
          counselorType: "peer",
          grossAmount: 50000,
        },
        {
          getPricing: async () => ({ allowVoucher: true }),
          getVoucher: async () => mockVoucher,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.discountAmount).toBe(7500)
      expect(res.data?.netAmount).toBe(42500)
      expect(res.data?.code).toBe("DISKON15")
    })

    it("rejects voucher if counselor type forbids vouchers", async () => {
      const mockVoucher: VoucherRecord = {
        id: "v-valid",
        code: "DISKON15",
        discountType: "percentage",
        discountValue: "15",
        quota: 100,
        usedCount: 5,
        expiresAt: null,
        isActive: true,
      }

      const res = await validateVoucherAction(
        {
          code: "DISKON15",
          counselorType: "psychologist",
          grossAmount: 150000,
        },
        {
          getPricing: async () => ({ allowVoucher: false }),
          getVoucher: async () => mockVoucher,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("tidak berlaku untuk tipe konselor ini")
    })
  })

  describe("5. Server Action: getBookingContextAction", () => {
    const mockCounselor = {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa",
      counselorType: "psychologist" as const,
      bio: "Spesialis kecemasan dan trauma.",
      avatarR2Url: null,
      specializations: ["Kecemasan", "Trauma"],
      isActive: true,
    }

    const mockSchedule = {
      id: "s-1",
      counselorId: "c-1",
      date: "2026-10-15",
      startTime: "19:00",
      endTime: "20:30",
      status: "available",
      reservedUntil: null,
    }

    const mockPricing = {
      basePrice: "150000",
      promoPrice: "120000",
      isSaleActive: true,
      allowVoucher: true,
    }

    it("fetches booking context including counselor, schedule, and promotional pricing", async () => {
      const res = await getBookingContextAction(
        { scheduleId: "s-1", counselorId: "c-1" },
        {
          getCounselor: async () => mockCounselor,
          getSchedule: async () => mockSchedule,
          getPricing: async () => mockPricing,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.counselor.fullName).toBe("Sarah Annisa, M.Psi., Psikolog")
      expect(res.data?.schedule.timeRange).toBe("19:00 – 20:30 WIB")
      expect(res.data?.pricing.grossAmount).toBe(120000)
      expect(res.data?.pricing.isSaleActive).toBe(true)
      expect(res.data?.schedule.isAvailable).toBe(true)
    })
  })

  describe("6. Server Action: createGuestBookingAction", () => {
    const mockCounselorId = "123e4567-e89b-12d3-a456-426614174001"
    const mockScheduleId = "123e4567-e89b-12d3-a456-426614174000"

    const mockCounselor = {
      id: mockCounselorId,
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      counselorType: "psychologist" as const,
      isActive: true,
    }

    const mockSchedule = {
      id: mockScheduleId,
      counselorId: mockCounselorId,
      date: "2026-10-15",
      startTime: "19:00",
      endTime: "20:30",
      status: "available",
      reservedUntil: null,
    }

    const mockPricing = {
      basePrice: "150000",
      promoPrice: null,
      isSaleActive: false,
      allowVoucher: true,
    }

    it("rejects booking if slot is already booked", async () => {
      const res = await createGuestBookingAction(
        {
          scheduleId: mockScheduleId,
          counselorId: mockCounselorId,
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientEmailConfirm: "dewi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "xendit",
        },
        {
          getSchedule: async () => ({ ...mockSchedule, status: "booked" }),
          getCounselor: async () => mockCounselor,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("sudah dipesan")
    })

    it("rejects booking if slot is actively held by someone else", async () => {
      const futureHold = new Date(mockNow.getTime() + 10 * 60 * 1000)
      const res = await createGuestBookingAction(
        {
          scheduleId: mockScheduleId,
          counselorId: mockCounselorId,
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientEmailConfirm: "dewi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "xendit",
        },
        {
          getSchedule: async () => ({
            ...mockSchedule,
            status: "reserved",
            reservedUntil: futureHold,
          }),
          getCounselor: async () => mockCounselor,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("sedang dalam proses pembayaran")
    })

    it("reclaims slot if previous hold expired and proceeds with hold", async () => {
      const pastHold = new Date(mockNow.getTime() - 5 * 60 * 1000)
      const reserveMock = vi.fn().mockResolvedValue({
        bookingId: "b-new",
        transactionId: "tx-new",
      })

      const invoiceMock = vi.fn().mockResolvedValue({
        id: "inv-123",
        externalId: "txn_tx-new",
        status: "PENDING",
        invoiceUrl: "https://checkout.xendit.co/web/inv-123",
        expiryDate: new Date(mockNow.getTime() + 900 * 1000).toISOString(),
        amount: 150000,
      })

      const res = await createGuestBookingAction(
        {
          scheduleId: mockScheduleId,
          counselorId: mockCounselorId,
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientEmailConfirm: "dewi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "xendit",
        },
        {
          getSchedule: async () => ({
            ...mockSchedule,
            status: "reserved",
            reservedUntil: pastHold,
          }),
          getCounselor: async () => mockCounselor,
          getPricing: async () => mockPricing,
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
          createInvoice: invoiceMock,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.paymentProvider).toBe("xendit")
      expect(res.data?.paymentUrl).toBe("https://checkout.xendit.co/web/inv-123")
      expect(reserveMock).toHaveBeenCalled()
    })

    it("blocks booking if platform-wide concurrency guard (>= 2 active sessions) is reached", async () => {
      const activeSessions = [
        { startTime: "19:00", endTime: "20:30" },
        { startTime: "19:30", endTime: "21:00" },
      ]

      const res = await createGuestBookingAction(
        {
          scheduleId: mockScheduleId,
          counselorId: mockCounselorId,
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientEmailConfirm: "dewi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "xendit",
        },
        {
          getSchedule: async () => mockSchedule,
          getCounselor: async () => mockCounselor,
          getPricing: async () => mockPricing,
          getActiveSessionsOnDate: async () => activeSessions,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("Kapasitas ruang Zoom penuh")
    })

    it("supports Manual Bank Transfer path with redirect to manual pending page", async () => {
      const reserveMock = vi.fn().mockResolvedValue({
        bookingId: "b-manual",
        transactionId: "tx-manual",
      })

      const res = await createGuestBookingAction(
        {
          scheduleId: mockScheduleId,
          counselorId: mockCounselorId,
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientEmailConfirm: "dewi@example.com",
          patientPhone: "081234567890",
          paymentProvider: "manual",
          paymentMethod: "Bank BCA",
        },
        {
          getSchedule: async () => mockSchedule,
          getCounselor: async () => mockCounselor,
          getPricing: async () => mockPricing,
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
          now: () => mockNow,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.paymentProvider).toBe("manual")
      expect(res.data?.redirectUrl).toContain("/booking/manual-pending?token=")
      expect(res.data?.referenceNumber).toBeDefined()
    })
  })

  describe("7. Server Action: getBookingByTokenAction", () => {
    it("returns booking details by valid accessToken", async () => {
      const mockResult = {
        booking: {
          id: "b-1",
          accessToken: "a".repeat(32),
          patientName: "Dewi Lestari",
          patientEmail: "dewi@example.com",
          patientPhone: "081234567890",
          initialNotes: "Perlu teman bercerita",
          status: "pending_payment",
          createdAt: mockNow,
        },
        counselor: {
          id: "c-1",
          fullName: "Sarah Annisa, M.Psi., Psikolog",
          title: "Psikolog Klinis",
          counselorType: "psychologist",
          counselorTypeDisplay: "Psikolog Klinis",
          avatarR2Url: null,
        },
        schedule: {
          id: "s-1",
          date: "2026-10-15",
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
        },
        transaction: {
          id: "tx-1",
          paymentProvider: "manual",
          paymentMethod: "Bank BCA",
          referenceNumber: "SOL-20261015-ABCD",
          grossAmount: 150000,
          discountAmount: 0,
          netAmount: 150000,
          netAmountFormatted: "Rp 150.000",
          status: "PENDING",
        },
      }

      const res = await getBookingByTokenAction("a".repeat(32), {
        getBookingWithDetails: async () => mockResult,
      })

      expect(res.success).toBe(true)
      expect(res.data?.booking.patientName).toBe("Dewi Lestari")
      expect(res.data?.transaction?.referenceNumber).toBe("SOL-20261015-ABCD")
      expect(res.data?.schedule.timeRange).toBe("19:00 – 20:30 WIB")
    })
  })
})
