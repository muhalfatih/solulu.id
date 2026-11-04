import { describe, it, expect, vi } from "vitest"
import {
  getHonorSayaAction,
  getBankAccountAction,
  updateBankAccountAction,
} from "@/app/counselor/honor/actions"
import type { HonorStore, HonorSessionFacts, PlannedHonorRow } from "@/lib/finance"

const COUNSELOR_A = { id: "u-a", counselorId: "c-a", app_metadata: { role: "counselor" } }
const NOW = new Date("2026-11-20T03:00:00Z")

function facts(overrides: Partial<HonorSessionFacts>): HonorSessionFacts {
  return {
    bookingId: "b1",
    bookingCode: "SL-AAAAAA",
    counselorId: "c-a",
    serviceId: "s1",
    serviceName: "Psikolog Klinis",
    status: "completed",
    sessionDate: "2026-11-05",
    basePriceSnapshot: 150000,
    basePayoutPercent: 80,
    overtimePayoutPercent: 85,
    extensionFee: 0,
    extensionPaymentStatus: "NONE",
    hasReport: true,
    ...overrides,
  }
}

function memoryStore(all: HonorSessionFacts[]): HonorStore {
  const saved = new Map<string, PlannedHonorRow>()
  return {
    loadSessionFacts: async (counselorId) => all.filter((f) => !counselorId || f.counselorId === counselorId),
    loadExistingRows: async (counselorId) =>
      [...saved.values()].filter((r) => !counselorId || r.counselorId === counselorId),
    loadClosedPeriodStarts: async () => new Set<string>(),
    saveRows: async (rows) => {
      for (const r of rows) saved.set(r.bookingId, r)
    },
  }
}

describe("getHonorSayaAction", () => {
  it("menolak pengguna yang bukan konselor", async () => {
    const res = await getHonorSayaAction({ currentUser: null, store: memoryStore([]), now: NOW })
    expect(res.success).toBe(false)

    const guest = await getHonorSayaAction({
      currentUser: { id: "u-x", app_metadata: { role: "operator" } },
      store: memoryStore([]),
      now: NOW,
    })
    expect(guest.success).toBe(false)
  })

  it("konselor hanya melihat honornya sendiri", async () => {
    const store = memoryStore([
      facts({ bookingId: "b1", counselorId: "c-a", bookingCode: "SL-AAAAAA" }),
      facts({ bookingId: "b2", counselorId: "c-b", bookingCode: "SL-BBBBBB", basePriceSnapshot: 999000 }),
    ])
    const res = await getHonorSayaAction({ currentUser: COUNSELOR_A, store, now: NOW })
    expect(res.success).toBe(true)
    const lines = res.data!.periods.flatMap((p) => p.lines).concat(res.data!.held.lines)
    expect(lines.map((l) => l.bookingCode)).toEqual(["SL-AAAAAA"])
    expect(res.data!.periods[0].total).toBe(120000)
  })

  it("honor tertahan tampil bersama alasannya", async () => {
    const store = memoryStore([facts({ hasReport: false })])
    const res = await getHonorSayaAction({ currentUser: COUNSELOR_A, store, now: NOW })
    expect(res.data!.periods).toEqual([])
    expect(res.data!.held.lines[0].reasons).toEqual(["report_missing"])
  })
})

describe("rekening bank konselor", () => {
  it("menyimpan rekening yang valid untuk konselor yang sedang login", async () => {
    const updateBankAccount = vi.fn().mockResolvedValue(undefined)
    const res = await updateBankAccountAction(
      { bankName: "BCA", accountNumber: "123-456-7890", accountHolder: "Dewi Lestari" },
      { currentUser: COUNSELOR_A, updateBankAccount }
    )
    expect(res.success).toBe(true)
    expect(updateBankAccount).toHaveBeenCalledWith("c-a", {
      bankName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "Dewi Lestari",
    })
  })

  it("menolak rekening tidak valid dengan galat per kolom dan tidak menyimpan", async () => {
    const updateBankAccount = vi.fn()
    const res = await updateBankAccountAction(
      { bankName: "", accountNumber: "abc", accountHolder: "" },
      { currentUser: COUNSELOR_A, updateBankAccount }
    )
    expect(res.success).toBe(false)
    expect(Object.keys(res.fieldErrors ?? {}).sort()).toEqual(["accountHolder", "accountNumber", "bankName"])
    expect(updateBankAccount).not.toHaveBeenCalled()
  })

  it("menolak non-konselor", async () => {
    const updateBankAccount = vi.fn()
    const res = await updateBankAccountAction(
      { bankName: "BCA", accountNumber: "1234567890", accountHolder: "Dewi" },
      { currentUser: null, updateBankAccount }
    )
    expect(res.success).toBe(false)
    expect(updateBankAccount).not.toHaveBeenCalled()
  })

  it("membaca rekening milik sendiri", async () => {
    const getBankAccount = vi.fn().mockResolvedValue({
      bankName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "Dewi Lestari",
    })
    const res = await getBankAccountAction({ currentUser: COUNSELOR_A, getBankAccount })
    expect(getBankAccount).toHaveBeenCalledWith("c-a")
    expect(res.data?.bankName).toBe("BCA")
  })
})
