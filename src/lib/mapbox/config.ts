import { env } from "@/lib/env";

/**
 * Mapbox integration (FM-0015).
 *
 * Feature code should import helpers from `@/lib/mapbox` rather than
 * reading env or importing `mapbox-gl` directly (FORMETRIX.md §10).
 */
export function isMapboxConfigured(): boolean {
  const token = env.mapbox.accessToken();
  return typeof token === "string" && token.trim().length > 0;
}

export function getMapboxAccessToken(): string | undefined {
  const token = env.mapbox.accessToken();
  if (typeof token !== "string") return undefined;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
