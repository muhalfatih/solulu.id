import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { counselors } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import type { CounselorAuthContext } from "./types"

/**
 * Resolves the authenticated counselor user from Supabase Auth or demo cookie.
 */
export async function getAuthenticatedCounselor(
  customUser?: CounselorAuthContext | null,
  options?: { allowAdmin?: boolean }
): Promise<CounselorAuthContext | null> {
  if (customUser !== undefined) {
    if (!customUser) return null
    const role = customUser.app_metadata?.role || customUser.user_metadata?.role
    if (role === "counselor") return customUser
    if (options?.allowAdmin && role === "admin") return customUser
    return null
  }

  try {
    const cookieStore = await cookies()
    const demoRole = cookieStore.get("solulu_demo_role")?.value
    if (demoRole === "counselor") {
      return {
        id: "demo-counselor-id",
        counselorId: "c-1", // Default demo counselor (Sarah Annisa)
        app_metadata: { role: "counselor" },
        user_metadata: { role: "counselor", full_name: "Sarah Annisa, M.Psi., Psikolog" },
      }
    }
    if (options?.allowAdmin && demoRole === "admin") {
      return {
        id: "demo-admin-id",
        app_metadata: { role: "admin" },
        user_metadata: { role: "admin", full_name: "Super Admin" },
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null
    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role === "counselor" || (options?.allowAdmin && role === "admin")) {
      return {
        id: user.id,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Resolves the database counselor record ID for the authenticated user.
 */
export async function resolveCounselorId(auth: CounselorAuthContext): Promise<string | null> {
  if (auth.counselorId) {
    return auth.counselorId
  }

  try {
    const found = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(eq(counselors.userId, auth.id))
      .limit(1)

    if (found.length > 0) {
      return found[0].id
    }

    // Fallback if counselor profile exists in DB
    const anyCounselor = await db
      .select({ id: counselors.id })
      .from(counselors)
      .limit(1)

    return anyCounselor.length > 0 ? anyCounselor[0].id : "c-1"
  } catch {
    return "c-1"
  }
}
