/**
 * Known development / misconfiguration state when protected routes redirect
 * with `?error=supabase_unconfigured`. Not an unexpected runtime failure.
 */

import { SUPABASE_ANON_KEY_ENV, SUPABASE_PUBLISHABLE_KEY_ENV } from "@/lib/supabase/public-key";

export const SUPABASE_UNCONFIGURED_ERROR = "supabase_unconfigured" as const;

/**
 * Public Auth env vars required for session refresh and protected routes.
 * Prefer publishable; legacy anon is accepted as a fallback (ADR-0037).
 */
export const REQUIRED_SUPABASE_AUTH_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  SUPABASE_PUBLISHABLE_KEY_ENV,
] as const;

/** Shown on the configuration screen — names only. */
export const SUPABASE_AUTH_ENV_FALLBACK_NOTE = `Legacy accepted: ${SUPABASE_ANON_KEY_ENV} (if ${SUPABASE_PUBLISHABLE_KEY_ENV} is unset).`;

export function isSupabaseUnconfiguredError(error: string | null | undefined): boolean {
  return error === SUPABASE_UNCONFIGURED_ERROR;
}
