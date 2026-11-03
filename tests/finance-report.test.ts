import { describe, it, expect } from "vitest"
import {
  buildProfitLoss,
  comparisonRange,
  hppBySessionDate,
  omzetByPaidDate,
  type PlannedHonorRow,
} from "@/lib/finance"

const honor = (sessionDate: string, base: number, overtime = 0): PlannedHonorRow => ({
  bookingId: sessionDate + base, counselorId: "c", serviceId: "s", sessionDate,
  baseAmount: base, overtimeAmount: overtime, basePayoutPercent: 80, overtimePayoutPercent: 85,
  basePeriodStart: null, overtimePeriodStart: null,
})

describe("comparisonRange", () => {
  it("rentang berjumlah hari sama tepat sebelumnya", () => {
    expect(comparisonRange({ from: "2026-11-16", to: "2026-11-20" })).toEqual({ from: "2026-11-11", to: "2026-11-15" })
  })
  it("melintasi batas bulan dan tahun", () => {
    expect(comparisonRange({ from: "2026-01-01", to: "2026-01-15" })).toEqual({ from: "2025-12-17", to: "2025-12-31" })
  })
  it("satu hari", () => {
    expect(comparisonRange({ from: "2026-03-01", to: "2026-03-01" })).toEqual({ from: "2026-02-28", to: "2026-02-28" })
  })
  it("menolak rentang terbalik atau tanggal tidak valid", () => {
    expect(() => comparisonRange({ from: "2026-11-20", to: "2026-11-16" })).toThrow()
    expect(() => comparisonRange({ from: "2026-13-01", to: "2026-13-02" })).toThrow()
  })
})

describe("Omzet vs HPP: basis tanggal berbeda", () => {
  it("Omzet menurut tanggal lunas (WIB), hanya yang PAID", () => {
    const total = omzetByPaidDate(
      [
        { status: "PAID", paidAt: new Date("2026-11-05T17:30:00Z"), netAmount: 100000 }, // 6 Nov 00:30 WIB
        { status: "PAID", paidAt: new Date("2026-11-05T16:00:00Z"), netAmount: 50000 }, // 5 Nov 23:00 WIB
        { status: "PENDING", paidAt: null, netAmount: 999 },
        { status: "PAID", paidAt: new Date("2026-11-20T00:00:00Z"), netAmount: 7 },
      ],
      { from: "2026-11-06", to: "2026-11-10" }
    )
    expect(total).toBe(100000)
  })

  it("HPP menurut tanggal sesi, pokok + overtime", () => {
    const total = hppBySessionDate(
      [honor("2026-11-05", 100, 10), honor("2026-11-06", 200, 20), honor("2026-11-11", 999)],
      { from: "2026-11-06", to: "2026-11-10" }
    )
    expect(total).toBe(220)
  })

  it("booking dibayar di rentang A tetapi sesi di rentang B: Omzet di A, HPP di B", () => {
    const a = { from: "2026-11-01", to: "2026-11-15" }
    const b = { from: "2026-11-16", to: "2026-11-30" }
    const pay = [{ status: "PAID" as const, paidAt: new Date("2026-11-10T03:00:00Z"), netAmount: 150000 }]
    const hon = [honor("2026-11-18", 120000)]
    expect(buildProfitLoss({ range: a, payments: pay, honors: hon })).toMatchObject({ omzet: 150000, hpp: 0, labaBersih: 150000 })
    expect(buildProfitLoss({ range: b, payments: pay, honors: hon })).toMatchObject({ omzet: 0, hpp: 120000, labaBersih: -120000 })
  })

  it("laporan tidak memuat laba per hari dan menyertakan pembanding", () => {
    const report = buildProfitLoss({
      range: { from: "2026-11-16", to: "2026-11-20" },
      payments: [{ status: "PAID", paidAt: new Date("2026-11-12T03:00:00Z"), netAmount: 100 }],
      honors: [honor("2026-11-17", 40)],
    })
    expect(report.comparison.range).toEqual({ from: "2026-11-11", to: "2026-11-15" })
    expect(report.comparison).toMatchObject({ omzet: 100, hpp: 0, labaBersih: 100 })
    expect(JSON.stringify(report)).not.toMatch(/daily|perHari|byDay/i)
  })
})
