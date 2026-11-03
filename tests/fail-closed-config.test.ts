import { describe, it, expect, vi } from "vitest"
import {
  getCronSecret,
  getQstashConfig,
  getR2Credentials,
  getResendConfig,
  getXenditConfig,
  IntegrationConfigError,
} from "@/lib/config/integrations"

const prod = { NODE_ENV: "production" }

describe("Integration config fails closed (ADR-0013)", () => {
  it("throws an error naming XENDIT_SECRET_KEY when it is missing outside test", () => {
    expect(() => getXenditConfig(prod)).toThrow(IntegrationConfigError)
    expect(() => getXenditConfig(prod)).toThrow(/XENDIT_SECRET_KEY/)
  })

  it.each(["mock", "xnd_development_...", "changeme", "your_xendit_key", "   "])(
    "treats placeholder %j as missing",
    (placeholder) => {
      expect(() => getXenditConfig({ ...prod, XENDIT_SECRET_KEY: placeholder })).toThrow(
        /XENDIT_SECRET_KEY/
      )
    }
  )

  it("returns real values untouched", () => {
    expect(
      getXenditConfig({ ...prod, XENDIT_SECRET_KEY: "xnd_production_abc", XENDIT_CALLBACK_TOKEN: "cb-1" })
    ).toEqual({ secretKey: "xnd_production_abc", callbackToken: "cb-1" })
  })

  it("names the missing variable for every integration", () => {
    expect(() => getQstashConfig(prod)).toThrow(/QSTASH_TOKEN/)
    expect(() => getResendConfig(prod)).toThrow(/RESEND_API_KEY/)
    expect(() => getCronSecret(prod)).toThrow(/CRON_SECRET/)
    expect(() => getR2Credentials(prod)).toThrow(/R2_ACCESS_KEY_ID/)
    expect(() => getR2Credentials({ ...prod, R2_ACCESS_KEY_ID: "ak" })).toThrow(
      /R2_SECRET_ACCESS_KEY/
    )
    expect(() =>
      getR2Credentials({ ...prod, R2_ACCESS_KEY_ID: "ak", R2_SECRET_ACCESS_KEY: "sk" })
    ).toThrow(/R2_ENDPOINT/)
  })

  it("resolves a complete configuration", () => {
    expect(getQstashConfig({ ...prod, QSTASH_TOKEN: "qt" })).toEqual({
      token: "qt",
      url: "https://qstash.upstash.io/v2",
    })
    expect(
      getResendConfig({ ...prod, RESEND_API_KEY: "re_live", RESEND_FROM_EMAIL: "Solulu <a@b.id>" })
    ).toEqual({
      apiKey: "re_live",
      fromEmail: "Solulu <a@b.id>",
    })
    expect(getCronSecret({ ...prod, CRON_SECRET: "s3cret" })).toBe("s3cret")
    expect(
      getR2Credentials({
        ...prod,
        R2_ACCESS_KEY_ID: "ak",
        R2_SECRET_ACCESS_KEY: "sk",
        R2_ACCOUNT_ID: "acc",
      })
    ).toEqual({
      accessKeyId: "ak",
      secretAccessKey: "sk",
      endpoint: "https://acc.r2.cloudflarestorage.com",
    })
  })

  it("does not throw under NODE_ENV=test even when values are missing", () => {
    expect(() => getXenditConfig({ NODE_ENV: "test" })).not.toThrow()
    expect(() => getCronSecret({ NODE_ENV: "test" })).not.toThrow()
  })

  it("reads process.env by default so vi.stubEnv drives it", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CRON_SECRET", "")
    try {
      expect(() => getCronSecret()).toThrow(/CRON_SECRET/)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
