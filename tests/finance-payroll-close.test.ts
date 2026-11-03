import { describe, it, expect } from "vitest"
import {
  buildPayrollOverview,
  buildPayrollPeriodDetail,
  closePayrollPeriod,
  payoutCsv,
  syncHonors,
  toCsv,
  toLedgerEntries,
  type HonorSessionFacts,
  type HonorStore,
  type PayrollCloseStore,
  type PlannedHonorRow,
} from "@/lib/finance"
import { auditLogs, type NewAuditLog } from "@/db/schema"
import type { AuditExecutor } from "@/lib/audit/record"

const admin = { id: "adm-1", app_metadata: { role: "admin" } }

function fact(o: Partial<HonorSessionFacts> = {}): HonorSessionFacts {
  return {
    bookingId: "b1",
    bookingCode: "SL-AAAAAA",
    counselorId: "c1",
    serviceId: "s1",
    serviceName: "Psikolog",
    status: "completed",
    sessionDate: "2026-11-05",
    basePriceSnapshot: 150000,
    basePayoutPercent: 80,
    overtimePayoutPercent: 85,
    extensionFee: 0,
    extensionPaymentStatus: "NONE",
    hasReport: true,
    ...o,
  }
}

function memoryStore(facts: HonorSessionFacts[], closed: Set<string> = new Set()) {
  const rows = new Map<string, PlannedHonorRow>()
  const state = { facts, closed }
  const store: HonorStore = {
    loadSessionFacts: async () => state.facts,
    loadExistingRows: async () => [...rows.values()],
    loadClosedPeriodStarts: async () => state.closed,
    saveRows: async (r) => {
      for (const row of r) rows.set(row.bookingId, row)
    },
  }
  return { store, rows, state }
}

describe("CSV RFC 4180 (toCsv)", () => {
  it("memakai CRLF, mengutip koma/kutip/baris baru, dan menggandakan kutip", () => {
    const csv = toCsv([
      ["Nama", "Catatan"],
      ["Budi, S.Psi", 'Dia bilang "halo"'],
      ["Multi", "baris1\nbaris2"],
    ])
    expect(csv).toBe(
      'Nama,Catatan\r\n"Budi, S.Psi","Dia bilang ""halo"""\r\nMulti,"baris1\nbaris2"\r\n'
    )
  })

  it("menetralkan sel string yang diawali karakter rumus spreadsheet", () => {
    expect(toCsv([["=SUM(A1)", "+1", "@x", "ok"]])).toBe("'=SUM(A1),'+1,'@x,ok\r\n")
  })
})

describe("Payroll: rincian per konselor dan CSV transfer massal", () => {
  const rows: PlannedHonorRow[] = [
    {
      bookingId: "b1", counselorId: "c1", serviceId: "s1", sessionDate: "2026-11-05",
      baseAmount: 120000, overtimeAmount: 0, basePayoutPercent: 80, overtimePayoutPercent: 85,
      basePeriodStart: "2026-11-01", overtimePeriodStart: null,
    },
    {
      bookingId: "b2", counselorId: "c1", serviceId: "s1", sessionDate: "2026-11-06",
      baseAmount: 120000, overtimeAmount: 51000, basePayoutPercent: 80, overtimePayoutPercent: 85,
      basePeriodStart: "2026-11-01", overtimePeriodStart: null, // overtime tertahan
    },
    {
      bookingId: "b3", counselorId: "c2", serviceId: "s1", sessionDate: "2026-11-07",
      baseAmount: 100000, overtimeAmount: 0, basePayoutPercent: 80, overtimePayoutPercent: 85,
      basePeriodStart: "2026-11-01", overtimePeriodStart: null,
    },
  ]
  const facts = [
    fact({ bookingId: "b1", counselorId: "c1" }),
    fact({ bookingId: "b2", counselorId: "c1", bookingCode: "SL-BBBBBB", extensionFee: 60000, extensionPaymentStatus: "PENDING" }),
    fact({ bookingId: "b3", counselorId: "c2", bookingCode: "SL-CCCCCC" }),
  ]
  const entries = toLedgerEntries(rows, facts)
  const counselors = new Map([
    ["c1", { name: 'Dr. Ani, M.Psi "Ani"', bankName: "BCA", accountNumber: "123", accountHolder: "Ani W" }],
    ["c2", { name: "Budi", bankName: null, accountNumber: null, accountHolder: null }],
  ])

  it("merinci total per konselor dan honor tertahan terpisah", () => {
    const detail = buildPayrollPeriodDetail(entries, "2026-11-01", counselors)
    expect(detail.counselors.map((c) => [c.counselorId, c.total, c.sessionCount])).toEqual([
      ["c2", 100000, 1],
      ["c1", 240000, 2],
    ])
    expect(detail.total).toBe(340000)
    expect(detail.held.map((h) => [h.counselorId, h.total])).toEqual([["c1", 51000]])
    expect(detail.counselors[0].bankComplete).toBe(false)
  })

  it("ringkasan periode menandai status tertutup dari penyimpanan", () => {
    const overview = buildPayrollOverview(entries, new Set(["2026-11-01"]))
    expect(overview.periods).toEqual([
      expect.objectContaining({ startDate: "2026-11-01", status: "closed", total: 340000, counselorCount: 2 }),
    ])
    expect(overview.heldTotal).toBe(51000)
  })

  it("CSV payout berisi nama, bank, rekening, atas nama, total honor, jumlah sesi dan lolos kutip", () => {
    const csv = payoutCsv(buildPayrollPeriodDetail(entries, "2026-11-01", counselors))
    expect(csv).toBe(
      "Nama,Bank,Nomor Rekening,Atas Nama,Total Honor,Jumlah Sesi\r\n" +
        "Budi,,,,100000,1\r\n" +
        '"Dr. Ani, M.Psi ""Ani""",BCA,123,Ani W,240000,2\r\n'
    )
  })
})

