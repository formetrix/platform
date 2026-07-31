import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, requireEnv } from "@/lib/env";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Must be created per-request (it reads the request's
 * cookies) — do not cache or share the returned client across requests.
 *
 * Session refresh via middleware is intentionally not wired up yet
 * (see FORMETRIX.md §23 — no authentication implementation in this
 * pass). When auth is implemented, add a `middleware.ts` that calls
 * `supabase.auth.getClaims()` on each request to keep sessions fresh.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv(env.supabase.url(), "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env.supabase.anonKey(), "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component, where cookies
            // cannot be written. Safe to ignore as long as middleware is
            // refreshing the session (see note above).
          }
        },
      },
    },
  );
}
