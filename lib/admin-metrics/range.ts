import { payrollPeriodFor, wibDateOf, type DateRange } from "@/lib/finance"

/**
 * Filter rentang dashboard admin (`?period=`): murni, tanpa I/O.
 * Semua tanggal YYYY-MM-DD zona WIB; `now` selalu diberikan pemanggil.
 */
export const RANGE_KEYS = ["period", "prev-period", "7d", "30d", "month"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]
export const DEFAULT_RANGE_KEY: RangeKey = "period"

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "period", label: "Periode berjalan" },
  { key: "prev-period", label: "Periode lalu" },
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
  { key: "month", label: "Bulan ini" },
]

export function parseRangeKey(value: string | string[] | null | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value
  return (RANGE_KEYS as readonly string[]).includes(v ?? "") ? (v as RangeKey) : DEFAULT_RANGE_KEY
}

const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Rentang yang sedang berjalan berhenti di hari ini (US64): pembanding memakai jumlah hari
 * yang sama tepat sebelumnya, jadi 3 hari awal periode tidak dibandingkan dengan 15 hari penuh.
 */
function upToToday(end: string, today: string): string {
  return end < today ? end : today
}

export function rangeForKey(key: RangeKey, now: Date): DateRange {
  const today = wibDateOf(now)
  switch (key) {
    case "prev-period": {
      const current = payrollPeriodFor(today)
      const prev = payrollPeriodFor(addDays(current.startDate, -1))
      return { from: prev.startDate, to: prev.endDate }
    }
    case "7d":
      return { from: addDays(today, -6), to: today }
    case "30d":
      return { from: addDays(today, -29), to: today }
    case "month": {
      const [y, m] = today.split("-").map(Number)
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
      const mm = String(m).padStart(2, "0")
      return { from: `${y}-${mm}-01`, to: upToToday(`${y}-${mm}-${String(last).padStart(2, "0")}`, today) }
    }
    default: {
      const period = payrollPeriodFor(today)
      return { from: period.startDate, to: upToToday(period.endDate, today) }
    }
  }
}

/** Setiap tanggal di dalam rentang (inklusif), termasuk hari tanpa data. */
export function eachDay(range: DateRange): string[] {
  const days: string[] = []
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) days.push(d)
  return days
}
