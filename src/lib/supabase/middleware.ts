import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export type SessionUpdateResult = {
  response: NextResponse;
  /** False when Supabase env vars are missing — no Auth calls were made. */
  configured: boolean;
  /**
   * Verified Auth subject (`sub`) from `getClaims()` when a session exists.
   * Null when unconfigured, signed out, or claims could not be verified.
   */
  userId: string | null;
};

/**
 * Session-refresh utility for Next.js middleware.
 *
 * Follows Supabase's current App Router guidance: create a per-request
 * client bound to request/response cookies, then call `getClaims()` — not
 * `getSession()` — so the access token is revalidated. The returned
 * `response` must be returned from middleware so refreshed cookies are
 * preserved on the client.
 *
 * This function refreshes the session; route gating is layered by
 * `src/middleware.ts` using the returned `userId` / `configured` flags.
 *
 * Next.js 16 renames `middleware.ts` to `proxy.ts`; this repo is pinned to
 * Next.js 15 (ADR-0001), so the root entry remains `src/middleware.ts`.
 */
export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return { response: supabaseResponse, configured: false, userId: null };
  }

  try {
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

    // Must be called — this is what actually refreshes / revalidates the token.
    const { data, error } = await supabase.auth.getClaims();
    const userId =
      !error && data?.claims && typeof data.claims.sub === "string" ? data.claims.sub : null;

    return { response: supabaseResponse, configured: true, userId };
  } catch {
    // Invalid/partial credentials must not throw into global-error.tsx.
    // Callers treat `configured: false` as the known unconfigured Auth state.
    return {
      response: NextResponse.next({ request }),
      configured: false,
      userId: null,
    };
  }
}
