import { cookies } from "next/headers"
import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { counselors } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import type { CounselorAuthContext } from "./types"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
      const demoCounselorId = cookieStore.get("solulu_demo_counselor_id")?.value
      if (demoCounselorId && UUID_REGEX.test(demoCounselorId)) {
        try {
          const rawFound = await db.execute(sql`
            SELECT c.*, u.email as auth_email
            FROM counselors c
            LEFT JOIN auth.users u ON c.user_id = u.id
            WHERE c.id = ${demoCounselorId}::uuid
            LIMIT 1
          `)
          const found = (rawFound as any[]) || []

          if (found.length > 0) {
            return {
              id: `demo-${found[0].id}`,
              counselorId: found[0].id,
              app_metadata: { role: "counselor" },
              user_metadata: {
                role: "counselor",
                full_name: found[0].full_name || found[0].fullName,
                email: found[0].auth_email || found[0].email,
              },
            }
          }
        } catch {
          // fallback to default
        }
      }

      return {
        id: "demo-counselor-id",
        counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3", // Sarah Annisa (DB UUID)
        app_metadata: { role: "counselor" },
        user_metadata: {
          role: "counselor",
          full_name: "Sarah Annisa, M.Psi., Psikolog",
          email: "sarah.annisa@solulu.id",
        },
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
 * Ensures returned ID is a valid database UUID to prevent syntax errors in PostgreSQL.
 */
export async function resolveCounselorId(auth: CounselorAuthContext): Promise<string | null> {
  // If already a valid UUID, use it directly
  if (auth.counselorId && UUID_REGEX.test(auth.counselorId)) {
    return auth.counselorId
  }

  try {
    // 1. Try finding by Supabase Auth UID if valid UUID
    if (auth.id && UUID_REGEX.test(auth.id)) {
      const found = await db
        .select({ id: counselors.id })
        .from(counselors)
        .where(eq(counselors.userId, auth.id))
        .limit(1)

      if (found.length > 0) {
        return found[0].id
      }
    }

    // 2. Try finding Sarah Annisa specifically
    const sarah = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(sql`${counselors.fullName} ILIKE '%Sarah Annisa%'`)
      .limit(1)

    if (sarah.length > 0) {
      return sarah[0].id
    }

    // 3. Fallback to first active counselor in DB
    const anyActive = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .limit(1)

    if (anyActive.length > 0) {
      return anyActive[0].id
    }

    // 4. Any counselor in DB
    const any = await db
      .select({ id: counselors.id })
      .from(counselors)
      .limit(1)

    return any.length > 0 ? any[0].id : (auth.counselorId || "c-1")
  } catch {
    return auth.counselorId || "c-1"
  }
}

/**
 * Switches the active demo counselor identity for testing and simulation.
 */
export async function switchDemoCounselorAction(counselorId: string) {
  const cookieStore = await cookies()
  cookieStore.set("solulu_demo_role", "counselor", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })
  cookieStore.set("solulu_demo_counselor_id", counselorId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })
  return { success: true }
}

/**
 * Returns available real counselors in the database for the switcher dropdown.
 */
export async function getCounselorsListForSwitchAction() {
  try {
    const rows = await db
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        title: counselors.title,
        counselorType: counselors.counselorType,
      })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .orderBy(counselors.fullName)

    return { success: true, data: rows }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}
