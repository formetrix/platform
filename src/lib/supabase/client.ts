import { createBrowserClient } from "@supabase/ssr";

import { env, requireEnv } from "@/lib/env";

/**
 * Supabase client for use in Client Components (browser context).
 *
 * This project is not connected to a live Supabase instance yet — see
 * `.env.local.example`. Calling this before `NEXT_PUBLIC_SUPABASE_URL`
 * and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set will throw immediately
 * rather than fail silently later.
 *
 * A typed `Database` generic should be added here once a schema exists
 * (via `supabase gen types typescript`); until then the client is
 * intentionally left untyped rather than typed with `any`.
 */
export function createClient() {
  return createBrowserClient(
    requireEnv(env.supabase.url(), "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env.supabase.anonKey(), "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
