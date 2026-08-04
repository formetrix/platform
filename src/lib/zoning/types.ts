/**
 * Zoning persistence types (FM-0016).
 * Shared reference data + parcel classification; multi-provider ready.
 */

export const ZONING_LAND_USE_PERMISSIONS = ["permitted", "conditional", "prohibited"] as const;

export type ZoningLandUsePermission = (typeof ZONING_LAND_USE_PERMISSIONS)[number];

export type ZoningMunicipality = {
  id: string;
  name: string;
  stateRegion: string | null;
  countryCode: string | null;
  provider: string;
  providerMunicipalityId: string;
};

export type ZoningDistrict = {
  id: string;
  municipalityId: string;
  code: string;
  name: string | null;
  description: string | null;
  provider: string;
  providerDistrictId: string;
};

export type ZoningOverlay = {
  id: string;
  municipalityId: string;
  code: string;
  name: string | null;
  description: string | null;
  provider: string;
  providerOverlayId: string;
};

export type ZoningLandUse = {
  id: string;
  districtId: string;
  useLabel: string;
  permission: ZoningLandUsePermission;
  notes: string | null;
};

export type ZoningDimensionalRegulations = {
  id: string;
  districtId: string;
  maxFar: number | null;
  maxDensityUnitsPerAcre: number | null;
  maxHeightFt: number | null;
  maxLotCoveragePct: number | null;
  setbackFrontFt: number | null;
  setbackSideFt: number | null;
  setbackRearFt: number | null;
  parkingRequirementText: string | null;
  notes: string | null;
};

export type ParcelZoningProvenance = {
  provider: string;
  providerRecordId: string;
  sourceRetrievedAt: string | null;
  sourceUpdatedAt: string | null;
  rawSourceMetadata: Record<string, unknown>;
};

/** Assembled Zoning Overview for one parcel classification. */
export type ParcelZoningOverview = {
  id: string;
  parcelId: string;
  isPrimary: boolean;
  municipality: ZoningMunicipality;
  district: ZoningDistrict;
  overlays: ZoningOverlay[];
  permittedUses: ZoningLandUse[];
  prohibitedUses: ZoningLandUse[];
  conditionalUses: ZoningLandUse[];
  dimensional: ZoningDimensionalRegulations | null;
  provenance: ParcelZoningProvenance;
  createdAt: string;
  updatedAt: string;
};

export type UpsertParcelZoningInput = {
  parcelId: string;
  provider: string;
  providerRecordId: string;
  municipalityName: string;
  municipalityProviderId: string;
  districtCode: string;
  districtProviderId: string;
  stateRegion?: string | null;
  countryCode?: string | null;
  districtName?: string | null;
  districtDescription?: string | null;
  isPrimary?: boolean;
  sourceRetrievedAt?: string | null;
  sourceUpdatedAt?: string | null;
  rawSourceMetadata?: Record<string, unknown>;
  maxFar?: number | null;
  maxDensityUnitsPerAcre?: number | null;
  maxHeightFt?: number | null;
  maxLotCoveragePct?: number | null;
  setbackFrontFt?: number | null;
  setbackSideFt?: number | null;
  setbackRearFt?: number | null;
  parkingRequirementText?: string | null;
  dimensionalNotes?: string | null;
  permittedUses?: string[];
  prohibitedUses?: string[];
  overlayCodes?: string[];
  overlayNames?: Array<string | null>;
};
