import { type NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_AUTHENTICATED_LANDING,
  isProtectedRoute,
  redirectsAuthenticatedAway,
} from "@/lib/auth/routes";
import { buildSignInRedirectUrl, sanitizeReturnPath } from "@/lib/auth/return-path";
import { SUPABASE_UNCONFIGURED_ERROR } from "@/lib/auth/supabase-unconfigured";
import { updateSession, type SessionUpdateResult } from "@/lib/supabase/middleware";

/**
 * Root middleware (FM-0009):
 * 1. Refresh Supabase Auth session cookies via `updateSession`.
 * 2. Enforce protected-route policy without inventing a fake session when
 *    Supabase is unconfigured.
 * 3. Redirect authenticated visitors away from sign-in / sign-up / forgot-password.
 *    Recovery (`/auth/reset-password`) and the confirm handler are excluded —
 *    those routes are only reachable *with* a session.
 *
 * Matcher excludes static assets so this does not run on every image/font.
 */
export async function middleware(request: NextRequest) {
  const session = await safeUpdateSession(request);
  const { response, configured, userId } = session;
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = Boolean(userId);

  if (isProtectedRoute(pathname)) {
    if (!configured) {
      // Explicit: do not bypass auth. Send to sign-in placeholder with a
      // configuration reason — never treat the visitor as signed in, and never
      // surface this as an unexpected global error.
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.search = "";
      url.searchParams.set("error", SUPABASE_UNCONFIGURED_ERROR);
      url.searchParams.set("next", sanitizeReturnPath(`${pathname}${search}`));
      return NextResponse.redirect(url);
    }

    if (!isAuthenticated) {
      const target = buildSignInRedirectUrl(`${pathname}${search}`);
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  if (redirectsAuthenticatedAway(pathname) && configured && isAuthenticated) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const destination = sanitizeReturnPath(nextParam, DEFAULT_AUTHENTICATED_LANDING);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Preserve any cookies set during session refresh.
  return response;
}

/**
 * Never let session-refresh failures crash the request into global-error.
 * Missing or broken Supabase config is a known state → treat as unconfigured.
 */
async function safeUpdateSession(request: NextRequest): Promise<SessionUpdateResult> {
  try {
    return await updateSession(request);
  } catch {
    return {
      response: NextResponse.next({ request }),
      configured: false,
      userId: null,
    };
  }
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - common public image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
