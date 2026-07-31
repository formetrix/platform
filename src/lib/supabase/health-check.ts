import { env } from "@/lib/env";

export interface SupabaseHealthCheckResult {
  ok: boolean;
  status?: number;
  detail?: string;
}

/**
 * Confirms Supabase is reachable by calling the Auth service's
 * documented health endpoint (`GET {url}/auth/v1/health`), which
 * returns GoTrue version info. This touches no tables and requires no
 * session — only a valid project URL and API key — so it's safe to
 * call before any schema exists.
 *
 * NOT called automatically anywhere in this codebase. Call it manually
 * (e.g. from a temporary debug route, a script, or a terminal REPL)
 * once real credentials are in `.env.local`, to confirm the connection
 * works before building anything on top of it.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthCheckResult> {
  const url = env.supabase.url();
  const anonKey = env.supabase.anonKey();

  if (!url || !anonKey) {
    return {
      ok: false,
      detail: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.",
    };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Unknown network error.",
    };
  }
}
