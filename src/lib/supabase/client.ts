import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

export function createClient(): SupabaseClient<Database> {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient<Database>(url, key);
}
