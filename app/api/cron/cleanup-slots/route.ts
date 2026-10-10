import { handleCronRequest } from "@/lib/cron/handler"

/**
 * Scheduled Cron Worker for Slot Hold Cleanup & Auto-Archiving (US-58, ADR-0001).
 * Triggered by QStash every 5 minutes. Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  return handleCronRequest(req)
}

export async function POST(req: Request) {
  return handleCronRequest(req)
}
