import { eq } from "drizzle-orm"
import { db } from "../../db"
import { zoomAccounts } from "../../db/schema"
import { decrypt } from "../encryption"

export interface ZoomAccountRecord {
  id: string
  name: string
  email: string
  accountId: string
  clientId: string
  clientSecretEncrypted: string
  cachedAccessToken?: string | null
  tokenExpiresAt?: Date | null
  isActive: boolean
}

export interface ZoomCredentials {
  accountId: string
  clientId: string
  clientSecret: string
}

export interface ZoomOAuthResponse {
  accessToken: string
  expiresIn: number
  scope?: string
}

export interface FetchOptions {
  fetchFn?: typeof fetch
}

/**
 * Fetches an access token from Zoom Server-to-Server (S2S) OAuth endpoint.
 * Reference: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
 */
export async function fetchZoomOAuthToken(
  credentials: ZoomCredentials,
  options: FetchOptions = {}
): Promise<ZoomOAuthResponse> {
  const fetchFn = options.fetchFn ?? fetch
  const { accountId, clientId, clientSecret } = credentials

  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
    accountId
  )}`

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errJson = await response.json()
      errorDetail =
        errJson.message || errJson.error || errJson.reason || JSON.stringify(errJson)
    } catch {
      // Fallback to statusText
    }
    throw new Error(`Zoom OAuth Error (${response.status}): ${errorDetail}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 3600,
    scope: data.scope,
  }
}

export interface GetAccessTokenOptions extends FetchOptions {
  decryptFn?: (encrypted: string) => string
  updateDbToken?: (
    accountId: string,
    update: { cachedAccessToken: string; tokenExpiresAt: Date }
  ) => Promise<any>
}

/**
 * Retrieves a valid Zoom access token for the given account.
 * Implements token caching with a 3500-second TTL to avoid Zoom API rate limits (HTTP 429).
 */
export async function getZoomAccessToken(
  account: ZoomAccountRecord,
  options: GetAccessTokenOptions = {}
): Promise<string> {
  const now = Date.now()
  const bufferMs = 60 * 1000 // 60s buffer

  // Check if token in cache is still fresh
  if (
    account.cachedAccessToken &&
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() > now + bufferMs
  ) {
    return account.cachedAccessToken
  }

  // Token is expired or missing: fetch a new S2S token
  const decryptFn = options.decryptFn ?? decrypt
  const clientSecret = decryptFn(account.clientSecretEncrypted)

  const tokenData = await fetchZoomOAuthToken(
    {
      accountId: account.accountId,
      clientId: account.clientId,
      clientSecret,
    },
    { fetchFn: options.fetchFn }
  )

  // 3500s TTL per ADR & architectural guardrails (under Zoom's default 3600s)
  const tokenExpiresAt = new Date(Date.now() + 3500 * 1000)

  if (options.updateDbToken) {
    await options.updateDbToken(account.id, {
      cachedAccessToken: tokenData.accessToken,
      tokenExpiresAt,
    })
  } else {
    await db
      .update(zoomAccounts)
      .set({
        cachedAccessToken: tokenData.accessToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(zoomAccounts.id, account.id))
  }

  return tokenData.accessToken
}

/**
 * Validates Zoom S2S OAuth credentials by executing a live token handshake.
 */
export async function verifyZoomCredentials(
  credentials: ZoomCredentials,
  options: FetchOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  try {
    await fetchZoomOAuthToken(credentials, options)
    return { valid: true }
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || "Kredensial Zoom tidak valid.",
    }
  }
}

export interface CreateMeetingInput {
  topic: string
  startTime: string // ISO 8601 string or YYYY-MM-DDTHH:mm:ss
  durationMinutes?: number
}

export interface ZoomMeetingResult {
  meetingId: string
  joinUrl: string
  startUrl: string
  password?: string
}

/**
 * Creates a scheduled Zoom meeting with fixed 90-minute duration and waiting room.
 */
export async function createZoomMeeting(
  accessToken: string,
  input: CreateMeetingInput,
  options: FetchOptions = {}
): Promise<ZoomMeetingResult> {
  const fetchFn = options.fetchFn ?? fetch
  const duration = input.durationMinutes ?? 90

  const payload = {
    topic: input.topic,
    type: 2, // Scheduled meeting
    start_time: input.startTime,
    duration,
    timezone: "Asia/Jakarta",
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
      mute_upon_entry: false,
      audio: "voip",
      auto_recording: "none",
    },
  }

  const response = await fetchFn("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errJson = await response.json()
      errorDetail =
        errJson.message || errJson.error || errJson.reason || JSON.stringify(errJson)
    } catch {
      // Fallback
    }
    throw new Error(`Zoom API Error (${response.status}): ${errorDetail}`)
  }

  const data = await response.json()

  return {
    meetingId: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
    password: data.password,
  }
}
