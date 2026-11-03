import { describe, it, expect } from "vitest"
import { honorForSession, payrollPeriodFor } from "@/lib/finance"

describe("Modul Keuangan: honorForSession", () => {
  it("Layanan Sebaya 70%/80%: pokok Rp 85.000 + overtime Rp 35.000", () => {
    const honor = honorForSession({
      basePriceSnapshot: 85000,
      basePayoutPercent: 70,
      overtimeAmount: 35000,
      overtimePayoutPercent: 80,
    })
    expect(honor).toEqual({ baseHonor: 59500, overtimeHonor: 28000, totalHonor: 87500 })
  })

  it("Layanan Psikolog 80%/85% menghasilkan angka berbeda dari Sebaya", () => {
    const honor = honorForSession({
      basePriceSnapshot: "150000.00",
      basePayoutPercent: 80,
      overtimeAmount: "60000.00",
      overtimePayoutPercent: 85,
    })
    expect(honor).toEqual({ baseHonor: 120000, overtimeHonor: 51000, totalHonor: 171000 })
  })

  it("honor dihitung dari snapshot tarif pokok sebelum voucher, bukan dari yang dibayar klien", () => {
    // Klien memakai voucher 100% (bayar Rp 0), tetapi snapshot sebelum voucher Rp 150.000.
    const honor = honorForSession({
      basePriceSnapshot: 150000,
      basePayoutPercent: 80,
      overtimeAmount: 0,
      overtimePayoutPercent: 85,
    })
    expect(honor.baseHonor).toBe(120000)
    expect(honor.overtimeHonor).toBe(0)
  })

  it("Booking Manual Rp 0 tetap menghasilkan honor dari tarif aktif Layanan", () => {
    const honor = honorForSession({
      basePriceSnapshot: 85000,
      basePayoutPercent: 70,
      overtimeAmount: 0,
      overtimePayoutPercent: 80,
    })
    expect(honor.totalHonor).toBe(59500)
  })

  it("membulatkan ke rupiah penuh", () => {
    const honor = honorForSession({
      basePriceSnapshot: 49999,
      basePayoutPercent: 70,
      overtimeAmount: 0,
      overtimePayoutPercent: 80,
    })
    expect(honor.baseHonor).toBe(34999)
  })

  it("Bagi Hasil di luar 0-100 ditolak", () => {
    expect(() =>
      honorForSession({
        basePriceSnapshot: 1000,
        basePayoutPercent: 120,
        overtimeAmount: 0,
        overtimePayoutPercent: 80,
      })
    ).toThrow()
  })
})

describe("Modul Keuangan: payrollPeriodFor (WIB)", () => {
  it("tgl 1 dan 15 masuk periode 1-15", () => {
    expect(payrollPeriodFor("2026-11-01")).toMatchObject({ startDate: "2026-11-01", endDate: "2026-11-15" })
    expect(payrollPeriodFor("2026-11-15")).toMatchObject({ startDate: "2026-11-01", endDate: "2026-11-15" })
  })

  it("tgl 16 membuka periode kedua", () => {
    expect(payrollPeriodFor("2026-11-16")).toMatchObject({ startDate: "2026-11-16", endDate: "2026-11-30" })
  })

  it.each([
    ["2026-01-31", "2026-01-31"],
    ["2026-02-28", "2026-02-28"], // 2026 bukan kabisat
    ["2028-02-29", "2028-02-29"], // kabisat
    ["2026-04-30", "2026-04-30"],
    ["2026-12-31", "2026-12-31"],
  ])("sesi %s berada di periode yang berakhir %s", (date, end) => {
    expect(payrollPeriodFor(date).endDate).toBe(end)
    expect(payrollPeriodFor(date).startDate).toBe(date.slice(0, 8) + "16")
  })

  it("instan UTC dikonversi ke tanggal WIB: 15 Nov 17:30Z = 16 Nov 00:30 WIB", () => {
    expect(payrollPeriodFor(new Date("2026-11-15T17:30:00Z")).startDate).toBe("2026-11-16")
    expect(payrollPeriodFor(new Date("2026-11-15T16:59:59Z")).startDate).toBe("2026-11-01")
  })

  it("31 Jan 17:00Z = 1 Feb WIB berpindah ke bulan berikutnya", () => {
    expect(payrollPeriodFor(new Date("2026-01-31T17:00:00Z"))).toMatchObject({
      startDate: "2026-02-01",
      endDate: "2026-02-15",
    })
  })

  it("label manusiawi berbahasa Indonesia", () => {
    expect(payrollPeriodFor("2026-02-20").label).toBe("16-28 Februari 2026")
    expect(payrollPeriodFor("2026-11-03").label).toBe("1-15 November 2026")
  })

  it("tanggal tidak valid ditolak", () => {
    expect(() => payrollPeriodFor("2026-13-40")).toThrow()
    expect(() => payrollPeriodFor("bukan tanggal")).toThrow()
  })
})
