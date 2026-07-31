export type {
  CreatePropertyInput,
  DeferredPropertyStatus,
  GeometryQuality,
  Parcel,
  ParcelGeometryMeta,
  ParcelProvenance,
  Property,
  PropertyParcel,
  PropertyParcelRelationshipType,
  PropertyStatus,
  UpdatePropertyInput,
} from "@/lib/properties/types";
export {
  DEFERRED_PROPERTY_STATUSES,
  GEOMETRY_QUALITY_LEVELS,
  PARCEL_GEOMETRY_SRID,
  PROPERTY_PARCEL_RELATIONSHIP_TYPES,
  PROPERTY_STATUSES,
} from "@/lib/properties/types";

export {
  canTransitionPropertyStatus,
  isPropertyStatus,
  PROPERTY_STATUS_LABELS,
  validatePropertyStatusTransition,
} from "@/lib/properties/status";

export { apnsMatch, normalizeApn } from "@/lib/properties/apn";

export {
  isSameParcelIdentity,
  normalizeParcelIdentity,
  parcelIdentityKey,
  type ParcelIdentityKey,
} from "@/lib/properties/parcel-identity";

export {
  countPrimaryParcels,
  hasAtMostOnePrimary,
  planAttachParcel,
} from "@/lib/properties/primary-parcel";

export {
  expectedParcelSrid,
  looksLikeParcelGeoJson,
  validateLatLngPair,
} from "@/lib/properties/geometry";

export {
  assertPropertyOrganizationAccess,
  propertyBelongsToOrganization,
} from "@/lib/properties/ownership";

export {
  attachParcelToProperty,
  createProperty,
  getPropertyById,
  listOrganizationProperties,
  listPropertyParcels,
  updateProperty,
  type AttachParcelResult,
  type PropertyListResult,
  type PropertyParcelsResult,
  type PropertyResult,
} from "@/lib/properties/access";

export {
  createMemoryParcelStore,
  createPropertyFromParcel,
  createSupabaseParcelStore,
  createTestIngestionDeps,
  importParcel,
  refreshParcel,
  searchParcels,
  type CreatePropertyFromParcelInput,
  type CreatePropertyFromParcelResult,
  type ImportParcelResult,
  type IngestionDependencies,
  type ParcelSearchInput,
  type ParcelStore,
  type RefreshParcelResult,
  type SearchParcelsResult,
} from "@/lib/properties/ingestion";
