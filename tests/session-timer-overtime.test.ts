import { describe, it, expect } from "vitest"
import {
  CHIME_MINUTE,
  advanceTimer,
  crossesChimeMinute,
  shouldAutoRecordOvertime,
} from "@/lib/counselor/timer"
import { MAX_OVERTIME_BLOCKS, overtimeBlocks } from "@/lib/booking-cycle"
import { overtimeCharge, overtimeHonor } from "@/lib/services/pricing"
import { planOvertimeCorrection } from "@/lib/session/overtime"
import { sessionReportSchema } from "@/lib/validations/counselor"

const BOOKING_ID = "123e4567-e89b-12d3-a456-426614174000"

describe("Timer Melayang: chime menit 80", () => {
  it("chime berbunyi tepat sekali saat melewati detik ke 80*60", () => {
    expect(CHIME_MINUTE).toBe(80)
    let chimes = 0
    let elapsed = 0
    for (let i = 0; i < 125 * 60; i++) {
      const next = advanceTimer(elapsed).elapsedSeconds
      if (crossesChimeMinute(elapsed, next)) chimes++
      elapsed = next
    }
    expect(chimes).toBe(1)
  })

  it("tidak berbunyi pada detik sebelum menit 80", () => {
    expect(crossesChimeMinute(80 * 60 - 2, 80 * 60 - 1)).toBe(false)
    expect(crossesChimeMinute(80 * 60 - 1, 80 * 60)).toBe(true)
    expect(crossesChimeMinute(80 * 60, 80 * 60 + 1)).toBe(false)
  })
})

describe("Timer Melayang: berhenti di menit 120", () => {
  it("berhenti tepat di 7200 detik dan tidak maju lagi", () => {
    expect(advanceTimer(7199)).toEqual({ elapsedSeconds: 7200, stopped: true })
    expect(advanceTimer(7200)).toEqual({ elapsedSeconds: 7200, stopped: true })
    expect(advanceTimer(100)).toEqual({ elapsedSeconds: 101, stopped: false })
  })
})

describe("Overtime otomatis", () => {
  it("sesi 96 menit menghasilkan 1 blok, <=95 menit tidak ada", () => {
    expect(overtimeBlocks(95)).toBe(0)
    expect(overtimeBlocks(96)).toBe(1)
    expect(MAX_OVERTIME_BLOCKS).toBe(1)
  })

  it("dicatat otomatis di menit ke-96, tepat sekali", () => {
    expect(shouldAutoRecordOvertime(95, false)).toBe(false)
    expect(shouldAutoRecordOvertime(96, false)).toBe(true)
    expect(shouldAutoRecordOvertime(110, false)).toBe(true)
    expect(shouldAutoRecordOvertime(96, true)).toBe(false)
  })
})

describe("Tagihan dan honor overtime dari Layanan", () => {
  it("tagihan = blok x tarif overtime Layanan", () => {
    expect(overtimeCharge(0, 35000)).toBe(0)
    expect(overtimeCharge(1, 35000)).toBe(35000)
    expect(overtimeCharge(1, 60000)).toBe(60000)
  })

  it("honor overtime = tagihan x Bagi Hasil overtime", () => {
    expect(overtimeHonor(0, 60000, 85)).toBe(0)
    expect(overtimeHonor(1, 35000, 80)).toBe(28000)
    expect(overtimeHonor(1, 60000, 85)).toBe(51000)
  })
})

describe("Koreksi blok di Laporan Sesi", () => {
  const none = { isExtended: false, extensionMinutes: 0, extensionFee: "0", extensionPaymentStatus: "NONE" }
  const recorded = { isExtended: true, extensionMinutes: 30, extensionFee: "35000.00", extensionPaymentStatus: "NONE" }

  it("menghapus blok yang salah catat menghapus tagihan", () => {
    const plan = planOvertimeCorrection({ current: recorded, blocks: 0, ratePer30Min: 35000 })
    expect(plan).toEqual({
      ok: true,
      update: { isExtended: false, extensionMinutes: 0, extensionFee: "0", extensionPaymentStatus: "NONE" },
      blocks: 0,
      fee: 0,
    })
  })

  it("menambah blok yang terlewat memakai tarif Layanan", () => {
    const plan = planOvertimeCorrection({ current: none, blocks: 1, ratePer30Min: 60000 })
    expect(plan).toEqual({
      ok: true,
      update: { isExtended: true, extensionMinutes: 30, extensionFee: "60000", extensionPaymentStatus: "NONE" },
      blocks: 1,
      fee: 60000,
    })
  })

  it("menolak blok di atas batas 120 menit", () => {
    const plan = planOvertimeCorrection({ current: none, blocks: 2, ratePer30Min: 35000 })
    expect(plan.ok).toBe(false)
  })

  it("menolak perubahan setelah tagihan diproses (PENDING/PAID), tetapi nilai sama tidak masalah", () => {
    for (const status of ["PENDING", "PAID"]) {
      const current = { ...recorded, extensionPaymentStatus: status }
      expect(planOvertimeCorrection({ current, blocks: 0, ratePer30Min: 35000 }).ok).toBe(false)
      const same = planOvertimeCorrection({ current, blocks: 1, ratePer30Min: 35000 })
      expect(same.ok).toBe(true)
      if (same.ok) expect(same.update).toBeNull()
    }
  })

  it("schema laporan menerima overtimeBlocks 0..1 dan menolak lainnya", () => {
    const base = {
      bookingId: BOOKING_ID,
      mainIssue: "Stres akademik",
      summary: "Ringkasan dinamika sesi yang cukup panjang.",
    }
    expect(sessionReportSchema.safeParse({ ...base, overtimeBlocks: 0 }).success).toBe(true)
    expect(sessionReportSchema.safeParse({ ...base, overtimeBlocks: 1 }).success).toBe(true)
    expect(sessionReportSchema.safeParse({ ...base, overtimeBlocks: 2 }).success).toBe(false)
    expect(sessionReportSchema.safeParse({ ...base, overtimeBlocks: -1 }).success).toBe(false)
    expect(sessionReportSchema.safeParse(base).success).toBe(true)
  })
})
