import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Typed outcomes for server-side authenticated-user resolution.
 * Never treat client-supplied ids or cookies as proof without verification.
 */
export type AuthenticatedUserResult =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

/**
 * Resolves the current authenticated user using Supabase Auth's verified
 * `getUser()` call (server round-trip). Safe for Server Components, Route
 * Handlers, and Server Actions.
 *
 * Distinguishes missing configuration from a signed-out visitor so callers
 * can show an explicit setup message without inventing a fake session.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Common "no session" shapes from Auth — treat as signed out, not a crash.
      const soft =
        error.name === "AuthSessionMissingError" ||
        /session missing|not authenticated|invalid jwt/i.test(error.message);
      if (soft) {
        return { status: "unauthenticated" };
      }
      return {
        status: "error",
        message: "Authentication could not be verified. Try again shortly.",
      };
    }

    if (!data.user) {
      return { status: "unauthenticated" };
    }

    return { status: "authenticated", user: data.user };
  } catch {
    return {
      status: "error",
      message: "Authentication could not be verified. Try again shortly.",
    };
  }
}
