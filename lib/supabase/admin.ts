import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a privileged Supabase Admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively on the server for backend administration tasks (e.g. inviting counselors).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
