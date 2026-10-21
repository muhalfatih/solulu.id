"use server";

import { cookies } from "next/headers";

import { db } from "@/db";
import { counselors } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

/**
 * Sets a demo role cookie for local development and review testing.
 * Enables seamless access to protected routes without requiring live Supabase credentials.
 */
export async function loginAsDemoAction(
  role: "superadmin" | "admin" | "operator" | "counselor"
) {
  const cookieStore = await cookies();
  cookieStore.set("solulu_demo_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  if (role === "counselor") {
    try {
      const [sarah] = await db
        .select({ id: counselors.id })
        .from(counselors)
        .where(sql`${counselors.fullName} ILIKE '%Sarah Annisa%'`)
        .limit(1);

      if (sarah) {
        cookieStore.set("solulu_demo_counselor_id", sarah.id, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
        });
      } else {
        const [anyActive] = await db
          .select({ id: counselors.id })
          .from(counselors)
          .where(eq(counselors.isActive, true))
          .limit(1);
        if (anyActive) {
          cookieStore.set("solulu_demo_counselor_id", anyActive.id, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return { success: true };
}

/**
 * Clears demo session cookie on logout.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("solulu_demo_role");
  cookieStore.delete("solulu_demo_counselor_id");
  return { success: true };
}
