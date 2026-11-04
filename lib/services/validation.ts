import type { CounselorTypeKey } from "@/lib/services/pricing"

/**
 * Validasi input Layanan (ADR-0010) untuk form Superadmin. Murni, tanpa I/O.
 * Durasi tidak dikonfigurasi (selalu 90 menit); slug dibuat dari nama saat Layanan dibuat.
 */

export const COUNSELOR_TYPE_KEYS: readonly CounselorTypeKey[] = ["peer", "psychologist"]

export interface ServiceFormInput {
  name: string
  description?: string | null
  basePrice: number
  promoPrice?: number | null
  allowVoucher: boolean
  overtimeRatePer30Min: number
  basePayoutPercent: number
  overtimePayoutPercent: number
  allowedCounselorTypes: string[]
  sortOrder?: number
}

export interface ServiceWriteValues {
  name: string
  description: string | null
  basePrice: string
  promoPrice: string | null
  allowVoucher: boolean
  overtimeRatePer30Min: string
  basePayoutPercent: number
  overtimePayoutPercent: number
  allowedCounselorTypes: CounselorTypeKey[]
  sortOrder?: number
}

export type ServiceValidation =
  | { ok: true; values: ServiceWriteValues }
  | { ok: false; error: string }

const isPercent = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 100

export function validateServiceInput(input: ServiceFormInput): ServiceValidation {
  const name = (input.name ?? "").trim()
  if (name.length < 3) return { ok: false, error: "Nama Layanan minimal 3 karakter." }
  if (name.length > 80) return { ok: false, error: "Nama Layanan maksimal 80 karakter." }
  if (!(Number.isFinite(input.basePrice) && input.basePrice > 0)) {
    return { ok: false, error: "Tarif dasar harus lebih dari 0." }
  }
  const promo = input.promoPrice ?? null
  if (promo !== null && !(Number.isFinite(promo) && promo >= 0 && promo < input.basePrice)) {
    return { ok: false, error: "Tarif promo harus lebih rendah dari tarif dasar." }
  }
  if (!(Number.isFinite(input.overtimeRatePer30Min) && input.overtimeRatePer30Min >= 0)) {
    return { ok: false, error: "Tarif overtime per 30 menit tidak boleh negatif." }
  }
  if (!isPercent(input.basePayoutPercent) || !isPercent(input.overtimePayoutPercent)) {
    return { ok: false, error: "Bagi Hasil harus bilangan bulat 0 sampai 100." }
  }
  const types = Array.from(new Set(input.allowedCounselorTypes ?? []))
  if (types.length === 0) return { ok: false, error: "Pilih minimal satu Tipe Konselor." }
  const known = COUNSELOR_TYPE_KEYS as readonly string[]
  if (!types.every((t) => known.includes(t))) {
    return { ok: false, error: "Tipe Konselor tidak dikenal." }
  }
  const description = input.description?.trim() ? input.description.trim() : null
  const values: ServiceWriteValues = {
    name,
    description,
    basePrice: String(input.basePrice),
    promoPrice: promo === null ? null : String(promo),
    allowVoucher: input.allowVoucher === true,
    overtimeRatePer30Min: String(input.overtimeRatePer30Min),
    basePayoutPercent: input.basePayoutPercent,
    overtimePayoutPercent: input.overtimePayoutPercent,
    allowedCounselorTypes: types as CounselorTypeKey[],
  }
  if (input.sortOrder !== undefined) {
    if (!Number.isInteger(input.sortOrder)) return { ok: false, error: "Urutan tampil harus bilangan bulat." }
    values.sortOrder = input.sortOrder
  }
  return { ok: true, values }
}

/** "Konseling Pra-Nikah" -> "konseling-pra-nikah". */
export function slugifyServiceName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Slug unik: tambahkan -2, -3, ... bila sudah dipakai. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || "layanan"
  if (!taken.has(root)) return root
  let i = 2
  while (taken.has(`${root}-${i}`)) i++
  return `${root}-${i}`
}
