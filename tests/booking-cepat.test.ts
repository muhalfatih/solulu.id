import { describe, it, expect, vi } from "vitest"
import { createBookingCepat, isBookingCepatHoldExpired } from "@/lib/booking/booking-cepat"
import type { BookingDependencies, CheckoutTx } from "@/lib/booking/checkout"
import { holdExpiresAt } from "@/lib/booking-cycle"
import { honorForSession } from "@/lib/finance/honor"
import { buildAuditRow } from "@/lib/audit/record"
import { getVisibleNav } from "@/lib/shell/nav"
import type { ServiceLike } from "@/lib/services/pricing"
import type { RoleCarrier } from "@/lib/auth/staff-role"

// 2026-11-03 10:00 WIB
const NOW = new Date("2026-11-03T10:00:00+07:00")

const admin: RoleCarrier = { id: "admin-1", app_metadata: { role: "admin" } }
const operator: RoleCarrier = { id: "op-1", app_metadata: { role: "operator" } }

const service: ServiceLike = {
  id: "svc-1",
  name: "Sesi Konseling",
  slug: "sesi",
  description: null,
  basePrice: "100000",
  promoPrice: "80000",
  allowVoucher: true,
  overtimeRatePer30Min: "35000",
  basePayoutPercent: 70,
  overtimePayoutPercent: 70,
  allowedCounselorTypes: ["peer", "psychologist"],
  isActive: true,
  sortOrder: 1,
}

const client = {
  counselorId: "c-1",
  scheduleId: "s-1",
  serviceId: "svc-1",
  patientName: "Siti Aminah",
  patientEmail: "siti@example.com",
  patientPhone: "08123456789",
}

function setup() {
  const audits: unknown[] = []
  const updates: { table: unknown; values: Record<string, unknown> }[] = []
  const executor = {
    insert: () => ({
      values: async (row: unknown) => {
        audits.push(row)
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          updates.push({ table, values })
        },
      }),
    }),
  } as unknown as CheckoutTx
  const reserved: { reservedUntil: Date; basePriceSnapshot: number; netAmount: number }[] = []
  const checkoutDeps: BookingDependencies = {
    now: () => NOW,
    getSchedule: async () => ({
      id: "s-1",
      counselorId: "c-1",
      date: "2026-11-03",
      startTime: "10:30:00",
      endTime: "12:00:00",
      status: "available",
    }),
    getCounselor: async () => ({ id: "c-1", fullName: "Dra. Rina", isActive: true, counselorType: "psychologist" }),
    getServices: async () => [service],
    getExcludedServiceIds: async () => [],
    getActiveSessionsOnDate: async () => [],
    getZoomCapacity: async () => 10,
    checkExistingPendingHold: async () => true, // harus diabaikan untuk Booking Cepat
    reserveSlotAndCreateBooking: async (p) => {
      reserved.push({ reservedUntil: p.reservedUntil, basePriceSnapshot: p.basePriceSnapshot, netAmount: p.netAmount })
      return { bookingId: "b-1", transactionId: "t-1" }
    },
    createInvoice: vi.fn(async () => ({ id: "inv-1", invoiceUrl: "https://checkout.xendit.test/inv-1" })) as never,
    executor,
  }
  const fulfill = vi.fn(async (id: string) => ({ success: true, bookingId: id }))
  const deps = {
    checkoutDeps,
    fulfill: fulfill as never,
    getHoldMinutes: async () => 60,
    now: () => NOW,
    describeSession: async () => ({
      counselorName: "Dra. Rina",
      date: "2026-11-03",
      startTime: "10:30:00",
      endTime: "12:00:00",
    }),
  }
  return { deps, audits, updates, reserved, fulfill, checkoutDeps }
}

