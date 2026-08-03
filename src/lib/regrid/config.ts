import { env } from "@/lib/env";

export const REGRID_PROVIDER = "regrid" as const;

export const DEFAULT_REGRID_API_BASE_URL = "https://app.regrid.com";

export type RegridConfig = {
  apiToken: string;
  baseUrl: string;
};

/**
 * Whether Regrid credentials are present, without throwing.
 * Search/import services return `unconfigured` when this is false.
 */
export function isRegridConfigured(): boolean {
  return Boolean(env.regrid.apiToken());
}

/**
 * Validates Regrid environment variables, throwing one clear error naming
 * everything missing. Server-only — never call from client components.
 */
export function getRegridConfig(): RegridConfig {
  const apiToken = env.regrid.apiToken();
  const baseUrl = (env.regrid.apiBaseUrl() ?? DEFAULT_REGRID_API_BASE_URL).replace(/\/$/, "");

  if (!apiToken) {
    throw new Error(
      "Missing required environment variable: REGRID_API_TOKEN. Copy .env.example to .env.local and fill it in.",
    );
  }

  return { apiToken, baseUrl };
}
