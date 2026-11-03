export { cn } from "cn"

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Nominal untuk layar; "-" bila belum ada transaksi (tidak pernah mengarang angka). */
export function formatRupiahOrDash(amount: number | null | undefined): string {
  return amount == null ? "-" : formatRupiah(amount)
}