describe("Tutup Periode: pembekuan", () => {
  function closeStore() {
    const audit: NewAuditLog[] = []
    const closed = new Set<string>()
    const store: PayrollCloseStore = {
      closePeriod: async ({ startDate, audit: writeAudit }) => {
        if (closed.has(startDate)) return false
        const executor: AuditExecutor = {
          insert: (table) => {
            expect(table).toBe(auditLogs)
            return { values: async (row) => void audit.push(row) }
          },
        }
        await writeAudit(executor)
        closed.add(startDate)
        return true
      },
    }
    return { store, audit, closed }
  }

  it("menutup periode, mencatat Jejak Audit, dan periode tertutup tidak berubah oleh laporan/Bagi Hasil susulan", async () => {
    const now = new Date("2026-11-20T03:00:00Z")
    const mem = memoryStore([
      fact({ bookingId: "b1" }),
      fact({ bookingId: "b2", bookingCode: "SL-BBBBBB", hasReport: false }), // tertahan
    ])
    const { store: payroll, audit, closed } = closeStore()
    const res = await closePayrollPeriod({
      startDate: "2026-11-01", actor: admin, now, honorStore: mem.store, payrollStore: payroll,
    })
    expect(res).toEqual({ ok: true, total: 120000, counselorCount: 1 })
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ action: "payroll.close", entityType: "payroll_period", entityId: "2026-11-01", actorId: "adm-1" })
    expect(audit[0].after).toMatchObject({ total: 120000, counselorCount: 1 })

    // Setelah tutup: Superadmin ubah Bagi Hasil, laporan b2 masuk
    mem.state.closed = closed
    mem.state.facts = [
      fact({ bookingId: "b1", basePayoutPercent: 50 }),
      fact({ bookingId: "b2", bookingCode: "SL-BBBBBB", hasReport: true, basePayoutPercent: 50 }),
    ]
    const { rows } = await syncHonors({ now: new Date("2026-11-21T03:00:00Z"), store: mem.store })
    const b1 = rows.find((r) => r.bookingId === "b1")!
    expect(b1).toMatchObject({ baseAmount: 120000, basePayoutPercent: 80, basePeriodStart: "2026-11-01" })
    // Honor yang terlepas setelah tutup masuk periode terbuka berikutnya
    const b2 = rows.find((r) => r.bookingId === "b2")!
    expect(b2.basePeriodStart).toBe("2026-11-16")
    expect(b2.baseAmount).toBe(75000)
  })

  it("menolak menutup dua kali dan menolak non-admin", async () => {
    const mem = memoryStore([fact()])
    const { store: payroll } = closeStore()
    const base = { startDate: "2026-11-01", now: new Date("2026-11-20T03:00:00Z"), honorStore: mem.store, payrollStore: payroll }
    expect((await closePayrollPeriod({ ...base, actor: admin })).ok).toBe(true)
    expect(await closePayrollPeriod({ ...base, actor: admin })).toMatchObject({ ok: false })
    expect(await closePayrollPeriod({ ...base, actor: { id: "o", app_metadata: { role: "operator" } } })).toMatchObject({ ok: false })
  })

  it("menolak menutup periode yang belum berakhir", async () => {
    const mem = memoryStore([fact()])
    const { store: payroll } = closeStore()
    const res = await closePayrollPeriod({
      startDate: "2026-11-01", actor: admin, now: new Date("2026-11-10T03:00:00Z"),
      honorStore: mem.store, payrollStore: payroll,
    })
    expect(res).toMatchObject({ ok: false })
  })
})
