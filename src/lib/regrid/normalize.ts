import { normalizeApn } from "@/lib/properties/apn";
import { looksLikeParcelGeoJson } from "@/lib/properties/geometry";
import { REGRID_PROVIDER } from "@/lib/regrid/config";
import type {
  NormalizedParcelCandidate,
  RegridGeoJsonGeometry,
  RegridParcelFeature,
  RegridParcelFeatureCollection,
  RegridParcelProperties,
} from "@/lib/regrid/types";

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function buildSitusAddress(props: RegridParcelProperties): string | null {
  const composed = [props.saddno, props.saddpref, props.saddstr, props.saddsttyp, props.saddstsuf]
    .map((part) => asString(part))
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return asString(props.ll_address) ?? asString(props.address) ?? (composed || null);
}

function resolveProviderParcelId(feature: RegridParcelFeature): string | null {
  const props = feature.properties ?? {};
  return (
    asString(props.ll_uuid) ??
    asString(props.ll_stable_id) ??
    (feature.id != null ? String(feature.id).trim() || null : null) ??
    asString(props.path)
  );
}

function normalizeGeometry(
  geometry: RegridParcelFeature["geometry"],
): RegridGeoJsonGeometry | null {
  if (!geometry || !looksLikeParcelGeoJson(geometry)) return null;
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    return { type: geometry.type, coordinates: geometry.coordinates };
  }
  return null;
}

/**
 * Map a single Regrid GeoJSON Feature into a Formetrix candidate.
 * Returns null when the feature lacks a stable provider id.
 */
export function normalizeRegridFeature(
  feature: RegridParcelFeature,
): NormalizedParcelCandidate | null {
  const providerParcelId = resolveProviderParcelId(feature);
  if (!providerParcelId) return null;

  const props = feature.properties ?? {};
  const apn = asString(props.parcelnumb) ?? asString(props.parcelnumb_no_formatting);
  const acreage = asFiniteNumber(props.ll_gisacre) ?? asFiniteNumber(props.acres);
  const geometryGeoJson = normalizeGeometry(feature.geometry ?? null);
  const situsAddress = buildSitusAddress(props);

  return {
    provider: REGRID_PROVIDER,
    providerParcelId,
    apn,
    normalizedApn: normalizeApn(apn),
    county: asString(props.county),
    stateRegion: asString(props.state_abbr),
    countryCode: "US",
    situsAddress,
    city: asString(props.city) ?? asString(props.cityname) ?? asString(props.scity),
    postalCode: asString(props.szip),
    acreage,
    geometryGeoJson,
    geometrySource: REGRID_PROVIDER,
    sourceUpdatedAt: asString(props.ll_updated_at),
    geometryQuality: geometryGeoJson ? "high" : "unknown",
    rawFeature: feature,
  };
}

export function normalizeRegridFeatureCollection(
  collection: RegridParcelFeatureCollection | null | undefined,
): NormalizedParcelCandidate[] {
  const features = collection?.features ?? [];
  const out: NormalizedParcelCandidate[] = [];
  for (const feature of features) {
    const normalized = normalizeRegridFeature(feature);
    if (normalized) out.push(normalized);
  }
  return out;
}

/** MultiPolygon GeoJSON string for PostGIS ST_GeomFromGeoJSON, or null. */
export function geometryToGeoJsonString(geometry: RegridGeoJsonGeometry | null): string | null {
  if (!geometry) return null;
  if (geometry.type === "Polygon") {
    return JSON.stringify({
      type: "MultiPolygon",
      coordinates: [geometry.coordinates],
    });
  }
  return JSON.stringify({
    type: "MultiPolygon",
    coordinates: geometry.coordinates,
  });
}

export function buildProvenanceMetadata(
  candidate: NormalizedParcelCandidate,
): Record<string, unknown> {
  return {
    provider: REGRID_PROVIDER,
    providerParcelId: candidate.providerParcelId,
    feature: candidate.rawFeature,
  };
}
