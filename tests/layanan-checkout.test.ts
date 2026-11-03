import { describe, it, expect, vi } from "vitest"
import {
  executeGetBookingContext,
  executeCreateGuestBooking,
  executeValidateVoucher,
} from "../lib/booking/checkout"
import type { ServiceLike } from "../lib/services/pricing"
import type { VoucherRecord } from "../lib/booking/voucher"

const NOW = new Date("2026-10-15T00:00:00.000Z") // 07:00 WIB
const COUNSELOR_ID = "123e4567-e89b-12d3-a456-426614174001"
const SCHEDULE_ID = "123e4567-e89b-12d3-a456-426614174000"

function makeService(overrides: Partial<ServiceLike>): ServiceLike {
  return {
    id: "svc",
    name: "Layanan",
    slug: "layanan",
    description: null,
    basePrice: "85000.00",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "35000.00",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["peer"],
    isActive: true,
    sortOrder: 0,
    ...overrides,
  }
}

const sebaya = makeService({
  id: "svc-sebaya",
  name: "Partner Cerita",
  slug: "partner-cerita",
  basePrice: "85000.00",
  promoPrice: "49000.00",
  allowedCounselorTypes: ["peer"],
  sortOrder: 1,
})
const psikolog = makeService({
  id: "svc-psikolog",
  name: "Psikolog Klinis",
  slug: "psikolog-klinis",
  basePrice: "150000.00",
  promoPrice: null,
  overtimeRatePer30Min: "60000.00",
  basePayoutPercent: 80,
  overtimePayoutPercent: 85,
  allowedCounselorTypes: ["psychologist"],
  sortOrder: 2,
})
const praNikah = makeService({
  id: "svc-pranikah",
  name: "Konseling Pra-Nikah",
  slug: "pra-nikah",
  basePrice: "200000.00",
  allowedCounselorTypes: ["psychologist"],
  sortOrder: 3,
})
const nonVoucher = makeService({
  id: "svc-novoucher",
  name: "Tanpa Voucher",
  slug: "tanpa-voucher",
  basePrice: "100000.00",
  allowVoucher: false,
  allowedCounselorTypes: ["peer"],
  sortOrder: 4,
})

const allServices = [sebaya, psikolog, praNikah, nonVoucher]

const peerCounselor = {
  id: COUNSELOR_ID,
  fullName: "Dimas Prakoso",
  title: "Konselor Sebaya",
  counselorType: "peer" as const,
  bio: "",
  avatarR2Url: null,
  specializations: [],
  isActive: true,
}
const psychCounselor = { ...peerCounselor, fullName: "Sarah Annisa", counselorType: "psychologist" as const }

const schedule = {
  id: SCHEDULE_ID,
  counselorId: COUNSELOR_ID,
  date: "2026-10-15",
  startTime: "19:00",
  endTime: "20:30",
  status: "available",
  reservedUntil: null,
  isLeave: false,
}

const baseInput = {
  scheduleId: SCHEDULE_ID,
  counselorId: COUNSELOR_ID,
  patientName: "Dewi Lestari",
  patientEmail: "dewi@example.com",
  patientEmailConfirm: "dewi@example.com",
  patientPhone: "081234567890",
  paymentProvider: "manual" as const,
  paymentMethod: "Bank BCA",
}

function ctxDeps(counselor: any, excluded: string[] = []) {
  return {
    getCounselor: async () => counselor,
    getSchedule: async () => schedule,
    getServices: async () => allServices,
    getExcludedServiceIds: async () => excluded,
    now: () => NOW,
  }
}

