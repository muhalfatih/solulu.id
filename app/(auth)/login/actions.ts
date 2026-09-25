"use server";

import { cookies } from "next/headers";

/**
 * Sets a demo role cookie for local development and review testing.
 * Enables seamless access to protected routes without requiring live Supabase credentials.
 */
export async function loginAsDemoAction(role: "admin" | "counselor") {
  const cookieStore = await cookies();
  cookieStore.set("solulu_demo_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return { success: true };
}

/**
 * Clears demo session cookie on logout.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("solulu_demo_role");
  return { success: true };
}
