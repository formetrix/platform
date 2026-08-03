import type { GeometryQuality } from "@/lib/properties/types";
import type { REGRID_PROVIDER } from "@/lib/regrid/config";

/** GeoJSON geometry accepted from Regrid parcel features. */
export type RegridGeoJsonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export type RegridParcelProperties = {
  ll_uuid?: string;
  ll_stable_id?: string;
  ll_gisacre?: number;
  ll_address?: string;
  parcelnumb?: string;
  parcelnumb_no_formatting?: string;
  state_abbr?: string;
  county?: string;
  city?: string;
  cityname?: string;
  address?: string;
  scity?: string;
  szip?: string;
  acres?: number;
  path?: string;
  ll_updated_at?: string;
  [key: string]: unknown;
};

export type RegridParcelFeature = {
  type?: "Feature";
  id?: string | number;
  geometry?: RegridGeoJsonGeometry | null;
  properties?: RegridParcelProperties | null;
};

export type RegridParcelFeatureCollection = {
  type?: "FeatureCollection";
  features?: RegridParcelFeature[];
  results?: number;
  next?: string | null;
};

export type ParcelSearchByAddress = {
  mode: "address";
  query: string;
  limit?: number;
};

export type ParcelSearchByApn = {
  mode: "apn";
  apn: string;
  stateCode?: string;
  county?: string;
  limit?: number;
};

export type ParcelSearchByCoordinates = {
  mode: "coordinates";
  latitude: number;
  longitude: number;
  limit?: number;
};

export type ParcelSearchQuery =
  ParcelSearchByAddress | ParcelSearchByApn | ParcelSearchByCoordinates;

/**
 * Normalized candidate returned by search — not yet persisted.
 * Provenance fields are filled at import/refresh time with retrieval timestamps.
 */
export type NormalizedParcelCandidate = {
  provider: typeof REGRID_PROVIDER;
  providerParcelId: string;
  apn: string | null;
  normalizedApn: string | null;
  county: string | null;
  stateRegion: string | null;
  countryCode: string | null;
  situsAddress: string | null;
  city: string | null;
  postalCode: string | null;
  acreage: number | null;
  /** GeoJSON Polygon or MultiPolygon, or null when Regrid omitted geometry. */
  geometryGeoJson: RegridGeoJsonGeometry | null;
  geometrySource: string;
  /** Provider's last-updated timestamp when known (ISO). */
  sourceUpdatedAt: string | null;
  geometryQuality: GeometryQuality;
  /** Raw Regrid feature snapshot for provenance. */
  rawFeature: RegridParcelFeature;
};

export type RegridClientOptions = {
  /** Override env config (tests). */
  config?: { apiToken: string; baseUrl: string };
  /** Injectable fetch (tests). */
  fetchImpl?: typeof fetch;
  /** Max attempts including the first request. Default 4. */
  maxAttempts?: number;
  /** Base delay for exponential backoff (ms). Default 250. */
  baseDelayMs?: number;
  /** Injectable sleep (tests). */
  sleep?: (ms: number) => Promise<void>;
  /** Wall-clock for Retry-After absolute dates (tests). */
  now?: () => number;
};
