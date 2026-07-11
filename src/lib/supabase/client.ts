"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const { url, anonKey } = getSupabaseBrowserEnv();

  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
