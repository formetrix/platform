/**
 * Known development / misconfiguration state when protected routes redirect
 * with `?error=supabase_unconfigured`. Not an unexpected runtime failure.
 */

export const SUPABASE_UNCONFIGURED_ERROR = "supabase_unconfigured" as const;

/** Public Auth env vars required for session refresh and protected routes. */
export const REQUIRED_SUPABASE_AUTH_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function isSupabaseUnconfiguredError(error: string | null | undefined): boolean {
  return error === SUPABASE_UNCONFIGURED_ERROR;
}
