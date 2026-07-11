import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always mutate cookies. Middleware refreshes
          // sessions before protected pages run.
        }
      },
    },
  });
}