describe("Layanan di checkout (#20, ADR-0010)", () => {
  describe("katalog Layanan pada konteks booking", () => {
    it("hanya menawarkan Layanan yang tipenya cocok dengan konselor", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID },
        ctxDeps(psychCounselor)
      )
      expect(res.success).toBe(true)
      const ids = res.data!.services.map((s) => s.serviceId)
      expect(ids).toEqual(["svc-psikolog", "svc-pranikah"])
    })

    it("tidak menawarkan Layanan yang dimatikan Admin untuk konselor itu", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID },
        ctxDeps(psychCounselor, ["svc-pranikah"])
      )
      expect(res.data!.services.map((s) => s.serviceId)).toEqual(["svc-psikolog"])
    })

    it("memilih otomatis Layanan bila hanya satu yang ditawarkan, dengan harga aktif promo", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID },
        ctxDeps(psychCounselor, ["svc-pranikah"])
      )
      expect(res.data!.selectedServiceId).toBe("svc-psikolog")

      const sebayaRes = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID, serviceId: "svc-sebaya" },
        ctxDeps(peerCounselor)
      )
      const view = sebayaRes.data!.services.find((s) => s.serviceId === "svc-sebaya")!
      expect(view.activePrice).toBe(49000)
      expect(view.basePrice).toBe(85000)
      expect(view.isPromoActive).toBe(true)
    })

    it("meminta pilihan eksplisit bila beberapa Layanan ditawarkan", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID },
        ctxDeps(psychCounselor)
      )
      expect(res.data!.selectedServiceId).toBeNull()
    })

    it("menolak Layanan yang tidak ditawarkan konselor tersebut", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID, serviceId: "svc-psikolog" },
        ctxDeps(peerCounselor)
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Layanan")
    })

    it("gagal jelas (tanpa harga karangan) bila tidak ada Layanan aktif untuk konselor", async () => {
      const res = await executeGetBookingContext(
        { scheduleId: SCHEDULE_ID, counselorId: COUNSELOR_ID },
        { ...ctxDeps(peerCounselor), getServices: async () => [] }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Layanan")
    })
  })

  describe("validasi voucher per Layanan", () => {
    const voucher: VoucherRecord = {
      id: "v1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: "10",
      quota: 10,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    }

    it("menghitung diskon dari tarif aktif Layanan, bukan angka dari klien", async () => {
      const res = await executeValidateVoucher(
        { code: "hemat10", serviceId: "svc-psikolog" },
        { getService: async () => psikolog, getVoucher: async () => voucher, now: () => NOW }
      )
      expect(res.success).toBe(true)
      expect(res.data?.discountAmount).toBe(15000)
      expect(res.data?.netAmount).toBe(135000)
    })

    it("menolak voucher bila Layanan tidak mengizinkan voucher", async () => {
      const res = await executeValidateVoucher(
        { code: "HEMAT10", serviceId: "svc-novoucher" },
        { getService: async () => nonVoucher, getVoucher: async () => voucher, now: () => NOW }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Layanan")
    })

    it("menolak bila Layanan tidak ditemukan", async () => {
      const res = await executeValidateVoucher(
        { code: "HEMAT10", serviceId: "nope" },
        { getService: async () => null, getVoucher: async () => voucher, now: () => NOW }
      )
      expect(res.success).toBe(false)
    })
  })

  describe("membuat booking", () => {
    const reserve = () =>
      vi.fn().mockResolvedValue({ bookingId: "b-1", transactionId: "tx-1" })

    it("menyimpan referensi Layanan dan snapshot tarif pokok aktif sebelum voucher", async () => {
      const reserveMock = reserve()
      const voucher: VoucherRecord = {
        id: "v1",
        code: "HEMAT10",
        discountType: "fixed",
        discountValue: "10000",
        quota: 10,
        usedCount: 0,
        expiresAt: null,
        isActive: true,
      }
      const res = await executeCreateGuestBooking(
        { ...baseInput, serviceId: "svc-sebaya", voucherCode: "HEMAT10" },
        {
          ...ctxDeps(peerCounselor),
          getVoucher: async () => voucher,
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
        }
      )
      expect(res.success).toBe(true)
      const params = reserveMock.mock.calls[0][0]
      expect(params.serviceId).toBe("svc-sebaya")
      expect(params.basePriceSnapshot).toBe(49000) // promo aktif, sebelum voucher
      expect(params.grossAmount).toBe(49000)
      expect(params.discountAmount).toBe(10000)
      expect(params.netAmount).toBe(39000)
    })

    it("menolak Layanan yang tipenya tidak cocok dengan konselor", async () => {
      const reserveMock = reserve()
      const res = await executeCreateGuestBooking(
        { ...baseInput, serviceId: "svc-psikolog" },
        {
          ...ctxDeps(peerCounselor),
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
        }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Layanan")
      expect(reserveMock).not.toHaveBeenCalled()
    })

    it("menolak Layanan yang dimatikan untuk konselor ini", async () => {
      const reserveMock = reserve()
      const res = await executeCreateGuestBooking(
        { ...baseInput, serviceId: "svc-sebaya" },
        {
          ...ctxDeps(peerCounselor, ["svc-sebaya"]),
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
        }
      )
      expect(res.success).toBe(false)
      expect(reserveMock).not.toHaveBeenCalled()
    })

    it("menolak Layanan nonaktif", async () => {
      const reserveMock = reserve()
      const res = await executeCreateGuestBooking(
        { ...baseInput, serviceId: "svc-sebaya" },
        {
          ...ctxDeps(peerCounselor),
          getServices: async () => [{ ...sebaya, isActive: false }],
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserveMock,
        }
      )
      expect(res.success).toBe(false)
      expect(reserveMock).not.toHaveBeenCalled()
    })

    it("mewajibkan serviceId pada formulir", async () => {
      const res = await executeCreateGuestBooking(baseInput as any, {
        ...ctxDeps(peerCounselor),
        getActiveSessionsOnDate: async () => [],
        reserveSlotAndCreateBooking: reserve(),
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Layanan")
    })

    it("tidak membolehkan voucher pada Layanan yang menolak voucher", async () => {
      const voucher: VoucherRecord = {
        id: "v1",
        code: "HEMAT10",
        discountType: "fixed",
        discountValue: "10000",
        quota: 10,
        usedCount: 0,
        expiresAt: null,
        isActive: true,
      }
      const res = await executeCreateGuestBooking(
        { ...baseInput, serviceId: "svc-novoucher", voucherCode: "HEMAT10" },
        {
          ...ctxDeps(peerCounselor),
          getVoucher: async () => voucher,
          getActiveSessionsOnDate: async () => [],
          reserveSlotAndCreateBooking: reserve(),
        }
      )
      expect(res.success).toBe(false)
    })
  })
})
