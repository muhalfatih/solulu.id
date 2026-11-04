/**
 * CSV RFC 4180: pemisah koma, akhir baris CRLF, sel dikutip bila memuat koma,
 * kutip ganda, atau baris baru (kutip digandakan). Sel string yang diawali
 * karakter rumus spreadsheet diberi apostrof agar tidak dieksekusi.
 */
export type CsvCell = string | number | null | undefined

const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: CsvCell): string {
  if (value === null || value === undefined) return ""
  let text = typeof value === "number" ? String(value) : value
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(cell).join(",") + "\r\n").join("")
}
