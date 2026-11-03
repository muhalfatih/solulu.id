/** Tanggal id-ID dan jam WIB (Asia/Jakarta) untuk seluruh portal (#23). */

const TZ = "Asia/Jakarta"

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function formatDateId(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(toDate(value))
}

export function formatTimeWib(value: Date | string): string {
  const t = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(toDate(value))
  return `${t} WIB`
}

export function formatDateTimeWib(value: Date | string): string {
  return `${formatDateId(value)}, ${formatTimeWib(value)}`
}
