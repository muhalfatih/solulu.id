/**
 * Template Pesan WhatsApp (#31): pure rendering and validation, no I/O.
 * Pesan hanya berupa link `wa.me/{nomor}?text=...` (CONTEXT: WhatsApp Integration);
 * tidak ada WA Business API.
 */

export const WA_TEMPLATE_KEYS = ["dispatch_link_sesi", "laporan_siap"] as const
export type WaTemplateKey = (typeof WA_TEMPLATE_KEYS)[number]

export const WA_TEMPLATE_META: Record<WaTemplateKey, { name: string; description: string }> = {
  dispatch_link_sesi: {
    name: "Dispatch Link Sesi",
    description: "Dikirim ke klien yang bookingnya sudah terkonfirmasi, berisi jadwal dan link sesi.",
  },
  laporan_siap: {
    name: "Laporan Siap",
    description: "Dikirim ke klien setelah sesi selesai dan laporan sesi sudah diisi konselor.",
  },
}

export const WA_PLACEHOLDERS = [
  "nama_klien",
  "tanggal",
  "slot",
  "link_sesi",
  "nama_konselor",
] as const
export type WaPlaceholder = (typeof WA_PLACEHOLDERS)[number]
export type WaTemplateValues = Record<WaPlaceholder, string>

export const WA_TEMPLATE_MAX_LENGTH = 1000

export function isWaTemplateKey(value: string): value is WaTemplateKey {
  return (WA_TEMPLATE_KEYS as readonly string[]).includes(value)
}

export function formatPlaceholder(name: WaPlaceholder): string {
  return `{{${name}}}`
}

/** Semua blok `{{...}}` pada teks, dengan nama yang sudah di-trim. */
function extractTokens(body: string): string[] {
  return Array.from(body.matchAll(/\{\{([^{}]*)\}\}/g), (m) => m[1].trim())
}

export type TemplateValidation = { ok: true } | { ok: false; error: string; unknown: string[] }

export function validateTemplateBody(body: string): TemplateValidation {
  if (!body.trim()) return { ok: false, error: "Isi template tidak boleh kosong.", unknown: [] }
  if (body.length > WA_TEMPLATE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Isi template maksimal ${WA_TEMPLATE_MAX_LENGTH} karakter.`,
      unknown: [],
    }
  }
  const known = WA_PLACEHOLDERS as readonly string[]
  const unknown = Array.from(new Set(extractTokens(body).filter((t) => !known.includes(t))))
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Placeholder tidak dikenal: ${unknown.map((u) => `{{${u}}}`).join(", ")}. Yang tersedia: ${WA_PLACEHOLDERS.map(formatPlaceholder).join(", ")}.`,
      unknown,
    }
  }
  return { ok: true }
}

/** Mengganti placeholder dikenal dengan nilainya; token lain dibiarkan apa adanya. */
export function renderTemplate(body: string, values: WaTemplateValues): string {
  return body.replace(/\{\{([^{}]*)\}\}/g, (whole, raw: string) => {
    const name = raw.trim() as WaPlaceholder
    return (WA_PLACEHOLDERS as readonly string[]).includes(name) ? values[name] : whole
  })
}

/** Nomor lokal 08xx menjadi 628xx; hanya digit. Null bila tidak masuk akal. */
export function normalizeWaPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "")
  const intl = digits.startsWith("0") ? `62${digits.slice(1)}` : digits
  return intl.length >= 9 && intl.length <= 15 ? intl : null
}

export function buildWaUrl(phone: string, text: string): string | null {
  const to = normalizeWaPhone(phone)
  return to ? `https://wa.me/${to}?text=${encodeURIComponent(text)}` : null
}
