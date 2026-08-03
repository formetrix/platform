import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Supabase client for use in Client Components (browser context).
 *
 * Calling this before `NEXT_PUBLIC_SUPABASE_URL` and a public key
 * (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
 * are set will throw immediately (via `getSupabaseConfig`) rather than fail
 * silently later. See `.env.example` and ADR-0037.
 *
 * A typed `Database` generic should be added here once a schema exists
 * (via `supabase gen types typescript`); until then the client is
 * intentionally left untyped rather than typed with `any`.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
