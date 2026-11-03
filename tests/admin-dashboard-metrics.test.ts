import { describe, expect, it } from "vitest"
import {
  buildDailySeries,
  buildDashboardData,
  buildHeatmap,
  buildOccupancy,
  buildPaymentMix,
  heatLevel,
  heatmapWindow,
  occupancyDeltaPoints,
  sessionsByService,
  type PaidPaymentFact,
  type SessionFact,
  type SlotCapacityRow,
} from "@/lib/admin-metrics/dashboard"
import { eachDay, parseRangeKey, rangeForKey } from "@/lib/admin-metrics/range"
import { buildProfitLoss, comparisonRange } from "@/lib/finance"

const NOW = new Date("2026-11-18T03:00:00Z") // 18 Nov 2026 10.00 WIB

describe("Dashboard Admin: filter rentang", () => {
  it("default dan nilai tidak dikenal jatuh ke Periode Payroll berjalan", () => {
    expect(parseRangeKey(undefined)).toBe("period")
    expect(parseRangeKey("bogus")).toBe("period")
    expect(rangeForKey("period", NOW)).toEqual({ from: "2026-11-16", to: "2026-11-30" })
  })

  it("prev-period, 7d, 30d, month", () => {
    expect(rangeForKey("prev-period", NOW)).toEqual({ from: "2026-11-01", to: "2026-11-15" })
    expect(rangeForKey("prev-period", new Date("2026-11-03T03:00:00Z"))).toEqual({ from: "2026-10-16", to: "2026-10-31" })
    expect(rangeForKey("7d", NOW)).toEqual({ from: "2026-11-12", to: "2026-11-18" })
    expect(rangeForKey("30d", NOW)).toEqual({ from: "2026-10-20", to: "2026-11-18" })
    expect(rangeForKey("month", NOW)).toEqual({ from: "2026-11-01", to: "2026-11-30" })
  })

  it("memakai tanggal WIB, bukan UTC", () => {
    // 15 Nov 2026 20.00 UTC = 16 Nov 03.00 WIB -> sudah periode kedua
    expect(rangeForKey("period", new Date("2026-11-15T20:00:00Z")).from).toBe("2026-11-16")
  })

  it("eachDay inklusif", () => {
    expect(eachDay({ from: "2026-11-29", to: "2026-12-01" })).toEqual(["2026-11-29", "2026-11-30", "2026-12-01"])
  })
})

describe("Dashboard Admin: seri harian Omzet vs HPP", () => {
  const range = { from: "2026-11-16", to: "2026-11-18" }
  const payments: PaidPaymentFact[] = [
    // 17 Nov 23.30 UTC = 18 Nov 06.30 WIB
    { status: "PAID", paidAt: new Date("2026-11-17T23:30:00Z"), netAmount: "100000", paymentProvider: "xendit" },
    { status: "PENDING", paidAt: null, netAmount: "999", paymentProvider: "xendit" },
  ]
  const honors = [{ sessionDate: "2026-11-16", baseAmount: 70000, overtimeAmount: 5000 }]

  it("mengisi hari tanpa data dengan nol dan tidak punya garis laba", () => {
    const series = buildDailySeries(range, payments, honors)
    expect(series).toEqual([
      { day: "2026-11-16", omzet: 0, hpp: 75000 },
      { day: "2026-11-17", omzet: 0, hpp: 0 },
      { day: "2026-11-18", omzet: 100000, hpp: 0 },
    ])
    expect(Object.keys(series[0])).not.toContain("laba")
  })
})

describe("Dashboard Admin: sesi per Layanan", () => {
  const range = { from: "2026-11-16", to: "2026-11-30" }
  const f = (status: string, serviceId: string, serviceName: string, sessionDate = "2026-11-17"): SessionFact => ({
    status,
    serviceId,
    serviceName,
    sessionDate,
  })

  it("menghitung Selesai dan No-Show per Layanan dan mengabaikan di luar rentang", () => {
    const rows = sessionsByService(
      [
        f("completed", "a", "Partner Cerita"),
        f("completed", "a", "Partner Cerita"),
        f("no_show", "a", "Partner Cerita"),
        f("completed", "b", "Psikolog Klinis"),
        f("completed", "b", "Psikolog Klinis", "2026-10-01"),
        f("confirmed", "b", "Psikolog Klinis"),
      ],
      range
    )
    expect(rows).toEqual([
      { serviceId: "a", layanan: "Partner Cerita", selesai: 2, noShow: 1 },
      { serviceId: "b", layanan: "Psikolog Klinis", selesai: 1, noShow: 0 },
    ])
  })

  it("kosong menghasilkan array kosong", () => {
    expect(sessionsByService([], range)).toEqual([])
  })
})

describe("Dashboard Admin: metode bayar", () => {
  it("mengelompokkan provider ke label dan hanya yang lunas di rentang", () => {
    const at = new Date("2026-11-17T05:00:00Z")
    const mix = buildPaymentMix(
      [
        { status: "PAID", paidAt: at, netAmount: "50000", paymentProvider: "xendit" },
        { status: "PAID", paidAt: at, netAmount: "50000", paymentProvider: "xendit" },
        { status: "PAID", paidAt: at, netAmount: "70000", paymentProvider: "manual" },
        { status: "PAID", paidAt: at, netAmount: "0", paymentProvider: "admin_bypass" },
        { status: "PAID", paidAt: new Date("2026-09-01T00:00:00Z"), netAmount: "1", paymentProvider: "xendit" },
        { status: "FAILED", paidAt: at, netAmount: "1", paymentProvider: "xendit" },
      ],
      { from: "2026-11-16", to: "2026-11-30" }
    )
    expect(mix).toEqual([
      { key: "xendit", label: "Xendit", count: 2, amount: 100000 },
      { key: "transfer", label: "Transfer Manual", count: 1, amount: 70000 },
      { key: "bypass", label: "Booking Rp 0", count: 1, amount: 0 },
    ])
  })
})

