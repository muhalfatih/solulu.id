import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it, expect, vi } from "vitest"
import { submitSessionReportAction, recordSessionExtensionAction } from "@/app/counselor/actions"
import type { CounselorAuthContext } from "@/lib/counselor/types"
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

describe("Timer Melayang: aksesibilitas chime", () => {
  const source = readFileSync(join(process.cwd(), "components/counselor/FloatingTimer.tsx"), "utf8")

  it("chime dapat dibisukan lewat tombol toggle yang terbaca screen reader", () => {
    expect(source).toContain('id="btn-timer-chime-mute"')
    expect(source).toContain("aria-pressed={chimeMuted}")
  })

  it("jam yang berdetak tidak berada di region live; hanya pengumuman menit 80 yang diumumkan", () => {
    expect(source).not.toMatch(/<aside[^>]*aria-live/)
    expect(source).toContain('role="status"')
  })
})

describe("recordSessionExtensionAction: idempoten", () => {
  it("tidak menimpa blok yang sudah tercatat (mis. hasil koreksi atau pencatatan ganda)", async () => {
    const update = vi.fn()
    const dbClient: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  booking: {
                    id: BOOKING_ID,
                    isExtended: true,
                    extensionMinutes: 30,
                    extensionFee: "35000.00",
                    extensionPaymentStatus: "PAID",
                  },
                  service: { overtimeRatePer30Min: "60000.00" },
                },
              ]),
            }),
          }),
        }),
      }),
      update,
    }
    const res = await recordSessionExtensionAction(BOOKING_ID, {
      currentUser: { id: "u", counselorId: "c-1", app_metadata: { role: "counselor" }, user_metadata: { role: "counselor" } },
      dbClient,
    })
    expect(res.success).toBe(true)
    expect(res.data?.fee).toBe(35000)
    expect(update).not.toHaveBeenCalled()
  })
})

describe("submitSessionReportAction: koreksi overtime", () => {
  const counselorAuth: CounselorAuthContext = {
    id: "counselor-user-1",
    counselorId: "c-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }
  const input = {
    bookingId: BOOKING_ID,
    mainIssue: "Stres akademik",
    summary: "Ringkasan dinamika sesi yang cukup panjang.",
  }
  const deps = (applyOvertimeCorrection: (...a: any[]) => Promise<any>) => ({
    currentUser: counselorAuth,
    getBooking: async () => ({ id: BOOKING_ID, counselorId: "c-1", status: "confirmed" }),
    saveReport: vi.fn().mockResolvedValue({ id: "rep-1" }),
    applyOvertimeCorrection,
  })

  it("meneruskan koreksi blok ke penyimpanan sebelum laporan disimpan", async () => {
    const apply = vi.fn().mockResolvedValue({ ok: true, update: {}, blocks: 0, fee: 0 })
    const d = deps(apply)
    const res = await submitSessionReportAction({ ...input, overtimeBlocks: 0 }, d)
    expect(res.success).toBe(true)
    expect(apply).toHaveBeenCalledWith(BOOKING_ID, "c-1", 0)
    expect(d.saveReport).toHaveBeenCalled()
  })

  it("tidak menyentuh overtime bila blok tidak dikirim", async () => {
    const apply = vi.fn()
    const res = await submitSessionReportAction(input, deps(apply))
    expect(res.success).toBe(true)
    expect(apply).not.toHaveBeenCalled()
  })

  it("menggagalkan simpan laporan bila koreksi ditolak", async () => {
    const apply = vi.fn().mockResolvedValue({ ok: false, error: "Tagihan sudah lunas." })
    const d = deps(apply)
    const res = await submitSessionReportAction({ ...input, overtimeBlocks: 0 }, d)
    expect(res.success).toBe(false)
    expect(res.error).toContain("Tagihan sudah lunas")
    expect(d.saveReport).not.toHaveBeenCalled()
  })
})
