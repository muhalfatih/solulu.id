import { requireStaffUser } from "@/lib/auth/staff"
import { ADMIN_ROLES } from "@/lib/auth/staff-role"

export interface AdminAuthContext {
  id: string
  email?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

/** Returns the authenticated Admin/Superadmin (or the injected test user), else null. */
export async function getAuthenticatedAdmin(
  customUser?: AdminAuthContext | null
): Promise<AdminAuthContext | null> {
  return requireStaffUser(customUser, ADMIN_ROLES)
}
