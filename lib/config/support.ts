/**
 * Support WhatsApp contact. There is no fabricated default: when
 * NEXT_PUBLIC_WHATSAPP_SUPPORT is unset or invalid the helpers return null and
 * the UI hides the WhatsApp link.
 *
 * The env var is read as a literal `process.env.NEXT_PUBLIC_*` expression so
 * Next.js can inline it into client bundles.
 */
export function getSupportWhatsappNumber(
  raw: string | undefined = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT
): string | null {
  const digits = (raw ?? "").replace(/\D/g, "")
  return digits.length >= 8 ? digits : null
}

export function getSupportWhatsappUrl(
  message?: string,
  raw: string | undefined = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT
): string | null {
  const number = getSupportWhatsappNumber(raw)
  if (!number) return null
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`
}
