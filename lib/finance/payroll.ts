import { recordAudit, type AuditExecutor } from "@/lib/audit/record"
import { ADMIN_ROLES, hasStaffRole, type RoleCarrier } from "@/lib/auth/staff-role"
import { toCsv } from "./csv"
import type { HonorStore } from "./honor-sync"
import { syncHonors } from "./honor-sync"
import { buildHonorSaya, toLedgerEntries, type HonorLedgerEntry, type HonorLine, type PeriodStatus } from "./ledger"
import { payrollPeriodFor, wibDateOf } from "./period"

/**
 * Halaman Payroll admin (ADR-0007): ringkasan periode, rincian per konselor
 * (termasuk honor tertahan), ekspor CSV, dan Tutup Periode. View-builder murni;
 * I/O lewat `HonorStore` dan `PayrollCloseStore`.
 */

export interface PayrollCounselorInfo {
  name: string
  bankName: string | null
  accountNumber: string | null
  accountHolder: string | null
}

export interface PayrollPeriodSummary {
  startDate: string
  endDate: string
  label: string
  status: PeriodStatus
  total: number
  counselorCount: number
  sessionCount: number
}

export interface PayrollOverview {
  /** Terbaru dulu. */
  periods: PayrollPeriodSummary[]
  heldTotal: number
  heldCounselorCount: number
}

export interface PayrollCounselorRow extends PayrollCounselorInfo {
  counselorId: string
  baseTotal: number
  overtimeTotal: number
  total: number
  sessionCount: number
  bankComplete: boolean
  lines: HonorLine[]
}

export interface PayrollHeldRow {
  counselorId: string
  name: string
  total: number
  lines: HonorLine[]
}

export interface PayrollPeriodDetail {
  startDate: string
  endDate: string
  label: string
  status: PeriodStatus
  total: number
  counselors: PayrollCounselorRow[]
  /** Honor yang masih tertahan (semua konselor), bukan bagian dari total periode. */
  held: PayrollHeldRow[]
}

const UNKNOWN_COUNSELOR: PayrollCounselorInfo = {
  name: "Konselor tidak dikenal",
  bankName: null,
  accountNumber: null,
  accountHolder: null,
}

function groupByCounselor(entries: readonly HonorLedgerEntry[]): Map<string, HonorLedgerEntry[]> {
  const map = new Map<string, HonorLedgerEntry[]>()
  for (const e of entries) {
    const list = map.get(e.counselorId)
    if (list) list.push(e)
    else map.set(e.counselorId, [e])
  }
  return map
}

function statusMap(closed: ReadonlySet<string>): Map<string, PeriodStatus> {
  return new Map([...closed].map((s) => [s, "closed" as const]))
}

export function buildPayrollOverview(
  entries: readonly HonorLedgerEntry[],
  closedPeriodStarts: ReadonlySet<string>
): PayrollOverview {
  const statuses = statusMap(closedPeriodStarts)
  const periods = new Map<string, PayrollPeriodSummary>()
  let heldTotal = 0
  let heldCounselorCount = 0

  for (const list of groupByCounselor(entries).values()) {
    const view = buildHonorSaya(list, statuses)
    for (const p of view.periods) {
      const summary = periods.get(p.startDate) ?? {
        startDate: p.startDate,
        endDate: p.endDate,
        label: p.label,
        status: p.status,
        total: 0,
        counselorCount: 0,
        sessionCount: 0,
      }
      summary.total += p.total
      summary.sessionCount += p.sessionCount
      summary.counselorCount += 1
      periods.set(p.startDate, summary)
    }
    if (view.held.total > 0) {
      heldTotal += view.held.total
      heldCounselorCount += 1
    }
  }

  return {
    periods: [...periods.values()].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    heldTotal,
    heldCounselorCount,
  }
}

