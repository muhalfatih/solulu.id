import type { WaTemplateKey } from "./templates"

export interface DispatchCandidate {
  status: string
  /** Tanggal sesi YYYY-MM-DD (WIB). */
  scheduleDate: string | null
  hasReport: boolean
}

/**
 * Template mana yang kini menunggu dikirim untuk sebuah Booking, atau null bila tidak ada.
 * Cerminan pure dari ekspresi SQL di queue.ts; sengaja satu kind per Booking pada satu waktu.
 * `today` adalah tanggal WIB hari ini (YYYY-MM-DD).
 */
export function resolveDispatchKind(c: DispatchCandidate, today: string): WaTemplateKey | null {
  if (c.status === "confirmed" && c.scheduleDate !== null && c.scheduleDate >= today) {
    return "dispatch_link_sesi"
  }
  if (c.status === "completed" && c.hasReport) return "laporan_siap"
  return null
}
