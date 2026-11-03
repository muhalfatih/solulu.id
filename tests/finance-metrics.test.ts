import { describe, it, expect } from "vitest"
import { defaultRange, loadProfitLoss, resolveRange } from "@/lib/admin-metrics"
import type { HonorStore } from "@/lib/finance"

describe("admin-metrics: sumber angka tunggal", () => {
  it("rentang default = Periode Payroll berjalan, parameter buruk jatuh ke default", () => {
    const now = new Date("2026-11-20T03:00:00Z")
    expect(defaultRange(now)).toEqual({ from: "2026-11-16", to: "2026-11-30" })
    expect(resolveRange({ from: "x", to: "2026-11-01" }, now)).toEqual({ from: "2026-11-16", to: "2026-11-30" })
    expect(resolveRange({ from: "2026-11-10", to: "2026-11-01" }, now)).toEqual({ from: "2026-11-16", to: "2026-11-30" })
    expect(resolveRange({ from: "2026-11-01", to: "2026-11-05" }, now)).toEqual({ from: "2026-11-01", to: "2026-11-05" })
  })

  it("loadProfitLoss menyerahkan hitungan ke Modul Keuangan dengan data store", async () => {
    const honorStore: HonorStore = {
      loadSessionFacts: async () => [
        {
          bookingId: "b1", bookingCode: "SL-AAAAAA", counselorId: "c1", serviceId: "s1", serviceName: "P",
          status: "completed", sessionDate: "2026-11-17", basePriceSnapshot: 150000, basePayoutPercent: 80,
          overtimePayoutPercent: 85, extensionFee: 0, extensionPaymentStatus: "NONE", hasReport: true,
        },
      ],
      loadExistingRows: async () => [],
      loadClosedPeriodStarts: async () => new Set(),
      saveRows: async () => {},
    }
    const report = await loadProfitLoss({
      range: { from: "2026-11-16", to: "2026-11-20" },
      now: new Date("2026-11-20T03:00:00Z"),
      honorStore,
      metricsStore: {
        loadPaidPayments: async () => [{ status: "PAID", paidAt: new Date("2026-11-18T03:00:00Z"), netAmount: "150000" }],
      },
    })
    expect(report).toMatchObject({ omzet: 150000, hpp: 120000, labaBersih: 30000 })
  })
})