describe("Ticket 30: Booking Cepat", () => {
  it("menolak non-Admin", async () => {
    const { deps } = setup()
    const res = await createBookingCepat({ ...client, payment: { way: "xendit" } }, deps, operator)
    expect(res.success).toBe(false)
  })

  it("cara Xendit: hold 60 menit, tautan bayar, URL WhatsApp, audit, belum difulfill", async () => {
    const { deps, audits, reserved, fulfill } = setup()
    const res = await createBookingCepat({ ...client, payment: { way: "xendit" } }, deps, admin)
    expect(res.success, JSON.stringify(res)).toBe(true)
    if (!res.success) return
    expect(res.data.paymentUrl).toBe("https://checkout.xendit.test/inv-1")
    expect(res.data.waUrl).toMatch(/^https:\/\/wa\.me\/628123456789\?text=/)
    expect(decodeURIComponent(res.data.waUrl!)).toContain("https://checkout.xendit.test/inv-1")
    expect(reserved[0].reservedUntil.getTime()).toBe(holdExpiresAt(NOW, "booking_cepat", 60).getTime())
    expect(reserved[0].reservedUntil.getTime() - NOW.getTime()).toBe(60 * 60_000)
    expect(fulfill).not.toHaveBeenCalled()
    expect(audits).toHaveLength(1)
    expect((audits[0] as { action: string }).action).toBe("booking.quick_create")
  })

  it("hold berakhir setelah 60 menit (aturan Siklus Booking), dapat dikonfigurasi", () => {
    expect(isBookingCepatHoldExpired(NOW, new Date(NOW.getTime() + 59 * 60_000))).toBe(false)
    expect(isBookingCepatHoldExpired(NOW, new Date(NOW.getTime() + 61 * 60_000))).toBe(true)
    expect(isBookingCepatHoldExpired(NOW, new Date(NOW.getTime() + 61 * 60_000), 90)).toBe(false)
  })

  it("cara transfer: transaksi PAID + bukti, audit, lalu fulfillSession manual_bank", async () => {
    const { deps, audits, updates, fulfill } = setup()
    const res = await createBookingCepat(
      { ...client, payment: { way: "transfer", proofR2Key: "uploads/bukti.jpg", referenceNumber: "TRF-778812" } },
      deps,
      admin
    )
    expect(res.success, JSON.stringify(res)).toBe(true)
    if (!res.success) return
    expect(res.data.fulfilled).toBe(true)
    expect(fulfill).toHaveBeenCalledWith("b-1", { source: "manual_bank" })
    expect(updates.some((u) => u.values.status === "PAID")).toBe(true)
    expect(updates.some((u) => u.values.manualPaymentProofR2Key === "uploads/bukti.jpg")).toBe(true)
    expect(updates.some((u) => u.values.referenceNumber === "TRF-778812")).toBe(true)
    expect(audits).toHaveLength(1)
  })

  it("transfer tanpa nomor referensi ditolak (tidak dikarang sistem)", async () => {
    const { deps, audits } = setup()
    const res = await createBookingCepat(
      { ...client, payment: { way: "transfer", proofR2Key: "uploads/bukti.jpg" } },
      deps,
      admin
    )
    expect(res.success).toBe(false)
    expect(audits).toHaveLength(0)
  })

  it("transfer tanpa bukti ditolak", async () => {
    const { deps } = setup()
    const res = await createBookingCepat({ ...client, payment: { way: "transfer", proofR2Key: "" } }, deps, admin)
    expect(res.success).toBe(false)
  })

  it("Rp 0 tanpa alasan ditolak", async () => {
    const { deps, audits } = setup()
    for (const reason of ["", "  ", "ab"]) {
      const res = await createBookingCepat({ ...client, payment: { way: "manual_zero", reason } }, deps, admin)
      expect(res.success).toBe(false)
    }
    expect(audits).toHaveLength(0)
  })

  it("Rp 0 dengan alasan: net 0, gross tarif aktif, audit memuat alasan, Honor dari tarif aktif Layanan", async () => {
    const { deps, audits, updates, reserved, fulfill } = setup()
    const res = await createBookingCepat(
      { ...client, payment: { way: "manual_zero", reason: "Beasiswa mahasiswa" } },
      deps,
      admin
    )
    expect(res.success, JSON.stringify(res)).toBe(true)
    if (!res.success) return
    expect(res.data.netAmount).toBe(0)
    expect(fulfill).toHaveBeenCalledWith("b-1", { source: "admin_bypass" })
    const tx = updates.find((u) => u.values.status === "PAID")!
    expect(tx.values.netAmount).toBe("0.00")
    expect(tx.values.discountAmount).toBe("80000.00")
    expect(tx.values.adminNotes).toBe("Beasiswa mahasiswa")
    expect((audits[0] as { after: { reason: string } }).after.reason).toBe("Beasiswa mahasiswa")

    // basePriceSnapshot booking = tarif aktif (promo 80000), jadi Honor tetap dihitung penuh walau klien bayar Rp 0.
    expect(reserved[0].basePriceSnapshot).toBe(80000)
    const honor = honorForSession({
      basePriceSnapshot: reserved[0].basePriceSnapshot,
      basePayoutPercent: service.basePayoutPercent,
      overtimeAmount: 0,
      overtimePayoutPercent: service.overtimePayoutPercent,
    })
    expect(honor.totalHonor).toBe(56000)
  })

  it("baris audit memiliki aktor Admin", () => {
    const row = buildAuditRow({ actor: admin, action: "booking.quick_create", entityType: "booking", entityId: "b-1" })
    expect(row.actorRole).toBe("admin")
  })

  it("menu Booking Cepat tampil untuk Admin", () => {
    const titles = getVisibleNav("admin", "admin").flatMap((g) => g.items.map((i) => i.title))
    expect(titles).toContain("Booking Cepat")
  })
})
