import { buildHonorSaya, toLedgerEntries, type HonorSayaView, type PeriodStatus } from "./ledger"
import { planHonorRows, type HonorSessionFacts, type PlannedHonorRow } from "./plan"

/**
 * Orkestrasi baca -> rencanakan -> tulis untuk honor per sesi.
 * Seluruh I/O lewat `HonorStore` (implementasi Drizzle ada di `honor-store.ts`),
 * sehingga modul ini tetap bebas `@/db` dan dapat diuji dengan store in-memory.
 */
export interface HonorStore {
  loadSessionFacts(counselorId?: string): Promise<HonorSessionFacts[]>
  loadExistingRows(counselorId?: string): Promise<PlannedHonorRow[]>
  loadClosedPeriodStarts(): Promise<Set<string>>
  /** Upsert menurut bookingId; juga memastikan Periode Payroll yang dirujuk sudah ada. */
  saveRows(rows: PlannedHonorRow[]): Promise<void>
}

function sameRow(a: PlannedHonorRow, b: PlannedHonorRow): boolean {
  return (
    a.serviceId === b.serviceId &&
    a.sessionDate === b.sessionDate &&
    a.baseAmount === b.baseAmount &&
    a.overtimeAmount === b.overtimeAmount &&
    a.basePayoutPercent === b.basePayoutPercent &&
    a.overtimePayoutPercent === b.overtimePayoutPercent &&
    a.basePeriodStart === b.basePeriodStart &&
    a.overtimePeriodStart === b.overtimePeriodStart
  )
}

export interface SyncResult {
  rows: PlannedHonorRow[]
  facts: HonorSessionFacts[]
  closedPeriodStarts: Set<string>
}

/**
 * Menghitung ulang honor sesi (selesai / No-Show), menempatkan honor yang
 * syaratnya sudah terpenuhi ke periode terbuka, dan menyimpan perubahannya.
 * Tanpa `counselorId`, seluruh konselor diproses (dipakai laporan admin).
 */
export async function syncHonors(input: {
  counselorId?: string
  now: Date
  store: HonorStore
}): Promise<SyncResult> {
  const { store, counselorId, now } = input
  const [facts, existing, closedPeriodStarts] = await Promise.all([
    store.loadSessionFacts(counselorId),
    store.loadExistingRows(counselorId),
    store.loadClosedPeriodStarts(),
  ])

  const rows = planHonorRows({ sessions: facts, existing, closedPeriodStarts, now })
  const existingByBooking = new Map(existing.map((row) => [row.bookingId, row]))
  const changed = rows.filter((row) => {
    const prior = existingByBooking.get(row.bookingId)
    return !prior || !sameRow(prior, row)
  })
  if (changed.length > 0) await store.saveRows(changed)

  return { rows, facts, closedPeriodStarts }
}

/** Honor Saya: sinkronkan, lalu bentuk tampilan per periode + honor tertahan. */
export async function loadHonorSaya(input: {
  counselorId: string
  now: Date
  store: HonorStore
}): Promise<HonorSayaView> {
  const { rows, facts, closedPeriodStarts } = await syncHonors(input)
  const statuses = new Map<string, PeriodStatus>([...closedPeriodStarts].map((start) => [start, "closed"]))
  return buildHonorSaya(toLedgerEntries(rows, facts), statuses)
}