export function buildPayrollPeriodDetail(
  entries: readonly HonorLedgerEntry[],
  periodStart: string,
  counselors: ReadonlyMap<string, PayrollCounselorInfo>,
  closedPeriodStarts: ReadonlySet<string> = new Set()
): PayrollPeriodDetail {
  const period = payrollPeriodFor(periodStart)
  const statuses = statusMap(closedPeriodStarts)
  const rows: PayrollCounselorRow[] = []
  const held: PayrollHeldRow[] = []

  for (const [counselorId, list] of groupByCounselor(entries)) {
    const info = counselors.get(counselorId) ?? UNKNOWN_COUNSELOR
    const view = buildHonorSaya(list, statuses)
    const p = view.periods.find((v) => v.startDate === period.startDate)
    if (p && p.total > 0) {
      rows.push({
        ...info,
        counselorId,
        baseTotal: p.baseTotal,
        overtimeTotal: p.overtimeTotal,
        total: p.total,
        sessionCount: p.sessionCount,
        bankComplete: Boolean(info.bankName && info.accountNumber && info.accountHolder),
        lines: p.lines,
      })
    }
    if (view.held.total > 0) {
      held.push({ counselorId, name: info.name, total: view.held.total, lines: view.held.lines })
    }
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "id"))
  held.sort((a, b) => a.name.localeCompare(b.name, "id"))

  return {
    startDate: period.startDate,
    endDate: period.endDate,
    label: period.label,
    status: closedPeriodStarts.has(period.startDate) ? "closed" : "open",
    total: rows.reduce((sum, r) => sum + r.total, 0),
    counselors: rows,
    held,
  }
}

export const PAYOUT_CSV_HEADER = [
  "Nama",
  "Bank",
  "Nomor Rekening",
  "Atas Nama",
  "Total Honor",
  "Jumlah Sesi",
] as const

/** CSV transfer massal: satu baris per konselor yang menerima honor di periode ini. */
export function payoutCsv(detail: PayrollPeriodDetail): string {
  return toCsv([
    PAYOUT_CSV_HEADER,
    ...detail.counselors.map((c) => [c.name, c.bankName, c.accountNumber, c.accountHolder, c.total, c.sessionCount]),
  ])
}

export interface PayrollCloseStore {
  /**
   * Dalam SATU transaksi: pastikan baris periode ada, ubah open -> closed, lalu
   * jalankan `audit` dengan executor transaksi itu (galat audit membatalkan penutupan).
   * Mengembalikan false bila periode sudah tertutup.
   */
  closePeriod(input: {
    startDate: string
    endDate: string
    closedBy: string
    closedAt: Date
    audit: (executor: AuditExecutor) => Promise<void>
  }): Promise<boolean>
}

export type ClosePayrollResult =
  | { ok: true; total: number; counselorCount: number }
  | { ok: false; error: string }

/**
 * Tutup Periode: sinkronkan honor lebih dulu supaya angka beku sama dengan yang
 * dilihat admin, lalu tutup + catat audit atomik. Setelah tertutup, `planHonorRows`
 * tidak pernah mengubah bagian honor di periode itu (nilai, persentase, periode).
 */
export async function closePayrollPeriod(input: {
  startDate: string
  actor: RoleCarrier | null | undefined
  now: Date
  honorStore: HonorStore
  payrollStore: PayrollCloseStore
}): Promise<ClosePayrollResult> {
  const { actor, now } = input
  if (!hasStaffRole(actor, ADMIN_ROLES) || !actor) {
    return { ok: false, error: "Hanya Admin atau Superadmin yang dapat menutup periode payroll." }
  }

  let period
  try {
    period = payrollPeriodFor(input.startDate)
  } catch {
    return { ok: false, error: "Periode tidak valid." }
  }
  if (period.startDate !== input.startDate) return { ok: false, error: "Periode tidak valid." }
  if (wibDateOf(now) <= period.endDate) {
    return { ok: false, error: "Periode belum berakhir; tutup setelah tanggal akhir periode lewat." }
  }

  const { rows, facts, closedPeriodStarts } = await syncHonors({ now, store: input.honorStore })
  if (closedPeriodStarts.has(period.startDate)) return { ok: false, error: "Periode sudah ditutup." }

  const entries = toLedgerEntries(rows, facts)
  const detail = buildPayrollPeriodDetail(entries, period.startDate, new Map(), closedPeriodStarts)
  const snapshot = { total: detail.total, counselorCount: detail.counselors.length, label: period.label }

  const closed = await input.payrollStore.closePeriod({
    startDate: period.startDate,
    endDate: period.endDate,
    closedBy: actor.id,
    closedAt: now,
    audit: (executor) =>
      recordAudit(executor, {
        actor,
        action: "payroll.close",
        entityType: "payroll_period",
        entityId: period.startDate,
        before: { status: "open" },
        after: { status: "closed", ...snapshot },
      }),
  })
  if (!closed) return { ok: false, error: "Periode sudah ditutup." }
  return { ok: true, total: snapshot.total, counselorCount: snapshot.counselorCount }
}
