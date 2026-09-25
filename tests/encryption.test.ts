import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { encrypt, decrypt, getEncryptionKey } from "../lib/encryption"

describe("Seam 1: AES-256-GCM Encryption (lib/encryption.ts)", () => {
  const testKey =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" // 64 hex chars = 32 bytes

  it("encrypts plaintext and decrypts back to original plaintext (roundtrip)", () => {
    const secret = "zm_secret_12345_very_confidential"
    const encrypted = encrypt(secret, testKey)

    expect(encrypted).not.toBe(secret)
    expect(encrypted.split(":").length).toBe(3) // iv:tag:ciphertext

    const decrypted = decrypt(encrypted, testKey)
    expect(decrypted).toBe(secret)
  })

  it("produces different ciphertexts for the same plaintext due to random IV", () => {
    const secret = "constant_secret"
    const encrypted1 = encrypt(secret, testKey)
    const encrypted2 = encrypt(secret, testKey)

    expect(encrypted1).not.toBe(encrypted2)

    expect(decrypt(encrypted1, testKey)).toBe(secret)
    expect(decrypt(encrypted2, testKey)).toBe(secret)
  })

  it("throws an error when decrypting tampered ciphertext or auth tag", () => {
    const secret = "secret_to_protect"
    const encrypted = encrypt(secret, testKey)
    const [iv, tag, data] = encrypted.split(":")

    // Tamper with data
    const tamperedData =
      (parseInt(data.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, "0") +
      data.slice(2)
    const tamperedPayload = `${iv}:${tag}:${tamperedData}`

    expect(() => decrypt(tamperedPayload, testKey)).toThrow(/Failed to decrypt/)

    // Tamper with auth tag
    const tamperedTag =
      (parseInt(tag.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, "0") +
      tag.slice(2)
    const tamperedTagPayload = `${iv}:${tamperedTag}:${data}`

    expect(() => decrypt(tamperedTagPayload, testKey)).toThrow(
      /Failed to decrypt/
    )
  })

  it("throws an error when decrypting with the wrong key", () => {
    const secret = "top_secret_token"
    const wrongKey =
      "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    const encrypted = encrypt(secret, testKey)

    expect(() => decrypt(encrypted, wrongKey)).toThrow(/Failed to decrypt/)
  })

  it("throws an error on malformed ciphertext format", () => {
    expect(() => decrypt("not-a-valid-ciphertext", testKey)).toThrow(
      /Invalid encrypted format/
    )
    expect(() => decrypt("only:two:parts:here", testKey)).toThrow(
      /Invalid encrypted format/
    )
  })

  describe("Environment variable fallback & resolution", () => {
    const originalEnv = process.env.APP_ENCRYPTION_KEY

    beforeEach(() => {
      process.env.APP_ENCRYPTION_KEY = testKey
    })

    afterEach(() => {
      process.env.APP_ENCRYPTION_KEY = originalEnv
    })

    it("uses process.env.APP_ENCRYPTION_KEY when key parameter is omitted", () => {
      const secret = "env_based_secret"
      const encrypted = encrypt(secret)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(secret)
    })

    it("errors in production if APP_ENCRYPTION_KEY is missing", () => {
      const originalNodeEnv = process.env.NODE_ENV
      ;(process.env as Record<string, string | undefined>).NODE_ENV =
        "production"
      delete process.env.APP_ENCRYPTION_KEY

      expect(() => getEncryptionKey()).toThrow(
        /APP_ENCRYPTION_KEY environment variable is required/
      )

      ;(process.env as Record<string, string | undefined>).NODE_ENV =
        originalNodeEnv
    })
  })
})
