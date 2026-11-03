import { describe, it, expect } from "vitest"
import {
  loadOperatorDashboard,
  type OperatorDashboardStore,
  type RawDispatchRow,
} from "@/lib/operator/dashboard"
import { summarizeCurrentHonor } from "@/lib/counselor/dashboard"
import { buildHonorSaya, type HonorLedgerEntry } from "@/lib/finance"
import { SHELL_NAV } from "@/lib/shell/nav"

// Baris "terlalu lebar" seperti yang bisa dikembalikan query mentah: berisi
// kolom keuangan yang tidak boleh sampai ke Operator.
const wideDispatch = {
  bookingId: "b1",
  bookingCode: "SL-1001",
  patientName: "Rani",
  counselorName: "Dr. Sarah",
  scheduleDate: "2026-11-03",
  timeRange: "08:00 - 09:30",
  kind: "dispatch_link_sesi",
  patientPhone: "0812",
  totalPrice: 150000,
  baseHonor: 90000,
  extensionFee: 50000,
  amount: 150000,
} as RawDispatchRow

const store: OperatorDashboardStore = {
  slotCounts: async () => [
    { slotIndex: 1, sessionCount: 2 },
    { slotIndex: 3, sessionCount: 6, revenue: 900000 } as { slotIndex: number; sessionCount: number },
  ],
  zoomAccounts: async () => [
    { accountNumber: 1, name: "Akun Zoom Pro 1", isActive: true, sessionsToday: 2, hostKey: "123456" } as never,
    { accountNumber: 2, name: "Akun Zoom Pro 2", isActive: false, sessionsToday: 0 },
  ],
  pendingDispatch: async () => ({ rows: [wideDispatch], total: 12 }),
}

const FINANCE_KEY =
  /price|harga|amount|fee|honor|revenue|omzet|laba|hpp|profit|transaction|payout|rupiah|nominal|hostkey|secret/i

function allKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, out))
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.push(k)
      allKeys(v, out)
    }
  }
  return out
}

describe("Ticket 34: Operator dashboard projection", () => {
  it("returns no finance (or credential) fields, even when the store returns wide rows", async () => {
    const data = await loadOperatorDashboard({ today: "2026-11-03", store })
    expect(allKeys(data).filter((k) => FINANCE_KEY.test(k))).toEqual([])
    expect(JSON.stringify(data)).not.toMatch(/150000|90000|900000|123456/)
  })

  it("counts today's sessions and picks Zoom / Breakout mode per slot", async () => {
    const data = await loadOperatorDashboard({ today: "2026-11-03", store })
    expect(data.slots).toHaveLength(7)
    expect(data.totalSessions).toBe(8)
    expect(data.slots[0]).toMatchObject({ slotIndex: 1, sessionCount: 2, mode: "standalone" })
    expect(data.slots.find((s) => s.slotIndex === 3)).toMatchObject({ sessionCount: 6, mode: "breakout_room" })
    expect(data.breakoutSlots).toBe(1)
  })

  it("always lists 4 Zoom accounts and marks unconfigured ones", async () => {
    const data = await loadOperatorDashboard({ today: "2026-11-03", store })
    expect(data.zoomAccounts.map((a) => a.state)).toEqual(["active", "inactive", "missing", "missing"])
  })

  it("exposes the pending WhatsApp queue total and a trimmed preview", async () => {
    const data = await loadOperatorDashboard({ today: "2026-11-03", store })
    expect(data.pendingDispatch.total).toBe(12)
    expect(data.pendingDispatch.rows[0]).not.toHaveProperty("patientPhone")
  })

  it("keeps the Operator nav free of finance pages", () => {
    const urls = SHELL_NAV.operator.flatMap((g) => g.items.filter((i) => !i.roles).map((i) => i.url))
    expect(urls).toContain("/operator")
    expect(urls.join(" ")).not.toMatch(/payroll|finance|reports|honor/)
  })
})

describe("Ticket 34: Counselor Honor Saya summary", () => {
  const entry = (over: Partial<HonorLedgerEntry>): HonorLedgerEntry =>
    ({
      bookingId: "x",
      bookingCode: "SL-1",
      serviceName: "Konseling",
      sessionDate: "2026-11-02",
      sessionStatus: "completed",
      hasReport: true,
      extensionFee: 0,
      extensionPaymentStatus: "none",
      baseAmount: 100000,
      overtimeAmount: 0,
      basePeriodStart: "2026-11-01",
      overtimePeriodStart: null,
      ...over,
    }) as HonorLedgerEntry

  it("summarises the running period and the held amount", () => {
    const view = buildHonorSaya([
      entry({ bookingId: "a" }),
      entry({ bookingId: "b", bookingCode: "SL-2", baseAmount: 50000 }),
      entry({ bookingId: "c", bookingCode: "SL-3", baseAmount: 70000, basePeriodStart: null, hasReport: false }),
    ])
    const s = summarizeCurrentHonor(view, new Date("2026-11-03T03:00:00Z"))
    expect(s.periodLabel).toContain("1-15")
    expect(s.total).toBe(150000)
    expect(s.sessionCount).toBe(2)
    expect(s.heldTotal).toBe(70000)
    expect(s.heldCount).toBe(1)
  })

  it("returns zeros for an empty ledger", () => {
    const s = summarizeCurrentHonor(buildHonorSaya([]), new Date("2026-11-03T03:00:00Z"))
    expect(s).toMatchObject({ total: 0, sessionCount: 0, heldTotal: 0, status: "open" })
  })
})
