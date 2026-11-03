/**
 * Periode Payroll (ADR-0007): 1-15 dan 16-akhir bulan, menurut tanggal sesi di zona WIB.
 * Pure logic, tanpa I/O dan tanpa `new Date()`.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

export interface PayrollPeriod {
  /** Tanggal mulai (YYYY-MM-DD, WIB). Sekaligus kunci unik periode. */
  startDate: string
  /** Tanggal akhir (YYYY-MM-DD, WIB), inklusif. */
  endDate: string
  label: string
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Tanggal kalender WIB (YYYY-MM-DD) dari instan atau string tanggal murni. */
export function wibDateOf(input: Date | string): string {
  if (typeof input === "string") {
    const m = DATE_ONLY.exec(input)
    if (m) {
      const [, y, mo, d] = m
      const probe = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))
      if (
        probe.getUTCFullYear() !== Number(y) ||
        probe.getUTCMonth() !== Number(mo) - 1 ||
        probe.getUTCDate() !== Number(d)
      ) {
        throw new Error(`Tanggal sesi tidak valid: ${input}`)
      }
      return input
    }
    const parsed = new Date(input)
    if (Number.isNaN(parsed.getTime())) throw new Error(`Tanggal sesi tidak valid: ${input}`)
    return new Date(parsed.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
  }
  if (Number.isNaN(input.getTime())) throw new Error("Tanggal sesi tidak valid")
  return new Date(input.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

function buildPeriod(year: number, month: number, secondHalf: boolean): PayrollPeriod {
  const first = secondHalf ? 16 : 1
  const last = secondHalf ? daysInMonth(year, month) : 15
  return {
    startDate: `${year}-${pad(month)}-${pad(first)}`,
    endDate: `${year}-${pad(month)}-${pad(last)}`,
    label: `${first}-${last} ${MONTH_NAMES[month - 1]} ${year}`,
  }
}

/** Periode Payroll tempat sebuah sesi jatuh. */
export function payrollPeriodFor(sessionDate: Date | string): PayrollPeriod {
  const [y, m, d] = wibDateOf(sessionDate).split("-").map(Number)
  return buildPeriod(y, m, d >= 16)
}

/** Periode yang langsung mengikuti periode ini. */
export function nextPayrollPeriod(period: PayrollPeriod): PayrollPeriod {
  const [y, m, d] = period.startDate.split("-").map(Number)
  if (d === 1) return buildPeriod(y, m, true)
  return m === 12 ? buildPeriod(y + 1, 1, false) : buildPeriod(y, m + 1, false)
}
