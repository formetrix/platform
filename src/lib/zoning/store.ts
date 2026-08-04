import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { assembleParcelZoningOverview } from "@/lib/zoning/mappers";
import type { ParcelZoningOverview, UpsertParcelZoningInput } from "@/lib/zoning/types";

export type UpsertParcelZoningResult =
  | { status: "ok"; overview: ParcelZoningOverview }
  | { status: "unconfigured" }
  | { status: "parcel_not_found" }
  | { status: "invalid_input"; message: string }
  | { status: "error"; message: string };

export type ZoningStore = {
  upsertParcelZoning(input: UpsertParcelZoningInput): Promise<UpsertParcelZoningResult>;
};

function overviewFromInput(
  input: UpsertParcelZoningInput,
  options?: { id?: string; now?: string },
): ParcelZoningOverview {
  const now = options?.now ?? new Date().toISOString();
  const provider = input.provider.toLowerCase().trim();
  const municipalityId = `muni-${provider}-${input.municipalityProviderId}`;
  const districtId = `dist-${provider}-${input.districtProviderId}`;

  return assembleParcelZoningOverview({
    link: {
      id: options?.id ?? `pz-${provider}-${input.providerRecordId}`,
      parcel_id: input.parcelId,
      district_id: districtId,
      is_primary: input.isPrimary ?? true,
      provider,
      provider_record_id: input.providerRecordId.trim(),
      source_retrieved_at: input.sourceRetrievedAt ?? now,
      source_updated_at: input.sourceUpdatedAt ?? null,
      raw_source_metadata: input.rawSourceMetadata ?? {},
      created_at: now,
      updated_at: now,
    },
    municipality: {
      id: municipalityId,
      name: input.municipalityName.trim(),
      state_region: input.stateRegion ?? null,
      country_code: input.countryCode ?? null,
      provider,
      provider_municipality_id: input.municipalityProviderId.trim(),
    },
    district: {
      id: districtId,
      municipality_id: municipalityId,
      code: input.districtCode.trim(),
      name: input.districtName ?? null,
      description: input.districtDescription ?? null,
      provider,
      provider_district_id: input.districtProviderId.trim(),
    },
    overlays: (input.overlayCodes ?? []).map((code, index) => ({
      id: `ov-${code}`,
      municipality_id: municipalityId,
      code,
      name: input.overlayNames?.[index] ?? null,
      description: null,
      provider,
      provider_overlay_id: `${provider}:${code}`,
    })),
    landUses: [
      ...(input.permittedUses ?? []).map((label, i) => ({
        id: `perm-${i}`,
        district_id: districtId,
        use_label: label,
        permission: "permitted",
        notes: null,
      })),
      ...(input.prohibitedUses ?? []).map((label, i) => ({
        id: `proh-${i}`,
        district_id: districtId,
        use_label: label,
        permission: "prohibited",
        notes: null,
      })),
    ],
    dimensional: {
      id: `dim-${districtId}`,
      district_id: districtId,
      max_far: input.maxFar ?? null,
      max_density_units_per_acre: input.maxDensityUnitsPerAcre ?? null,
      max_height_ft: input.maxHeightFt ?? null,
      max_lot_coverage_pct: input.maxLotCoveragePct ?? null,
      setback_front_ft: input.setbackFrontFt ?? null,
      setback_side_ft: input.setbackSideFt ?? null,
      setback_rear_ft: input.setbackRearFt ?? null,
      parking_requirement_text: input.parkingRequirementText ?? null,
      notes: input.dimensionalNotes ?? null,
    },
  });
}

/**
 * In-memory zoning store for unit tests — never used as fake production data.
 */
export function createMemoryZoningStore(): ZoningStore & {
  listByParcel(parcelId: string): ParcelZoningOverview[];
} {
  const byParcel = new Map<string, ParcelZoningOverview[]>();

  return {
    listByParcel(parcelId: string) {
      return byParcel.get(parcelId) ?? [];
    },
    async upsertParcelZoning(input) {
      if (!input.provider.trim() || !input.providerRecordId.trim()) {
        return { status: "invalid_input", message: "Provider identity is required." };
      }
      if (!input.municipalityName.trim() || !input.districtCode.trim()) {
        return { status: "invalid_input", message: "Municipality and district code are required." };
      }

      const overview = overviewFromInput(input);
      const existing = byParcel.get(input.parcelId) ?? [];
      const demoted =
        input.isPrimary === false ? existing : existing.map((z) => ({ ...z, isPrimary: false }));
      const withoutSame = demoted.filter(
        (z) => z.provenance.providerRecordId !== overview.provenance.providerRecordId,
      );
      byParcel.set(input.parcelId, [...withoutSame, overview]);
      return { status: "ok", overview };
    },
  };
}

/**
 * Service-role upsert via SECURITY DEFINER RPC — for future zoning providers.
 */
export function createSupabaseZoningStore(): ZoningStore {
  return {
    async upsertParcelZoning(input) {
      if (!isServiceRoleConfigured()) return { status: "unconfigured" };

      try {
        const admin = createServiceRoleClient();
        const { data, error } = await admin.rpc("upsert_parcel_zoning_from_provider", {
          p_parcel_id: input.parcelId,
          p_provider: input.provider,
          p_provider_record_id: input.providerRecordId,
          p_municipality_name: input.municipalityName,
          p_municipality_provider_id: input.municipalityProviderId,
          p_district_code: input.districtCode,
          p_district_provider_id: input.districtProviderId,
          p_state_region: input.stateRegion ?? null,
          p_country_code: input.countryCode ?? null,
          p_district_name: input.districtName ?? null,
          p_district_description: input.districtDescription ?? null,
          p_is_primary: input.isPrimary ?? true,
          p_source_retrieved_at: input.sourceRetrievedAt ?? null,
          p_source_updated_at: input.sourceUpdatedAt ?? null,
          p_raw_source_metadata: input.rawSourceMetadata ?? {},
          p_max_far: input.maxFar ?? null,
          p_max_density_units_per_acre: input.maxDensityUnitsPerAcre ?? null,
          p_max_height_ft: input.maxHeightFt ?? null,
          p_max_lot_coverage_pct: input.maxLotCoveragePct ?? null,
          p_setback_front_ft: input.setbackFrontFt ?? null,
          p_setback_side_ft: input.setbackSideFt ?? null,
          p_setback_rear_ft: input.setbackRearFt ?? null,
          p_parking_requirement_text: input.parkingRequirementText ?? null,
          p_dimensional_notes: input.dimensionalNotes ?? null,
          p_permitted_uses: input.permittedUses ?? null,
          p_prohibited_uses: input.prohibitedUses ?? null,
          p_overlay_codes: input.overlayCodes ?? null,
          p_overlay_names: input.overlayNames ?? null,
        });

        if (error) {
          if (error.message?.toLowerCase().includes("parcel not found")) {
            return { status: "parcel_not_found" };
          }
          return { status: "error", message: "Zoning upsert failed." };
        }

        const id = (data as { id?: string } | null)?.id;
        return {
          status: "ok",
          overview: overviewFromInput(input, { id }),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("Missing required environment variable")) {
          return { status: "unconfigured" };
        }
        return { status: "error", message: "Zoning upsert failed." };
      }
    },
  };
}
