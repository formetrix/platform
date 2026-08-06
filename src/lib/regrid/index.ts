export {
  DEFAULT_REGRID_API_BASE_URL,
  getRegridConfig,
  isRegridConfigured,
  REGRID_PROVIDER,
} from "@/lib/regrid/config";
export { createRegridClient, RegridClient } from "@/lib/regrid/client";
export { RegridClientError, type RegridErrorCode, type RegridFailure } from "@/lib/regrid/errors";
export {
  buildProvenanceMetadata,
  extractParcelFeatures,
  geometryToGeoJsonString,
  normalizeRegridFeature,
  normalizeRegridSearchResponse,
} from "@/lib/regrid/normalize";
export type {
  NormalizedParcelCandidate,
  ParcelSearchByAddress,
  ParcelSearchByApn,
  ParcelSearchByCoordinates,
  ParcelSearchQuery,
  RegridClientOptions,
  RegridGeoJsonGeometry,
  RegridParcelFeature,
  RegridParcelFeatureCollection,
  RegridParcelProperties,
  RegridSearchResponse,
} from "@/lib/regrid/types";
