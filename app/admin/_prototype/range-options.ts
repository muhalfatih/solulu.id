// PROTOTYPE — range keys shared by server data module and client filter.
export type RangeKey = "period" | "prev-period" | "7d" | "30d" | "month"

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "period", label: "Periode berjalan" },
  { key: "prev-period", label: "Periode lalu" },
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
  { key: "month", label: "Bulan ini" },
]

export const isRangeKey = (v: unknown): v is RangeKey =>
  typeof v === "string" && RANGE_OPTIONS.some((o) => o.key === v)
