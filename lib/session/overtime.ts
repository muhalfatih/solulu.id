import { MAX_OVERTIME_BLOCKS, OVERTIME_BLOCK_MINUTES } from "@/lib/booking-cycle"
import { overtimeCharge } from "@/lib/services/pricing"

/**
 * Koreksi blok Perpanjangan Sesi oleh Konselor di Laporan Sesi (pure, tanpa I/O).
 * Tagihan klien dan honor overtime diturunkan dari jumlah blok x tarif overtime Layanan,
 * jadi mengubah blok mengubah keduanya.
 */

export interface OvertimeBookingFacts {
  isExtended: boolean
  extensionMinutes: number
  extensionFee: string | number
  extensionPaymentStatus: string
}

export interface OvertimeUpdate {
  isExtended: boolean
  extensionMinutes: number
  extensionFee: string
  extensionPaymentStatus: string
}

export type OvertimeCorrectionPlan =
  | { ok: true; update: OvertimeUpdate | null; blocks: number; fee: number }
  | { ok: false; error: string }

export function currentOvertimeBlocks(current: Pick<OvertimeBookingFacts, "isExtended" | "extensionMinutes">): number {
  if (!current.isExtended) return 0
  return Math.round((current.extensionMinutes || 0) / OVERTIME_BLOCK_MINUTES)
}

export function planOvertimeCorrection(input: {
  current: OvertimeBookingFacts
  blocks: number
  ratePer30Min: number | string
}): OvertimeCorrectionPlan {
  const { current, blocks, ratePer30Min } = input

  if (!Number.isInteger(blocks) || blocks < 0 || blocks > MAX_OVERTIME_BLOCKS) {
    return {
      ok: false,
      error: `Blok perpanjangan harus 0 sampai ${MAX_OVERTIME_BLOCKS} (batas sesi 120 menit).`,
    }
  }

  const fee = overtimeCharge(blocks, ratePer30Min)

  if (blocks === currentOvertimeBlocks(current)) {
    return { ok: true, update: null, blocks, fee }
  }

  if (current.extensionPaymentStatus === "PENDING" || current.extensionPaymentStatus === "PAID") {
    return {
      ok: false,
      error:
        "Tagihan perpanjangan sudah diproses klien (menunggu verifikasi atau lunas) sehingga blok tidak dapat diubah. Hubungi Admin.",
    }
  }

  return {
    ok: true,
    blocks,
    fee,
    update: {
      isExtended: blocks > 0,
      extensionMinutes: blocks * OVERTIME_BLOCK_MINUTES,
      extensionFee: String(fee),
      extensionPaymentStatus: "NONE",
    },
  }
}
