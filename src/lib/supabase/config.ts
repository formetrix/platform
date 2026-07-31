import { env } from "@/lib/env";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates that the environment variables Supabase needs are present,
 * throwing one clear, aggregated error naming everything missing —
 * instead of the client and server factories each throwing separately
 * on the first missing variable they happen to check.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = env.supabase.url();
  const anonKey = env.supabase.anonKey();

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missing.join(", ")}. Copy .env.example to .env.local and fill them in.`,
    );
  }

  return { url: url!, anonKey: anonKey! };
}

/**
 * Whether Supabase environment variables are present, without throwing.
 * Use this to skip Supabase calls gracefully (e.g. in middleware) before
 * a real project is connected, rather than crashing every request.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url() && env.supabase.anonKey());
}
