import { looksLikeParcelGeoJson } from "@/lib/properties/geometry";
import type { GeometryQuality } from "@/lib/properties/types";

/** Lon/lat pair for Mapbox ([longitude, latitude]). */
export type LngLat = [number, number];

/** Axis-aligned bounds: [west, south, east, north]. */
export type LngLatBoundsTuple = [number, number, number, number];

export type ParcelMapGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

/**
 * Normalize unknown PostGIS/GeoJSON payloads into a Mapbox-ready Polygon/MultiPolygon.
 * Accepts objects or JSON strings. Rejects EWKB hex and other non-GeoJSON forms.
 */
export function parseParcelGeoJson(value: unknown): ParcelMapGeometry | null {
  if (value == null) return null;

  let candidate: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    try {
      candidate = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }

  if (!looksLikeParcelGeoJson(candidate)) return null;
  const obj = candidate as { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  return { type: obj.type, coordinates: obj.coordinates };
}

/** Parse a GeoJSON Point into [lng, lat], or null. */
export function parsePointGeoJson(value: unknown): LngLat | null {
  if (value == null) return null;

  let candidate: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
      candidate = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }

  if (!candidate || typeof candidate !== "object") return null;
  const obj = candidate as { type?: string; coordinates?: unknown };
  if (obj.type !== "Point" || !Array.isArray(obj.coordinates) || obj.coordinates.length < 2) {
    return null;
  }
  const lng = Number(obj.coordinates[0]);
  const lat = Number(obj.coordinates[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lng, lat];
}

function extendBounds(
  bounds: LngLatBoundsTuple | null,
  lng: number,
  lat: number,
): LngLatBoundsTuple {
  if (!bounds) return [lng, lat, lng, lat];
  return [
    Math.min(bounds[0], lng),
    Math.min(bounds[1], lat),
    Math.max(bounds[2], lng),
    Math.max(bounds[3], lat),
  ];
}

function walkCoords(coords: unknown, onPoint: (lng: number, lat: number) => void): void {
  if (!Array.isArray(coords) || coords.length === 0) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    onPoint(coords[0], coords[1]);
    return;
  }
  for (const child of coords) walkCoords(child, onPoint);
}

/** Compute fit bounds for a parcel Polygon/MultiPolygon. */
export function boundsFromParcelGeometry(geometry: ParcelMapGeometry): LngLatBoundsTuple | null {
  let bounds: LngLatBoundsTuple | null = null;
  walkCoords(geometry.coordinates, (lng, lat) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    bounds = extendBounds(bounds, lng, lat);
  });
  return bounds;
}

export function markerFromPropertyOrCentroid(options: {
  latitude: number | null;
  longitude: number | null;
  centroid: unknown;
}): LngLat | null {
  if (
    options.latitude != null &&
    options.longitude != null &&
    Number.isFinite(options.latitude) &&
    Number.isFinite(options.longitude)
  ) {
    return [options.longitude, options.latitude];
  }
  return parsePointGeoJson(options.centroid);
}

/** Honest precision copy — never oversell provider quality. */
export function geometryPrecisionCaption(quality: GeometryQuality | null | undefined): string {
  switch (quality) {
    case "high":
      return "Source boundary (provider quality: high). Display only — not a survey plat.";
    case "medium":
      return "Source boundary (provider quality: medium). Approximate — not survey-grade.";
    case "low":
      return "Source boundary (provider quality: low). Low confidence — verify before relying.";
    case "unknown":
      return "Source boundary (provider quality: unknown). Precision not certified.";
    default:
      return "Source parcel boundary (EPSG:4326). Not a certified survey.";
  }
}

export function toMapFeatureCollection(
  geometry: ParcelMapGeometry,
  properties: Record<string, unknown> = {},
): GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const geo: GeoJSON.Polygon | GeoJSON.MultiPolygon =
    geometry.type === "Polygon"
      ? { type: "Polygon", coordinates: geometry.coordinates as GeoJSON.Polygon["coordinates"] }
      : {
          type: "MultiPolygon",
          coordinates: geometry.coordinates as GeoJSON.MultiPolygon["coordinates"],
        };

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties,
        geometry: geo,
      },
    ],
  };
}
