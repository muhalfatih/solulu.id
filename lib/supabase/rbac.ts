export type UserWithRoles = {
  id: string;
  app_metadata?: {
    role?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    role?: string;
    [key: string]: unknown;
  };
} | null;

export type RbacDecision =
  | { type: "allow" }
  | { type: "redirect"; destination: string };

/**
 * Pure decision function for Role-Based Access Control (RBAC).
 *
 * Rules:
 * - `/admin/*`:
 *   - Unauthenticated -> redirect to `/login?redirect=<pathname>`
 *   - role != 'admin' -> redirect to `/counselor/dashboard` (if counselor) or `/unauthorized`
 *   - role == 'admin' -> allow
 *
 * - `/counselor/*`:
 *   - Unauthenticated -> redirect to `/login?redirect=<pathname>`
 *   - role != 'counselor' -> redirect to `/admin/dashboard` (if admin) or `/unauthorized`
 *   - role == 'counselor' -> allow
 */
export function evaluateRbac(
  user: UserWithRoles,
  pathname: string
): RbacDecision {
  const isAdminRoute = pathname.startsWith("/admin");
  const isCounselorRoute = pathname.startsWith("/counselor");
  const isOperatorRoute = pathname.startsWith("/operator");

  if (!isAdminRoute && !isCounselorRoute && !isOperatorRoute) {
    return { type: "allow" };
  }

  // 1. Unauthenticated check
  if (!user) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
    return { type: "redirect", destination: redirectUrl };
  }

  const role = user.app_metadata?.role || user.user_metadata?.role;

  // 2. Admin routes
  if (isAdminRoute) {
    if (role === "admin" || role === "superadmin") {
      return { type: "allow" };
    }
    if (role === "counselor") {
      return { type: "redirect", destination: "/counselor/dashboard" };
    }
    if (role === "operator") {
      return { type: "redirect", destination: "/operator" };
    }
    return { type: "redirect", destination: "/unauthorized" };
  }

  // 3. Counselor routes
  if (isCounselorRoute) {
    if (role === "counselor") {
      return { type: "allow" };
    }
    if (role === "admin" || role === "superadmin") {
      return { type: "redirect", destination: "/admin/dashboard" };
    }
    if (role === "operator") {
      return { type: "redirect", destination: "/operator" };
    }
    return { type: "redirect", destination: "/unauthorized" };
  }

  // 4. Operator routes
  if (isOperatorRoute) {
    if (role === "operator" || role === "admin" || role === "superadmin") {
      return { type: "allow" };
    }
    if (role === "counselor") {
      return { type: "redirect", destination: "/counselor/dashboard" };
    }
    return { type: "redirect", destination: "/unauthorized" };
  }

  return { type: "allow" };
}

/**
 * Checks if a user has the 'superadmin' role.
 */
export function isSuperadmin(user: UserWithRoles): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  return role === "superadmin";
}

/**
 * Checks if a user has 'admin' or 'superadmin' role.
 */
export function isAdminOrSuperadmin(user: UserWithRoles): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  return role === "admin" || role === "superadmin";
}

