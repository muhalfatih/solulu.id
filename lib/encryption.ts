import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16 // 128 bits auth tag

let ephemeralKey: Buffer | null = null

/**
 * Resolves a 32-byte encryption key buffer from input or environment.
 * Complies with secure key resolution:
 * - Production: strictly requires APP_ENCRYPTION_KEY environment variable.
 * - Non-production: falls back to an ephemeral in-memory key with a warning.
 */
export function getEncryptionKey(providedKey?: string): Buffer {
  const rawKey = providedKey || process.env.APP_ENCRYPTION_KEY

  if (rawKey) {
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, "hex")
    }
    if (Buffer.byteLength(rawKey, "utf8") === 32) {
      return Buffer.from(rawKey, "utf8")
    }
    // Derive a consistent 32-byte key via SHA-256 for arbitrary-length string secrets
    return crypto.createHash("sha256").update(rawKey).digest()
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "APP_ENCRYPTION_KEY environment variable is required in production."
    )
  }

  if (!ephemeralKey) {
    // Generate ephemeral 32-byte key for local development or test isolation
    ephemeralKey = crypto.randomBytes(32)
    // TODO(security): Set APP_ENCRYPTION_KEY in .env.local for persistent dev encryption
  }

  return ephemeralKey
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encrypt(plaintext: string, secretKey?: string): string {
  const key = getEncryptionKey(secretKey)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts a ciphertext formatted as `<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 * Throws an informative error if tampering, corrupted data, or invalid keys are detected.
 */
export function decrypt(encryptedText: string, secretKey?: string): string {
  const parts = encryptedText.split(":")
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted format. Expected format: iv:authTag:ciphertext"
    )
  }

  const [ivHex, authTagHex, dataHex] = parts
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error(
      "Invalid encrypted format. Missing initialization vector, auth tag, or ciphertext."
    )
  }

  const key = getEncryptionKey(secretKey)
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const data = Buffer.from(dataHex, "hex")

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      "Invalid encrypted format. Corrupted IV or Auth Tag length."
    )
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

    return decrypted.toString("utf8")
  } catch (error) {
    throw new Error(
      `Failed to decrypt: authentication failed or corrupted data. (${(error as Error).message})`
    )
  }
}
