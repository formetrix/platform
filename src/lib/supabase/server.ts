import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Must be created per-request (it reads the request's
 * cookies) — do not cache or share the returned client across requests.
 *
 * Session refresh is available as a utility in `./middleware.ts` but is
 * not wired into a live `src/middleware.ts` yet (see FM-0009 in
 * management/TICKETS.md — no authentication implementation in this
 * pass, per FORMETRIX.md §23).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` was called from a Server Component, where cookies
          // cannot be written. Safe to ignore as long as middleware is
          // refreshing the session (see ./middleware.ts).
        }
      },
    },
  });
}
