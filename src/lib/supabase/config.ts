import { env } from "@/lib/env";
import {
  missingSupabasePublicKeyMessage,
  resolveSupabasePublicKey,
} from "@/lib/supabase/public-key";

export interface SupabaseConfig {
  url: string;
  /** Public API key (publishable or legacy anon). */
  anonKey: string;
  /** Which env var supplied the public key. */
  publicKeySource: "publishable" | "anon";
}

/**
 * Validates that the environment variables Supabase needs are present,
 * throwing one clear, aggregated error naming everything missing —
 * instead of the client and server factories each throwing separately
 * on the first missing variable they happen to check.
 *
 * Never includes secret values in the error message.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = env.supabase.url();
  const resolved = resolveSupabasePublicKey();

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!resolved) missing.push(missingSupabasePublicKeyMessage());

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missing.join(", ")}. Copy .env.example to .env.local and fill them in.`,
    );
  }

  return {
    url: url!,
    anonKey: resolved!.key,
    publicKeySource: resolved!.source,
  };
}

/**
 * Whether Supabase environment variables are present, without throwing.
 * Use this to skip Supabase calls gracefully (e.g. in middleware) before
 * a real project is connected, rather than crashing every request.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url() && resolveSupabasePublicKey());
}

/**
 * Public config shape safe to reason about in tests — never includes
 * `SUPABASE_SERVICE_ROLE_KEY`.
 */
export function getPublicSupabaseEnvNames(): readonly string[] {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ] as const;
}