describe("Dashboard Admin: Keterisian Slot dan heatmap", () => {
  const rows: SlotCapacityRow[] = [
    { date: "2026-11-16", slotIndex: 1, opened: 4, booked: 2 },
    { date: "2026-11-17", slotIndex: 3, opened: 2, booked: 2 },
    { date: "2026-11-02", slotIndex: 1, opened: 10, booked: 1 },
  ]

  it("rate null bila tidak ada slot dibuka", () => {
    expect(buildOccupancy([], { from: "2026-11-16", to: "2026-11-30" })).toEqual({ opened: 0, booked: 0, rate: null })
  })

  it("rate = terisi / dibuka dalam rentang; delta dalam poin", () => {
    const cur = buildOccupancy(rows, { from: "2026-11-16", to: "2026-11-30" })
    expect(cur).toEqual({ opened: 6, booked: 4, rate: 4 / 6 })
    const prev = buildOccupancy(rows, { from: "2026-11-01", to: "2026-11-15" })
    expect(prev.rate).toBeCloseTo(0.1)
    expect(occupancyDeltaPoints(cur, prev)).toBe(56.7)
    expect(occupancyDeltaPoints(cur, { opened: 0, booked: 0, rate: null })).toBeNull()
  })

  it("heatLevel membedakan kosong, tidak dibuka, dan tangga 1..5", () => {
    expect(heatLevel(0, 0)).toBeNull()
    expect(heatLevel(0, 3)).toBe(0)
    expect(heatLevel(1, 10)).toBe(1)
    expect(heatLevel(10, 10)).toBe(5)
    expect(heatLevel(5, 10)).toBe(3)
  })

  it("jendela heatmap 7 hari, tidak melewati hari ini + 6", () => {
    expect(heatmapWindow({ from: "2026-11-16", to: "2026-11-30" }, "2026-11-18")).toEqual({
      from: "2026-11-18",
      to: "2026-11-24",
    })
    expect(heatmapWindow({ from: "2026-11-01", to: "2026-11-15" }, "2026-11-18")).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
    })
  })

  it("heatmap selalu 7 slot x 7 hari", () => {
    const map = buildHeatmap(rows, { from: "2026-11-16", to: "2026-11-22" })
    expect(map.rows).toHaveLength(7)
    expect(map.days).toHaveLength(7)
    expect(map.rows.every((r) => r.cells.length === 7)).toBe(true)
    expect(map.rows[0].cells[0]).toEqual({ day: "2026-11-16", opened: 4, booked: 2, level: 3 })
    expect(map.rows[2].cells[1]).toMatchObject({ opened: 2, booked: 2, level: 5 })
    expect(map.rows[6].cells[6].level).toBeNull()
  })
})

describe("Dashboard Admin: KPI vs rentang setara", () => {
  it("pembanding berjumlah hari sama dan dihitung dari fakta yang sama", () => {
    const range = { from: "2026-11-16", to: "2026-11-30" }
    const prev = comparisonRange(range)
    expect(eachDay(prev)).toHaveLength(eachDay(range).length)

    const payments: PaidPaymentFact[] = [
      { status: "PAID", paidAt: new Date("2026-11-17T05:00:00Z"), netAmount: "200000", paymentProvider: "xendit" },
      { status: "PAID", paidAt: new Date("2026-11-05T05:00:00Z"), netAmount: "100000", paymentProvider: "xendit" },
    ]
    const honors = [
      { sessionDate: "2026-11-17", baseAmount: 70000, overtimeAmount: 0 },
      { sessionDate: "2026-11-05", baseAmount: 70000, overtimeAmount: 0 },
    ]
    const facts: SessionFact[] = [
      { status: "completed", serviceId: "a", serviceName: "A", sessionDate: "2026-11-17" },
      { status: "no_show", serviceId: "a", serviceName: "A", sessionDate: "2026-11-17" },
      { status: "completed", serviceId: "a", serviceName: "A", sessionDate: "2026-11-05" },
    ]
    const report = buildProfitLoss({ range, payments, honors })
    const data = buildDashboardData({ report, honors, facts, payments, capacity: [], today: "2026-11-18" })

    expect(data.comparisonRange).toEqual(prev)
    expect(data.kpis.omzet).toEqual({ value: 200000, previous: 100000, deltaPercent: 100 })
    expect(data.kpis.labaBersih.value).toBe(130000)
    expect(data.kpis.sesiSelesai).toMatchObject({ value: 1, previous: 1, noShow: 1 })
    expect(data.kpis.keterisian.value).toBeNull()
    expect(data.daily).toHaveLength(15)
  })

  it("tanpa data sama sekali tidak ada nilai karangan", () => {
    const range = { from: "2026-11-16", to: "2026-11-30" }
    const report = buildProfitLoss({ range, payments: [], honors: [] })
    const data = buildDashboardData({ report, honors: [], facts: [], payments: [], capacity: [], today: "2026-11-18" })
    expect(data.sessionsByService).toEqual([])
    expect(data.paymentMix).toEqual([])
    expect(data.kpis.omzet.deltaPercent).toBeNull()
    expect(data.daily.every((d) => d.omzet === 0 && d.hpp === 0)).toBe(true)
  })
})
