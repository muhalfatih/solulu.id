import { describe, it, expect } from "vitest"
import {
  holdReasons,
  assignToOpenPeriod,
  planHonorRows,
  type HonorSessionFacts,
  type ExistingHonorRow,
} from "@/lib/finance"

const NOW = new Date("2026-11-20T03:00:00Z") // 20 Nov 2026 10:00 WIB

function session(overrides: Partial<HonorSessionFacts> = {}): HonorSessionFacts {
  return {
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
    hasReport: true,
    ...overrides,
  }
}

describe("Modul Keuangan: holdReasons", () => {
  it("laporan belum masuk menahan seluruh honor", () => {
    const hold = holdReasons({ hasReport: false, overtimeAmount: 0, extensionPaymentStatus: "NONE" })
    expect(hold).toEqual({ reasons: ["report_missing"], baseHeld: true, overtimeHeld: true })
  })

  it("tagihan perpanjangan belum lunas hanya menahan bagian overtime", () => {
    const hold = holdReasons({ hasReport: true, overtimeAmount: 35000, extensionPaymentStatus: "PENDING" })
    expect(hold).toEqual({ reasons: ["extension_unpaid"], baseHeld: false, overtimeHeld: true })
  })

  it("keduanya bisa berlaku bersamaan", () => {
    const hold = holdReasons({ hasReport: false, overtimeAmount: 35000, extensionPaymentStatus: "NONE" })
    expect(hold.reasons).toEqual(["report_missing", "extension_unpaid"])
  })

  it("perpanjangan lunas dan laporan masuk tidak menahan apa pun", () => {
    const hold = holdReasons({ hasReport: true, overtimeAmount: 35000, extensionPaymentStatus: "PAID" })
    expect(hold).toEqual({ reasons: [], baseHeld: false, overtimeHeld: false })
  })

  it("tanpa overtime tidak ada tagihan perpanjangan yang menahan", () => {
    const hold = holdReasons({ hasReport: true, overtimeAmount: 0, extensionPaymentStatus: "NONE" })
    expect(hold.overtimeHeld).toBe(false)
  })
})

describe("Modul Keuangan: assignToOpenPeriod", () => {
  it("periode sesi yang masih terbuka dipakai apa adanya", () => {
    expect(assignToOpenPeriod({ sessionDate: "2026-11-05", now: NOW, closedPeriodStarts: new Set() }).startDate).toBe(
      "2026-11-01"
    )
  })

  it("periode sesi sudah ditutup: honor pindah ke periode saat dilepas", () => {
    const period = assignToOpenPeriod({
      sessionDate: "2026-11-05",
      now: NOW,
      closedPeriodStarts: new Set(["2026-11-01"]),
    })
    expect(period.startDate).toBe("2026-11-16")
  })

  it("melompati beberapa periode tertutup berurutan", () => {
    const period = assignToOpenPeriod({
      sessionDate: "2026-11-05",
      now: NOW,
      closedPeriodStarts: new Set(["2026-11-01", "2026-11-16"]),
    })
    expect(period.startDate).toBe("2026-12-01")
  })
})

