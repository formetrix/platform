import type {
  ParcelZoningOverview,
  ParcelZoningProvenance,
  ZoningDimensionalRegulations,
  ZoningDistrict,
  ZoningLandUse,
  ZoningLandUsePermission,
  ZoningMunicipality,
  ZoningOverlay,
} from "@/lib/zoning/types";
import { ZONING_LAND_USE_PERMISSIONS } from "@/lib/zoning/types";

type MunicipalityRow = {
  id: string;
  name: string;
  state_region: string | null;
  country_code: string | null;
  provider: string;
  provider_municipality_id: string;
};

type DistrictRow = {
  id: string;
  municipality_id: string;
  code: string;
  name: string | null;
  description: string | null;
  provider: string;
  provider_district_id: string;
};

type OverlayRow = {
  id: string;
  municipality_id: string;
  code: string;
  name: string | null;
  description: string | null;
  provider: string;
  provider_overlay_id: string;
};

type LandUseRow = {
  id: string;
  district_id: string;
  use_label: string;
  permission: string;
  notes: string | null;
};

type DimensionalRow = {
  id: string;
  district_id: string;
  max_far: number | string | null;
  max_density_units_per_acre: number | string | null;
  max_height_ft: number | string | null;
  max_lot_coverage_pct: number | string | null;
  setback_front_ft: number | string | null;
  setback_side_ft: number | string | null;
  setback_rear_ft: number | string | null;
  parking_requirement_text: string | null;
  notes: string | null;
};

type ParcelZoningRow = {
  id: string;
  parcel_id: string;
  district_id: string;
  is_primary: boolean;
  provider: string;
  provider_record_id: string;
  source_retrieved_at: string | null;
  source_updated_at: string | null;
  raw_source_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function asNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isPermission(value: string): value is ZoningLandUsePermission {
  return (ZONING_LAND_USE_PERMISSIONS as readonly string[]).includes(value);
}

export function mapMunicipality(row: MunicipalityRow): ZoningMunicipality {
  return {
    id: row.id,
    name: row.name,
    stateRegion: row.state_region,
    countryCode: row.country_code,
    provider: row.provider,
    providerMunicipalityId: row.provider_municipality_id,
  };
}

export function mapDistrict(row: DistrictRow): ZoningDistrict {
  return {
    id: row.id,
    municipalityId: row.municipality_id,
    code: row.code,
    name: row.name,
    description: row.description,
    provider: row.provider,
    providerDistrictId: row.provider_district_id,
  };
}

export function mapOverlay(row: OverlayRow): ZoningOverlay {
  return {
    id: row.id,
    municipalityId: row.municipality_id,
    code: row.code,
    name: row.name,
    description: row.description,
    provider: row.provider,
    providerOverlayId: row.provider_overlay_id,
  };
}

export function mapLandUse(row: LandUseRow): ZoningLandUse | null {
  if (!isPermission(row.permission)) return null;
  return {
    id: row.id,
    districtId: row.district_id,
    useLabel: row.use_label,
    permission: row.permission,
    notes: row.notes,
  };
}

export function mapDimensional(row: DimensionalRow): ZoningDimensionalRegulations {
  return {
    id: row.id,
    districtId: row.district_id,
    maxFar: asNumber(row.max_far),
    maxDensityUnitsPerAcre: asNumber(row.max_density_units_per_acre),
    maxHeightFt: asNumber(row.max_height_ft),
    maxLotCoveragePct: asNumber(row.max_lot_coverage_pct),
    setbackFrontFt: asNumber(row.setback_front_ft),
    setbackSideFt: asNumber(row.setback_side_ft),
    setbackRearFt: asNumber(row.setback_rear_ft),
    parkingRequirementText: row.parking_requirement_text,
    notes: row.notes,
  };
}

export function mapProvenance(row: ParcelZoningRow): ParcelZoningProvenance {
  return {
    provider: row.provider,
    providerRecordId: row.provider_record_id,
    sourceRetrievedAt: row.source_retrieved_at,
    sourceUpdatedAt: row.source_updated_at,
    rawSourceMetadata: row.raw_source_metadata ?? {},
  };
}

export function assembleParcelZoningOverview(options: {
  link: ParcelZoningRow;
  municipality: MunicipalityRow;
  district: DistrictRow;
  overlays: OverlayRow[];
  landUses: LandUseRow[];
  dimensional: DimensionalRow | null;
}): ParcelZoningOverview {
  const uses = options.landUses.map(mapLandUse).filter((u): u is ZoningLandUse => u != null);

  return {
    id: options.link.id,
    parcelId: options.link.parcel_id,
    isPrimary: options.link.is_primary,
    municipality: mapMunicipality(options.municipality),
    district: mapDistrict(options.district),
    overlays: options.overlays.map(mapOverlay),
    permittedUses: uses.filter((u) => u.permission === "permitted"),
    prohibitedUses: uses.filter((u) => u.permission === "prohibited"),
    conditionalUses: uses.filter((u) => u.permission === "conditional"),
    dimensional: options.dimensional ? mapDimensional(options.dimensional) : null,
    provenance: mapProvenance(options.link),
    createdAt: options.link.created_at,
    updatedAt: options.link.updated_at,
  };
}

export type {
  DimensionalRow,
  DistrictRow,
  LandUseRow,
  MunicipalityRow,
  OverlayRow,
  ParcelZoningRow,
};
