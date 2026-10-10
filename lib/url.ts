/**
 * Centralized Application URL Resolver.
 * Resolves the primary canonical base URL across local development, Vercel deployments, and production.
 */
export function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  // In production mode (or on Vercel), reject localhost to prevent sending broken links in emails/webhooks
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)

  if (envUrl) {
    const isLocalhost = envUrl.includes("localhost") || envUrl.includes("127.0.0.1")
    if (!isProd || !isLocalhost) {
      return envUrl.replace(/\/+$/, "")
    }
  }

  // 1. Vercel Canonical Production Domain (e.g., solulu-id.vercel.app or custom domain)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, "")
  }

  // 2. Vercel Preview/Branch URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "")
  }

  // 3. Fallback for production if no env is set
  if (isProd) {
    return "https://solulu.id"
  }

  // 4. Local development default
  return "http://localhost:3000"
}

export function getAppLoginUrl(): string {
  return `${getAppBaseUrl()}/login`
}

export function getAppSessionCheckUrl(): string {
  return `${getAppBaseUrl()}/cek-sesi`
}
