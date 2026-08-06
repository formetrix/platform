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
  /** Legacy shape's state code. Live v2 uses `state2`. */
  state_abbr?: string;
  /** Live v2 state code (e.g. "TX"). */
  state2?: string;
  county?: string;
  /**
   * In live v2 this is a URL slug ("northeast-dallas"), not a display city —
   * `scity` carries the real situs city. Legacy responses used it as the city.
   */
  city?: string;
  cityname?: string;
  address?: string;
  /** Situs city (live v2). */
  scity?: string;
  szip?: string;
  szip5?: string;
  saddno?: string;
  saddpref?: string;
  saddstr?: string;
  saddsttyp?: string;
  saddstsuf?: string;
  acres?: number;
  /** Point coordinates; live v2 returns them as strings. */
  lat?: string | number;
  lon?: string | number;
  path?: string;
  ll_updated_at?: string;
  /**
   * Live v2 nests every parcel attribute one level down under `fields`, keeping
   * only search metadata (`ll_uuid`, `path`, `headline`, `score`, `addresses`,
   * `context`) at the top level. Legacy responses had no `fields` at all.
   */
  fields?: RegridParcelProperties | null;
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

/**
 * Live v2 search/lookup payload: candidate groups keyed by record type, each a
 * FeatureCollection. `buildings` and `zoning` describe different things than a
 * parcel and are never normalized into parcel candidates.
 */
export type RegridSearchResponse = {
  parcels?: RegridParcelFeatureCollection | RegridParcelFeature[] | null;
  buildings?: unknown;
  zoning?: unknown;
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
  /** Provider point coordinates when supplied; null when Regrid omitted them. */
  latitude: number | null;
  longitude: number | null;
  /**
   * Provider's own match confidence for a search hit (higher is better).
   * Null for lookups by id, which are exact and carry no score.
   */
  matchScore: number | null;
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
