import { PARCEL_GEOMETRY_SRID } from "@/lib/properties/types";

export type LatLngValidation =
  { ok: true; latitude: number; longitude: number } | { ok: false; reason: string };

export function validateLatLngPair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): LatLngValidation | { ok: true; latitude: null; longitude: null } {
  if (latitude == null && longitude == null) {
    return { ok: true, latitude: null, longitude: null };
  }
  if (latitude == null || longitude == null) {
    return { ok: false, reason: "Latitude and longitude must both be set or both omitted." };
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, reason: "Latitude and longitude must be finite numbers." };
  }
  if (latitude < -90 || latitude > 90) {
    return { ok: false, reason: "Latitude must be between -90 and 90." };
  }
  if (longitude < -180 || longitude > 180) {
    return { ok: false, reason: "Longitude must be between -180 and 180." };
  }
  return { ok: true, latitude, longitude };
}

/**
 * Lightweight GeoJSON Polygon/MultiPolygon shape check for app-layer validation
 * before a PostGIS round-trip. Does not prove geometric validity (ST_IsValid).
 */
export function looksLikeParcelGeoJson(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const obj = value as { type?: string; coordinates?: unknown };
  if (obj.type === "Polygon" || obj.type === "MultiPolygon") {
    return Array.isArray(obj.coordinates);
  }
  return false;
}

export function expectedParcelSrid(): number {
  return PARCEL_GEOMETRY_SRID;
}
