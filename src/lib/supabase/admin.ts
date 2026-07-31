import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Service-role Supabase client (server-only).
 *
 * Bypasses RLS — use only for trusted ingestion paths (e.g. parcel upsert).
 * Never import from Client Components or expose the key to the browser.
 */
export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(env.supabase.serviceRoleKey());
}

export function createServiceRoleClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("createServiceRoleClient() must only be called on the server.");
  }

  const { url } = getSupabaseConfig();
  const serviceRoleKey = env.supabase.serviceRoleKey();
  if (!serviceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill it in.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
