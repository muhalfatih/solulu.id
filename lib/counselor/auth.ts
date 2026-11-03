import { eq } from "drizzle-orm"
import { db } from "@/db"
import { counselors } from "@/db/schema"
import { requireStaffUser } from "@/lib/auth/staff"
import type { StaffRole } from "@/lib/auth/staff-role"
import type { CounselorAuthContext } from "./types"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resolves the authenticated counselor from the Supabase session
 * (app_metadata.role). With `allowAdmin`, Admin and Superadmin also pass.
 */
export async function getAuthenticatedCounselor(
  customUser?: CounselorAuthContext | null,
  options?: { allowAdmin?: boolean }
): Promise<CounselorAuthContext | null> {
  const allowed: StaffRole[] = options?.allowAdmin
    ? ["counselor", "admin", "superadmin"]
    : ["counselor"]
  return (await requireStaffUser(customUser, allowed)) as CounselorAuthContext | null
}

/**
 * Resolves the database counselor record ID for the authenticated user.
 * Returns null when the user has no counselor record; never guesses another counselor.
 */
export async function resolveCounselorId(auth: CounselorAuthContext): Promise<string | null> {
  if (auth.counselorId) {
    return auth.counselorId
  }

  if (!auth.id || !UUID_REGEX.test(auth.id)) {
    return null
  }

  try {
    const found = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(eq(counselors.userId, auth.id))
      .limit(1)

    return found.length > 0 ? found[0].id : null
  } catch {
    return null
  }
}
