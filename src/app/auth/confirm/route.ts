import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { resolvePostAuthDestination } from "@/lib/auth/account-context";
import { RESET_PASSWORD_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Turns an emailed Supabase link into a real session (FM-0006A).
 *
 * Handles both link shapes so the flow does not depend on which email template
 * the project has configured:
 *  - `code`       — PKCE. Supabase's default redirect after `/auth/v1/verify`.
 *  - `token_hash` — the shape produced by a template using `{{ .TokenHash }}`.
 *
 * Runs as a Route Handler because this is where `@supabase/ssr` can write the
 * session cookies onto a real response. Failures always land on sign-in with a
 * reason attached rather than on a blank page.
 */

const RECOVERY_TYPES: ReadonlySet<string> = new Set(["recovery"]);

function failureRedirect(request: NextRequest, code: string, description?: string | null): URL {
  const url = new URL(SIGN_IN_PATH, request.url);
  url.searchParams.set("error", code);
  if (description) url.searchParams.set("error_description", description);
  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const providerError = searchParams.get("error") ?? searchParams.get("error_code");
  if (providerError) {
    return NextResponse.redirect(
      failureRedirect(request, providerError, searchParams.get("error_description")),
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(failureRedirect(request, "supabase_unconfigured"));
  }

  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (!code && !tokenHash) {
    return NextResponse.redirect(failureRedirect(request, "missing_token"));
  }

  const supabase = await createClient();
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        type: (type ?? "email") as EmailOtpType,
        token_hash: tokenHash,
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    return NextResponse.redirect(failureRedirect(request, "verification_failed", error.message));
  }

  // Recovery is routed by `type`, never by `next`: return-path validation
  // rejects every /auth/* path, so a recovery link cannot smuggle its
  // destination through the same channel a normal return path uses.
  if (RECOVERY_TYPES.has(type ?? "")) {
    return NextResponse.redirect(new URL(RESET_PASSWORD_PATH, request.url));
  }

  const destination = await resolvePostAuthDestination(
    sanitizeReturnPath(searchParams.get("next")),
  );
  return NextResponse.redirect(new URL(destination, request.url));
}
