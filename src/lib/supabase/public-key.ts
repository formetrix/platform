/**
 * Resolves the public Supabase API key for browser/SSR clients.
 *
 * Prefer the current official name (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
 * Accept legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` when the preferred name is
 * unset (ADR-0037). Do not require both; do not invent a third convention.
 */

export const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" as const;
export const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY" as const;

export type SupabasePublicKeySource = "publishable" | "anon";

export type ResolvedSupabasePublicKey = {
  key: string;
  source: SupabasePublicKeySource;
  /** Env var name that supplied the value (for errors / docs only — never the value). */
  envName: typeof SUPABASE_PUBLISHABLE_KEY_ENV | typeof SUPABASE_ANON_KEY_ENV;
};

function readTrimmed(envBag: NodeJS.ProcessEnv, name: string): string | undefined {
  const raw = envBag[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Returns the resolved public key, or `undefined` if neither env var is set.
 * Publishable wins when both are present.
 */
export function resolveSupabasePublicKey(
  envBag: NodeJS.ProcessEnv = process.env,
): ResolvedSupabasePublicKey | undefined {
  const publishable = readTrimmed(envBag, SUPABASE_PUBLISHABLE_KEY_ENV);
  if (publishable) {
    return {
      key: publishable,
      source: "publishable",
      envName: SUPABASE_PUBLISHABLE_KEY_ENV,
    };
  }

  const anon = readTrimmed(envBag, SUPABASE_ANON_KEY_ENV);
  if (anon) {
    return {
      key: anon,
      source: "anon",
      envName: SUPABASE_ANON_KEY_ENV,
    };
  }

  return undefined;
}

/** Human-readable missing-key hint (names only — never values). */
export function missingSupabasePublicKeyMessage(): string {
  return `${SUPABASE_PUBLISHABLE_KEY_ENV} (or legacy ${SUPABASE_ANON_KEY_ENV})`;
}
