"use server";

import { redirect } from "next/navigation";

import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Clears the Supabase session and returns to sign-in.
 *
 * Runs as a Server Action so `@supabase/ssr` can expire the auth cookies
 * through Next's cookie store — a client-side `signOut()` would clear the
 * browser copy while the server kept accepting the cookie it never saw removed.
 *
 * A failing `signOut` still redirects: leaving someone on the page they were
 * trying to leave is the worse outcome, and middleware re-checks the session on
 * the next request regardless.
 */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Fall through to the redirect.
    }
  }

  redirect(SIGN_IN_PATH);
}
