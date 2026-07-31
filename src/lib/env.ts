/**
 * Typed access to environment variables.
 *
 * Values are read lazily (not at import time) so this module can be
 * imported from both client and server code without throwing during
 * build when optional integrations (Supabase, Mapbox) have not been
 * configured yet. Call `requireEnv` only from a code path that
 * genuinely cannot run without the value — that is where a missing
 * variable should surface as a loud, explicit error instead of a
 * silent `undefined`.
 */

function readPublicEnv(name: string): string | undefined {
  return process.env[name];
}

function readServerEnv(name: string): string | undefined {
  if (typeof window !== "undefined") {
    throw new Error(
      `${name} is a server-only environment variable and must not be read from client code.`,
    );
  }
  return process.env[name];
}

export const env = {
  supabase: {
    url: () => readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () => readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    /** Server-only. Bypasses Row Level Security — never expose to the client. */
    serviceRoleKey: () => readServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  mapbox: {
    accessToken: () => readPublicEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"),
  },
  site: {
    url: () => readPublicEnv("NEXT_PUBLIC_SITE_URL"),
  },
} as const;

/**
 * Asserts that a value read from `env` is present, narrowing it to
 * `string`. Throws a descriptive error instead of letting a missing
 * credential fail later as a confusing runtime error.
 */
export function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and fill it in.`,
    );
  }
  return value;
}
