/**
 * The one staff role checker (ADR-0013).
 *
 * A staff role comes only from `app_metadata.role` of the Supabase session.
 * `user_metadata` is writable by the signed-in user, so it is never consulted,
 * and no cookie or other client-supplied value can confer a role.
 */

export const STAFF_ROLES = ["superadmin", "admin", "operator", "counselor"] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export interface RoleCarrier {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export function getStaffRole(user: RoleCarrier | null | undefined): StaffRole | null {
  const role = user?.app_metadata?.role
  return (STAFF_ROLES as readonly string[]).includes(role) ? (role as StaffRole) : null
}

export function hasStaffRole(
  user: RoleCarrier | null | undefined,
  allowed: readonly StaffRole[]
): boolean {
  const role = getStaffRole(user)
  return role !== null && allowed.includes(role)
}

export const ADMIN_ROLES: readonly StaffRole[] = ["admin", "superadmin"]
export const OPERATOR_PORTAL_ROLES: readonly StaffRole[] = ["operator", "admin", "superadmin"]
export const SUPERADMIN_ONLY: readonly StaffRole[] = ["superadmin"]
