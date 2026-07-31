import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Session-refresh utility for Next.js middleware. NOT wired into a live
 * `src/middleware.ts` yet — that is intentionally out of scope here
 * (FORMETRIX.md §23: no authentication implementation in this pass).
 * When FM-0009 (management/TICKETS.md) is picked up, a root
 * `src/middleware.ts` should import and call this, then layer route
 * protection on top; this function only refreshes the session cookie,
 * it does not gate any routes.
 *
 * Follows Supabase's current guidance for the App Router: create a
 * per-request client bound to the request/response cookies, then call
 * `getClaims()` — not `getSession()` — so the token is actually
 * revalidated against the Auth server. Skipping that call is a common
 * cause of users being silently logged out.
 *
 * Next.js 16 renames `middleware.ts` to `proxy.ts` and changes its
 * runtime; this repo is pinned to Next.js 15 (ADR-0001), so this stays
 * a `middleware.ts`-style utility until that migration is planned.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Must be called — this is what actually refreshes the token.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
