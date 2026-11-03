import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { getQstashSigningKeys, type QstashSigningKeys } from "@/lib/config/integrations"

const fromB64 = (v: string) => Buffer.from(v, "base64url")

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b)
}

function verifyWithKey(key: string, signature: string, body: string, url: string | undefined): boolean {
  const parts = signature.split(".")
  if (parts.length !== 3) return false
  const [header, payload, sig] = parts
  const expected = createHmac("sha256", key).update(`${header}.${payload}`).digest()
  if (!safeEqual(expected, fromB64(sig))) return false
  try {
    const h = JSON.parse(fromB64(header).toString("utf8"))
    if (h.alg !== "HS256") return false
    const c = JSON.parse(fromB64(payload).toString("utf8"))
    if (c.iss !== "Upstash") return false
    const now = Math.floor(Date.now() / 1000)
    if (typeof c.exp !== "number" || c.exp < now) return false
    if (typeof c.nbf === "number" && c.nbf > now) return false
    if (url !== undefined && c.sub !== url) return false
    const bodyHash = createHash("sha256").update(body).digest()
    return typeof c.body === "string" && safeEqual(bodyHash, fromB64(c.body.replace(/=+$/, "")))
  } catch {
    return false
  }
}

/** Verifies an Upstash-Signature JWT (HS256) against the current/next signing keys. */
export function verifyQstashSignature(input: {
  signature: string
  body: string
  url?: string
  keys?: QstashSigningKeys
}): boolean {
  const keys = input.keys ?? getQstashSigningKeys()
  return [keys.current, keys.next].some(
    (key) => key && verifyWithKey(key, input.signature, input.body, input.url)
  )
}
