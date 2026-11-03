"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Ends the Supabase session (clears the auth cookies).
 */
export async function logoutAction() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("[LOGOUT] Gagal mengakhiri sesi Supabase:", error)
    return { success: false }
  }
  return { success: true }
}
