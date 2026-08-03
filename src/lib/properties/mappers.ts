import { isPropertyStatus } from "@/lib/properties/status";
import type {
  GeometryQuality,
  Parcel,
  Property,
  PropertyParcel,
  PropertyParcelRelationshipType,
  PropertyStatus,
} from "@/lib/properties/types";
import {
  GEOMETRY_QUALITY_LEVELS,
  PARCEL_GEOMETRY_SRID,
  PROPERTY_PARCEL_RELATIONSHIP_TYPES,
} from "@/lib/properties/types";

type PropertyRow = {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ParcelRow = {
  id: string;
  provider: string;
  provider_parcel_id: string;
  apn: string | null;
  normalized_apn: string | null;
  county: string | null;
  state_region: string | null;
  country_code: string | null;
  situs_address: string | null;
  acreage: number | string | null;
  geometry: string | null;
  centroid: string | null;
  geometry_source: string | null;
  source_retrieved_at: string | null;
  source_updated_at: string | null;
  raw_source_metadata: Record<string, unknown> | null;
  geometry_quality: string | null;
  created_at: string;
  updated_at: string;
};

type PropertyParcelRow = {
  id: string;
  property_id: string;
  parcel_id: string;
  relationship_type: string;
  is_primary: boolean;
  created_at: string;
};

function isRelationshipType(value: string): value is PropertyParcelRelationshipType {
  return (PROPERTY_PARCEL_RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

function isGeometryQuality(value: string): value is GeometryQuality {
  return (GEOMETRY_QUALITY_LEVELS as readonly string[]).includes(value);
}

export function mapProperty(row: PropertyRow): Property | null {
  if (!isPropertyStatus(row.status)) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    status: row.status as PropertyStatus,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export function mapParcel(row: ParcelRow): Parcel {
  const acreage =
    row.acreage == null
      ? null
      : typeof row.acreage === "number"
        ? row.acreage
        : Number(row.acreage);

  return {
    id: row.id,
    apn: row.apn,
    normalizedApn: row.normalized_apn,
    county: row.county,
    stateRegion: row.state_region,
    countryCode: row.country_code,
    situsAddress: row.situs_address,
    acreage: Number.isFinite(acreage as number) ? (acreage as number) : null,
    provenance: {
      provider: row.provider,
      providerParcelId: row.provider_parcel_id,
      geometrySource: row.geometry_source,
      sourceRetrievedAt: row.source_retrieved_at,
      sourceUpdatedAt: row.source_updated_at,
      rawSourceMetadata: row.raw_source_metadata ?? {},
      geometryQuality:
        row.geometry_quality && isGeometryQuality(row.geometry_quality)
          ? row.geometry_quality
          : null,
    },
    geometry: {
      srid: PARCEL_GEOMETRY_SRID,
      geometryWkt: row.geometry,
      centroidWkt: row.centroid,
      hasGeometry: Boolean(row.geometry),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPropertyParcel(row: PropertyParcelRow): PropertyParcel | null {
  if (!isRelationshipType(row.relationship_type)) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    parcelId: row.parcel_id,
    relationshipType: row.relationship_type,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}
