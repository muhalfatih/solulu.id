import { type NextRequest } from "next/server";
import { handleRbacProxy } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy Convention for RBAC Enforcement on protected routes.
 */
export async function proxy(request: NextRequest) {
  return handleRbacProxy(request);
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/counselor/:path*"],
};
