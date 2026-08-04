import { normalizeApn } from "@/lib/properties/apn";
import { looksLikeParcelGeoJson } from "@/lib/properties/geometry";
import { REGRID_PROVIDER } from "@/lib/regrid/config";
import type {
  NormalizedParcelCandidate,
  RegridGeoJsonGeometry,
  RegridParcelFeature,
  RegridParcelProperties,
} from "@/lib/regrid/types";

/**
 * Key of the candidate group that actually contains parcels in the live v2
 * response. `buildings` and `zoning` are different record types — a building
 * footprint is not a parcel — so they are never read here.
 */
const PARCEL_GROUP_KEY = "parcels";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

/**
 * Flattens a feature's parcel attributes.
 *
 * Live v2 keeps only search metadata on `properties` and moves every parcel
 * attribute into `properties.fields`; legacy responses put everything on
 * `properties`. Merging with `fields` winning reads both without the call sites
 * caring which shape arrived. `ll_uuid` and `path` appear at both levels with
 * the same value, so precedence is not load-bearing for identity.
 */
function parcelAttributes(feature: RegridParcelFeature): RegridParcelProperties {
  const props = feature.properties;
  if (!isRecord(props)) return {};
  const nested = isRecord(props.fields) ? (props.fields as RegridParcelProperties) : null;
  return nested ? { ...props, ...nested } : (props as RegridParcelProperties);
}

function resolveProviderParcelId(
  feature: RegridParcelFeature,
  props: RegridParcelProperties,
): string | null {
  return (
    asString(props.ll_uuid) ??
    asString(props.ll_stable_id) ??
    (feature.id != null ? String(feature.id).trim() || null : null) ??
    asString(props.path)
  );
}

function featuresFromGroup(group: unknown): RegridParcelFeature[] {
  const list = Array.isArray(group)
    ? group
    : isRecord(group) && Array.isArray(group.features)
      ? group.features
      : [];
  return list.filter(isRecord) as RegridParcelFeature[];
}

/**
 * Pulls the parcel features out of any Regrid payload we accept.
 *
 * When the grouped shape is present, the `parcels` group is authoritative: an
 * absent or empty group means zero parcel candidates, never "look in another
 * group". Promoting a building or zoning record into a parcel candidate would
 * manufacture a land record that Regrid never returned (FORMETRIX.md §7).
 */
export function extractParcelFeatures(payload: unknown): RegridParcelFeature[] {
  if (!isRecord(payload)) return [];
  if (PARCEL_GROUP_KEY in payload) {
    return featuresFromGroup(payload[PARCEL_GROUP_KEY]);
  }
  return featuresFromGroup(payload);
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
  feature: RegridParcelFeature | null | undefined,
): NormalizedParcelCandidate | null {
  if (!isRecord(feature)) return null;

  const props = parcelAttributes(feature);
  const providerParcelId = resolveProviderParcelId(feature, props);
  if (!providerParcelId) return null;

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
    // Live v2 names it `state2`; the legacy shape used `state_abbr`.
    stateRegion: asString(props.state2) ?? asString(props.state_abbr),
    countryCode: "US",
    situsAddress,
    // `scity` first: live v2's `city` is a URL slug, not a display city.
    city: asString(props.scity) ?? asString(props.cityname) ?? asString(props.city),
    postalCode: asString(props.szip) ?? asString(props.szip5),
    acreage,
    latitude: asFiniteNumber(props.lat),
    longitude: asFiniteNumber(props.lon),
    geometryGeoJson,
    geometrySource: REGRID_PROVIDER,
    sourceUpdatedAt: asString(props.ll_updated_at),
    geometryQuality: geometryGeoJson ? "high" : "unknown",
    rawFeature: feature,
  };
}

/**
 * Normalizes a Regrid search or lookup payload into parcel candidates.
 *
 * Accepts `unknown` on purpose: this is an external API response and is not
 * trusted to match any declared type (FORMETRIX.md §12). Features that carry no
 * stable provider id are dropped rather than given a synthesized one, so the
 * result is empty only when the provider returned nothing usable.
 */
export function normalizeRegridSearchResponse(payload: unknown): NormalizedParcelCandidate[] {
  const out: NormalizedParcelCandidate[] = [];
  for (const feature of extractParcelFeatures(payload)) {
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
