import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
