import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Supabase client for use in Client Components (browser context).
 *
 * This project is not connected to a live Supabase instance yet — see
 * `.env.example`. Calling this before `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set will throw immediately
 * (via `getSupabaseConfig`) rather than fail silently later.
 *
 * A typed `Database` generic should be added here once a schema exists
 * (via `supabase gen types typescript`); until then the client is
 * intentionally left untyped rather than typed with `any`.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
