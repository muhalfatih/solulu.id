import { createClient } from "@/lib/supabase/server"
import { hasStaffRole, type RoleCarrier, type StaffRole } from "./staff-role"

/**
 * Returns the signed-in Supabase user, or null when there is no valid session.
 */
export async function getSessionUser(): Promise<RoleCarrier | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    }
  } catch {
    return null
  }
}

/**
 * Resolves the acting staff user and checks the role in one place.
 * `customUser` is the injection seam for tests (`undefined` means "read the
 * Supabase session"; `null` means "explicitly anonymous").
 */
export async function requireStaffUser(
  customUser: RoleCarrier | null | undefined,
  allowed: readonly StaffRole[]
): Promise<RoleCarrier | null> {
  const user = customUser !== undefined ? customUser : await getSessionUser()
  return hasStaffRole(user, allowed) ? user : null
}
