/**
 * Property / Parcel persistence types (FM-0011).
 * Workspace UI lives under src/features/properties and consumes these types.
 */

/** FD-0004 Version 1 lifecycle — active DB check constraint values. */
export const PROPERTY_STATUSES = [
  "discovered",
  "evaluating",
  "under_contract",
  "acquired",
  "archived",
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** Deferred lifecycle values (documented only; not writable in V1). */
export const DEFERRED_PROPERTY_STATUSES = [
  "planning",
  "design",
  "permitting",
  "construction",
  "completed",
] as const;

export type DeferredPropertyStatus = (typeof DEFERRED_PROPERTY_STATUSES)[number];

export const PROPERTY_PARCEL_RELATIONSHIP_TYPES = [
  "primary_site",
  "component",
  "adjacent",
  "other",
] as const;

export type PropertyParcelRelationshipType = (typeof PROPERTY_PARCEL_RELATIONSHIP_TYPES)[number];

export const GEOMETRY_QUALITY_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type GeometryQuality = (typeof GEOMETRY_QUALITY_LEVELS)[number];

/** WGS 84 — documented SRID for Formetrix parcel geometry (ADR-0033). */
export const PARCEL_GEOMETRY_SRID = 4326;

export type Property = {
  id: string;
  organizationId: string;
  name: string;
  status: PropertyStatus;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  /** Optional display pin; not authoritative vs parcel geometry. */
  latitude: number | null;
  longitude: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type ParcelProvenance = {
  provider: string;
  providerParcelId: string;
  geometrySource: string | null;
  sourceRetrievedAt: string | null;
  sourceUpdatedAt: string | null;
  rawSourceMetadata: Record<string, unknown>;
  geometryQuality: GeometryQuality | null;
};

export type ParcelGeometryMeta = {
  srid: typeof PARCEL_GEOMETRY_SRID;
  /**
   * Legacy raw geometry payload from PostgREST (often EWKB hex).
   * Prefer `geometryGeoJson` for map rendering (FM-0015).
   */
  geometryWkt: string | null;
  centroidWkt: string | null;
  /** Live GeoJSON Polygon/MultiPolygon from ST_AsGeoJSON when available. */
  geometryGeoJson: Record<string, unknown> | null;
  /** Live GeoJSON Point from ST_AsGeoJSON when available. */
  centroidGeoJson: Record<string, unknown> | null;
  hasGeometry: boolean;
};

export type Parcel = {
  id: string;
  apn: string | null;
  normalizedApn: string | null;
  county: string | null;
  stateRegion: string | null;
  countryCode: string | null;
  situsAddress: string | null;
  /** Acres (US), provider-reported. */
  acreage: number | null;
  provenance: ParcelProvenance;
  geometry: ParcelGeometryMeta;
  createdAt: string;
  updatedAt: string;
};

export type PropertyParcel = {
  id: string;
  propertyId: string;
  parcelId: string;
  relationshipType: PropertyParcelRelationshipType;
  isPrimary: boolean;
  createdAt: string;
};

export type CreatePropertyInput = {
  organizationId: string;
  name: string;
  status?: PropertyStatus;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type UpdatePropertyInput = {
  name?: string;
  status?: PropertyStatus;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  archivedAt?: string | null;
};
