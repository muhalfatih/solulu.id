/**
 * Single reader for third-party integration configuration (ADR-0013).
 *
 * Outside NODE_ENV=test a missing or placeholder value throws an
 * IntegrationConfigError that names the variable. There is no mock fallback:
 * callers either get a real value or a clear failure.
 */

export type IntegrationEnv = Record<string, string | undefined>

export class IntegrationConfigError extends Error {
  readonly variable: string

  constructor(variable: string, detail = "belum dikonfigurasi atau masih berupa placeholder") {
    super(`Konfigurasi ${variable} ${detail}.`)
    this.name = "IntegrationConfigError"
    this.variable = variable
  }
}

const PLACEHOLDER_PATTERNS = [
  /^mock/i,
  /^changeme/i,
  /^change[-_]me/i,
  /^your[-_]/i,
  /^<.*>$/,
  /\.\.\.$/,
  /^placeholder/i,
  /^todo$/i,
  /^xxx+$/i,
]

export function isPlaceholder(value: string | undefined): boolean {
  if (value === undefined) return true
  const trimmed = value.trim()
  if (!trimmed) return true
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed))
}

function isTestEnv(env: IntegrationEnv): boolean {
  return env.NODE_ENV === "test"
}

/**
 * Returns the trimmed value of `name`. Throws outside NODE_ENV=test when the
 * value is missing or a placeholder; under test returns "" for missing values
 * so unit tests can inject their own adapters.
 */
function requireValue(name: string, env: IntegrationEnv): string {
  const raw = env[name]
  if (isTestEnv(env)) return raw?.trim() ?? ""
  if (isPlaceholder(raw)) throw new IntegrationConfigError(name)
  return (raw as string).trim()
}

export interface XenditConfig {
  secretKey: string
  callbackToken: string | undefined
}

export function getXenditConfig(env: IntegrationEnv = process.env): XenditConfig {
  return {
    secretKey: requireValue("XENDIT_SECRET_KEY", env),
    callbackToken: env.XENDIT_CALLBACK_TOKEN?.trim() || undefined,
  }
}

/** Callback token used to authenticate Xendit webhooks; required outside test. */
export function getXenditCallbackToken(env: IntegrationEnv = process.env): string {
  return requireValue("XENDIT_CALLBACK_TOKEN", env)
}

export interface QstashConfig {
  token: string
  url: string
}

export function getQstashConfig(env: IntegrationEnv = process.env): QstashConfig {
  const token = requireValue("QSTASH_TOKEN", env)
  const rawUrl = env.QSTASH_URL?.trim() || "https://qstash.upstash.io"
  const url = rawUrl.endsWith("/v2") ? rawUrl : `${rawUrl.replace(/\/+$/, "")}/v2`
  return { token, url }
}

export interface ResendConfig {
  apiKey: string
  fromEmail: string
}

export function getResendConfig(env: IntegrationEnv = process.env): ResendConfig {
  return {
    apiKey: requireValue("RESEND_API_KEY", env),
    fromEmail: env.RESEND_FROM_EMAIL?.trim() || "Solulu Support <halo@solulu.id>",
  }
}

export function getCronSecret(env: IntegrationEnv = process.env): string {
  return requireValue("CRON_SECRET", env)
}

export interface R2Credentials {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
}

export function getR2Credentials(env: IntegrationEnv = process.env): R2Credentials {
  const accessKeyId = requireValue("R2_ACCESS_KEY_ID", env)
  const secretAccessKey = requireValue("R2_SECRET_ACCESS_KEY", env)
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const explicitEndpoint = env.R2_ENDPOINT?.trim()
  const endpoint =
    explicitEndpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  if (!endpoint && !isTestEnv(env)) {
    throw new IntegrationConfigError("R2_ENDPOINT", "atau R2_ACCOUNT_ID belum dikonfigurasi")
  }
  return { accessKeyId, secretAccessKey, endpoint }
}

export interface QstashSigningKeys {
  current: string
  next: string
}

/** Signing keys used to verify QStash-delivered requests; required outside test. */
export function getQstashSigningKeys(env: IntegrationEnv = process.env): QstashSigningKeys {
  return {
    current: requireValue("QSTASH_CURRENT_SIGNING_KEY", env),
    next: requireValue("QSTASH_NEXT_SIGNING_KEY", env),
  }
}