describe("Modul Keuangan: planHonorRows", () => {
  it("sesi selesai dengan laporan masuk langsung masuk periode sesinya", () => {
    const [row] = planHonorRows({ sessions: [session()], existing: [], closedPeriodStarts: new Set(), now: NOW })
    expect(row).toMatchObject({
      bookingId: "b1",
      baseAmount: 120000,
      overtimeAmount: 0,
      basePeriodStart: "2026-11-01",
    })
  })

  it("No-Show mendapat honor penuh", () => {
    const [row] = planHonorRows({
      sessions: [session({ status: "no_show" })],
      existing: [],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(row.baseAmount).toBe(120000)
    expect(row.basePeriodStart).toBe("2026-11-01")
  })

  it("Booking Manual Rp 0 tetap menghasilkan honor dari snapshot", () => {
    const [row] = planHonorRows({
      sessions: [session({ basePriceSnapshot: "85000.00", basePayoutPercent: 70 })],
      existing: [],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(row.baseAmount).toBe(59500)
  })

  it("booking yang belum selesai, dibatalkan, atau kedaluwarsa tidak menghasilkan honor", () => {
    const rows = planHonorRows({
      sessions: [
        session({ bookingId: "a", status: "confirmed" }),
        session({ bookingId: "b", status: "pending_payment" }),
        session({ bookingId: "c", status: "cancelled" }),
        session({ bookingId: "d", status: "expired" }),
      ],
      existing: [],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(rows).toEqual([])
  })

  it("laporan belum masuk: honor dihitung tetapi tertahan (belum masuk periode mana pun)", () => {
    const [row] = planHonorRows({
      sessions: [session({ hasReport: false })],
      existing: [],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(row.baseAmount).toBe(120000)
    expect(row.basePeriodStart).toBeNull()
    expect(row.overtimePeriodStart).toBeNull()
  })

  it("honor terlepas setelah laporan diserahkan", () => {
    const held = planHonorRows({
      sessions: [session({ hasReport: false })],
      existing: [],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    const existing: ExistingHonorRow[] = held
    const [released] = planHonorRows({
      sessions: [session({ hasReport: true })],
      existing,
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(released.basePeriodStart).toBe("2026-11-01")
  })

  it("perpanjangan belum lunas: pokok masuk periode, overtime tertahan lalu terlepas saat lunas", () => {
    const unpaid = session({ extensionFee: 60000, extensionPaymentStatus: "PENDING" })
    const [first] = planHonorRows({ sessions: [unpaid], existing: [], closedPeriodStarts: new Set(), now: NOW })
    expect(first.basePeriodStart).toBe("2026-11-01")
    expect(first.overtimeAmount).toBe(51000)
    expect(first.overtimePeriodStart).toBeNull()

    const [second] = planHonorRows({
      sessions: [{ ...unpaid, extensionPaymentStatus: "PAID" }],
      existing: [first],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(second.overtimePeriodStart).toBe("2026-11-01")
  })

  it("honor tertahan yang dilepas setelah periode sesinya ditutup pindah ke periode terbuka", () => {
    const [row] = planHonorRows({
      sessions: [session({ sessionDate: "2026-11-05" })],
      existing: [],
      closedPeriodStarts: new Set(["2026-11-01"]),
      now: NOW,
    })
    expect(row.basePeriodStart).toBe("2026-11-16")
  })

  it("periode yang sudah ditutup tidak pernah berubah: nilai dan persentase beku", () => {
    const frozen: ExistingHonorRow = {
      bookingId: "b1",
      baseAmount: 120000,
      overtimeAmount: 0,
      basePayoutPercent: 80,
      overtimePayoutPercent: 85,
      basePeriodStart: "2026-11-01",
      overtimePeriodStart: null,
    }
    // Superadmin menaikkan Bagi Hasil pokok menjadi 90% setelah periode ditutup.
    const [row] = planHonorRows({
      sessions: [session({ basePayoutPercent: 90 })],
      existing: [frozen],
      closedPeriodStarts: new Set(["2026-11-01"]),
      now: NOW,
    })
    expect(row).toMatchObject({ baseAmount: 120000, basePayoutPercent: 80, basePeriodStart: "2026-11-01" })
  })

  it("periode terbuka masih mengikuti persentase Bagi Hasil terbaru, tetapi tidak berpindah periode", () => {
    const open: ExistingHonorRow = {
      bookingId: "b1",
      baseAmount: 120000,
      overtimeAmount: 0,
      basePayoutPercent: 80,
      overtimePayoutPercent: 85,
      basePeriodStart: "2026-11-01",
      overtimePeriodStart: null,
    }
    const [row] = planHonorRows({
      sessions: [session({ basePayoutPercent: 90, sessionDate: "2026-11-05" })],
      existing: [open],
      closedPeriodStarts: new Set(),
      now: NOW,
    })
    expect(row).toMatchObject({ baseAmount: 135000, basePayoutPercent: 90, basePeriodStart: "2026-11-01" })
  })

  it("sesi tepat di batas 15/16 WIB masuk periode yang benar", () => {
    const rows = planHonorRows({
      sessions: [
        session({ bookingId: "x", sessionDate: "2026-11-15" }),
        session({ bookingId: "y", sessionDate: "2026-11-16" }),
        session({ bookingId: "z", sessionDate: "2026-02-28" }),
      ],
      existing: [],
      closedPeriodStarts: new Set(),
      now: new Date("2026-12-01T00:00:00Z"),
    })
    expect(rows.map((r) => r.basePeriodStart)).toEqual(["2026-11-01", "2026-11-16", "2026-02-16"])
  })
})
