/**
 * In-memory sliding window rate limiter for /cek-sesi
 * 3 requests per 15 minutes per IP (US-21, US-62).
 *
 * Designed with Upstash Redis compatibility in production,
 * and reliable local memory fallback for zero-dependency development & unit testing.
 */

interface RateLimitRecord {
  timestamps: number[]
}

const MEMORY_STORE = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 3

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Checks and records an attempt for the given IP address.
 */
export async function checkRateLimit(
  ip: string,
  limit: number = MAX_ATTEMPTS,
  windowMs: number = WINDOW_MS
): Promise<RateLimitResult> {
  const cleanIp = ip ? ip.trim() : "127.0.0.1"
  const now = Date.now()

  // Upstash Redis integration if env vars are provided
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`
      const key = `ratelimit:cek-sesi:${cleanIp}`
      const windowSec = Math.ceil(windowMs / 1000)

      // Use raw REST call to avoid hard npm dependencies when not installed
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSec],
        ]),
      })

      if (res.ok) {
        const data = await res.json()
        const count = Number(data?.[0]?.result || 1)
        const remaining = Math.max(0, limit - count)
        return {
          success: count <= limit,
          remaining,
          resetTime: now + windowMs,
        }
      }
    } catch {
      // Fallback to in-memory if Redis connection fails
    }
  }

  // In-Memory sliding window
  const record = MEMORY_STORE.get(cleanIp) || { timestamps: [] }
  // Filter out timestamps outside the active window
  const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs)

  if (activeTimestamps.length >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: activeTimestamps[0] + windowMs,
    }
  }

  activeTimestamps.push(now)
  MEMORY_STORE.set(cleanIp, { timestamps: activeTimestamps })

  return {
    success: true,
    remaining: limit - activeTimestamps.length,
    resetTime: now + windowMs,
  }
}

/**
 * Helper to clear in-memory rate limits (primarily for testing suites)
 */
export function _resetRateLimits(): void {
  MEMORY_STORE.clear()
}
