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

  if (!isAdminRoute && !isCounselorRoute) {
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
    if (role === "admin") {
      return { type: "allow" };
    }
    if (role === "counselor") {
      return { type: "redirect", destination: "/counselor/dashboard" };
    }
    return { type: "redirect", destination: "/unauthorized" };
  }

  // 3. Counselor routes
  if (isCounselorRoute) {
    if (role === "counselor") {
      return { type: "allow" };
    }
    if (role === "admin") {
      return { type: "redirect", destination: "/admin/dashboard" };
    }
    return { type: "redirect", destination: "/unauthorized" };
  }

  return { type: "allow" };
}
