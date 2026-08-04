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

/** Just the shape these helpers read — `process.env` satisfies it. */
export type EnvBag = Record<string, string | undefined>;

function readTrimmed(envBag: EnvBag, name: string): string | undefined {
  const raw = envBag[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Live snapshot of just the two keys, read by **static** member access.
 *
 * Next.js substitutes `process.env.NEXT_PUBLIC_X` textually when it builds a
 * client bundle; a computed lookup like `process.env[name]` is left alone and
 * evaluates to `undefined` in the browser. Reading them statically here is what
 * lets the browser Supabase client (and `isSupabaseConfigured()` inside a
 * Client Component) see the values at all. Rebuilt per call, so the Node tests
 * that mutate `process.env` between assertions still observe their changes.
 */
function defaultPublicKeyEnv(): EnvBag {
  return {
    [SUPABASE_PUBLISHABLE_KEY_ENV]: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    [SUPABASE_ANON_KEY_ENV]: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Returns the resolved public key, or `undefined` if neither env var is set.
 * Publishable wins when both are present.
 */
export function resolveSupabasePublicKey(
  envBag: EnvBag = defaultPublicKeyEnv(),
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
