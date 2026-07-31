import { env } from "@/lib/env";

/**
 * Mapbox integration placeholder.
 *
 * The `mapbox-gl` package is intentionally NOT installed yet — no
 * feature in this codebase renders a map, and FORMETRIX.md §21 asks us
 * not to add a dependency before it is needed. This module exists so
 * that:
 *
 *   1. The env var contract (`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`) is
 *      documented in one place, matching `.env.local.example`.
 *   2. Future map components have a single place to check whether
 *      Mapbox is configured, instead of reading `process.env` directly.
 *
 * When the first map feature is built, add `mapbox-gl` (and
 * `@types/mapbox-gl`) and wrap it behind an internal interface per
 * FORMETRIX.md §10 (external integrations should be replaceable).
 */
export function isMapboxConfigured(): boolean {
  return Boolean(env.mapbox.accessToken());
}

export function getMapboxAccessToken(): string | undefined {
  return env.mapbox.accessToken();
}
