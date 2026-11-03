import {
  startingPricesByCounselorType,
  type CounselorTypeKey,
  type ServicePricingView,
} from "@/lib/services/pricing"
import { listAllServices } from "@/lib/services/repository"

/**
 * "Mulai dari" price per Tipe Konselor for public pages (landing, pricing, screening).
 * Reads only the `services` table (ADR-0010). A type with no active Layanan yields null;
 * callers render an empty state instead of a fabricated price.
 */
export async function getStartingPricesByCounselorType(): Promise<
  Record<CounselorTypeKey, ServicePricingView | null>
> {
  try {
    return startingPricesByCounselorType(await listAllServices())
  } catch (error) {
    console.error("[SERVICES] Failed to load Layanan for public pricing:", error)
    return { peer: null, psychologist: null }
  }
}
