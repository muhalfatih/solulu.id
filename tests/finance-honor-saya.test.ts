import { describe, it, expect } from "vitest"
import { buildHonorSaya, syncHonors, type HonorLedgerEntry, type HonorStore, type HonorSessionFacts, type PlannedHonorRow } from "@/lib/finance"
import { bankAccountSchema } from "@/lib/validations/bank-account"

function entry(overrides: Partial<HonorLedgerEntry> = {}): HonorLedgerEntry {
  return {
    bookingId: "b1",
    counselorId: "c1",
    serviceId: "s1",
    sessionDate: "2026-11-05",
    baseAmount: 120000,
    overtimeAmount: 0,
    basePayoutPercent: 80,
    overtimePayoutPercent: 85,
    basePeriodStart: "2026-11-01",
    overtimePeriodStart: null,
    bookingCode: "SL-AAAAAA",
    serviceName: "Psikolog Klinis",
    sessionStatus: "completed",
    hasReport: true,
    extensionFee: 0,
    extensionPaymentStatus: "NONE",
    ...overrides,
  }
}

describe("Honor Saya: buildHonorSaya", () => {
  it("mengelompokkan honor per periode dan menjumlahkannya", () => {
    const view = buildHonorSaya([
      entry({ bookingId: "a", baseAmount: 120000 }),
      entry({ bookingId: "b", baseAmount: 59500, bookingCode: "SL-BBBBBB" }),
      entry({ bookingId: "c", sessionDate: "2026-11-17", basePeriodStart: "2026-11-16", baseAmount: 100000 }),
    ])
    expect(view.periods.map((p) => [p.startDate, p.total, p.sessionCount])).toEqual([
      ["2026-11-16", 100000, 1],
      ["2026-11-01", 179500, 2],
    ])
    expect(view.periods[1].label).toBe("1-15 November 2026")
    expect(view.held.total).toBe(0)
  })

  it("honor No-Show muncul penuh dan ditandai statusnya", () => {
    const view = buildHonorSaya([entry({ sessionStatus: "no_show" })])
    expect(view.periods[0].lines[0]).toMatchObject({ part: "base", amount: 120000, sessionStatus: "no_show" })
  })

  it("honor tertahan karena laporan belum masuk muncul di bagian tertahan beserta alasannya", () => {
    const view = buildHonorSaya([
      entry({ hasReport: false, basePeriodStart: null, overtimeAmount: 0 }),
    ])
    expect(view.periods).toEqual([])
    expect(view.held.total).toBe(120000)
    expect(view.held.lines[0].reasons).toEqual(["report_missing"])
  })

  it("pokok masuk periode sedangkan overtime tertahan karena perpanjangan belum lunas", () => {
    const view = buildHonorSaya([
      entry({
        overtimeAmount: 51000,
        extensionFee: 60000,
        extensionPaymentStatus: "PENDING",
        overtimePeriodStart: null,
      }),
    ])
    expect(view.periods[0].baseTotal).toBe(120000)
    expect(view.periods[0].overtimeTotal).toBe(0)
    expect(view.held.lines).toHaveLength(1)
    expect(view.held.lines[0]).toMatchObject({ part: "overtime", amount: 51000, reasons: ["extension_unpaid"] })
  })

  it("periode tertutup ditandai tertutup", () => {
    const view = buildHonorSaya([entry()], new Map([["2026-11-01", "closed" as const]]))
    expect(view.periods[0].status).toBe("closed")
  })
})

describe("Honor Saya: syncHonors dengan store", () => {
  function inMemoryStore(initialSessions: HonorSessionFacts[]) {
    const sessions = [...initialSessions]
    const saved = new Map<string, PlannedHonorRow>()
    const store: HonorStore = {
      loadSessionFacts: async (counselorId) => sessions.filter((s) => s.counselorId === counselorId),
      loadExistingRows: async (counselorId) => [...saved.values()].filter((r) => r.counselorId === counselorId),
      loadClosedPeriodStarts: async () => new Set<string>(),
      saveRows: async (rows) => {
        for (const row of rows) saved.set(row.bookingId, row)
      },
    }
    return { store, sessions, saved }
  }

  const base: HonorSessionFacts = {
    bookingId: "b1",
    bookingCode: "SL-AAAAAA",
    counselorId: "c1",
    serviceId: "s1",
    serviceName: "Psikolog Klinis",
    status: "completed",
    sessionDate: "2026-11-05",
    basePriceSnapshot: 150000,
    basePayoutPercent: 80,
    overtimePayoutPercent: 85,
    extensionFee: 0,
    extensionPaymentStatus: "NONE",
    hasReport: false,
  }

  it("menulis baris tertahan, lalu melepasnya setelah laporan diserahkan", async () => {
    const { store, sessions, saved } = inMemoryStore([base])
    const now = new Date("2026-11-20T03:00:00Z")

    await syncHonors({ counselorId: "c1", now, store })
    expect(saved.get("b1")?.basePeriodStart).toBeNull()

    sessions[0] = { ...base, hasReport: true }
    await syncHonors({ counselorId: "c1", now, store })
    expect(saved.get("b1")?.basePeriodStart).toBe("2026-11-01")
  })

  it("hanya memproses sesi milik konselor yang diminta", async () => {
    const { store, saved } = inMemoryStore([base, { ...base, bookingId: "b2", counselorId: "c2" }])
    await syncHonors({ counselorId: "c1", now: new Date("2026-11-20T03:00:00Z"), store })
    expect([...saved.keys()]).toEqual(["b1"])
  })
})

describe("Rekening bank konselor: bankAccountSchema", () => {
  it("menerima rekening valid dan menormalkan nomor (spasi/strip dibuang)", () => {
    const parsed = bankAccountSchema.safeParse({
      bankName: "  BCA ",
      accountNumber: "1234-567 890",
      accountHolder: "Dewi Lestari, S.Psi",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "Dewi Lestari, S.Psi",
      })
    }
  })

  it("menolak nomor rekening non-angka atau terlalu pendek/panjang", () => {
    const make = (accountNumber: string) =>
      bankAccountSchema.safeParse({ bankName: "BCA", accountNumber, accountHolder: "Dewi Lestari" })
    expect(make("ABC12345").success).toBe(false)
    expect(make("123").success).toBe(false)
    expect(make("1".repeat(25)).success).toBe(false)
  })

  it("menolak bank atau nama pemilik kosong", () => {
    expect(
      bankAccountSchema.safeParse({ bankName: "", accountNumber: "1234567890", accountHolder: "Dewi" }).success
    ).toBe(false)
    expect(
      bankAccountSchema.safeParse({ bankName: "BCA", accountNumber: "1234567890", accountHolder: " " }).success
    ).toBe(false)
  })
})
