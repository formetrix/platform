import { mapParcel } from "@/lib/properties/mappers";
import type { Parcel } from "@/lib/properties/types";
import { geometryToGeoJsonString } from "@/lib/regrid/normalize";
import type { ParcelStore, ParcelUpsertInput } from "@/lib/properties/ingestion/types";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

type ParcelRow = Parameters<typeof mapParcel>[0];

/**
 * In-memory parcel store for unit tests (no Supabase / PostGIS).
 */
export function createMemoryParcelStore(seed: Parcel[] = []): ParcelStore {
  const byIdentity = new Map<string, Parcel>();
  const byId = new Map<string, Parcel>();

  for (const parcel of seed) {
    const key = `${parcel.provenance.provider}::${parcel.provenance.providerParcelId}`;
    byIdentity.set(key, parcel);
    byId.set(parcel.id, parcel);
  }

  return {
    async findByIdentity(provider, providerParcelId) {
      return byIdentity.get(`${provider}::${providerParcelId}`) ?? null;
    },
    async findById(parcelId) {
      return byId.get(parcelId) ?? null;
    },
    async upsert(input) {
      const { candidate, sourceRetrievedAt, rawSourceMetadata } = input;
      const key = `${candidate.provider}::${candidate.providerParcelId}`;
      const existing = byIdentity.get(key);
      if (existing) {
        const updated: Parcel = {
          ...existing,
          apn: candidate.apn,
          normalizedApn: candidate.normalizedApn,
          county: candidate.county,
          stateRegion: candidate.stateRegion,
          countryCode: candidate.countryCode,
          situsAddress: candidate.situsAddress,
          acreage: candidate.acreage,
          provenance: {
            ...existing.provenance,
            geometrySource: candidate.geometrySource,
            sourceRetrievedAt,
            sourceUpdatedAt: candidate.sourceUpdatedAt ?? existing.provenance.sourceUpdatedAt,
            rawSourceMetadata,
            geometryQuality: candidate.geometryQuality,
          },
          geometry: {
            ...existing.geometry,
            hasGeometry: Boolean(candidate.geometryGeoJson) || existing.geometry.hasGeometry,
            geometryWkt: candidate.geometryGeoJson
              ? geometryToGeoJsonString(candidate.geometryGeoJson)
              : existing.geometry.geometryWkt,
          },
          updatedAt: sourceRetrievedAt,
        };
        byIdentity.set(key, updated);
        byId.set(updated.id, updated);
        return { parcel: updated, created: false };
      }

      const created: Parcel = {
        id: crypto.randomUUID(),
        apn: candidate.apn,
        normalizedApn: candidate.normalizedApn,
        county: candidate.county,
        stateRegion: candidate.stateRegion,
        countryCode: candidate.countryCode,
        situsAddress: candidate.situsAddress,
        acreage: candidate.acreage,
        provenance: {
          provider: candidate.provider,
          providerParcelId: candidate.providerParcelId,
          geometrySource: candidate.geometrySource,
          sourceRetrievedAt,
          sourceUpdatedAt: candidate.sourceUpdatedAt,
          rawSourceMetadata,
          geometryQuality: candidate.geometryQuality,
        },
        geometry: {
          srid: 4326,
          geometryWkt: geometryToGeoJsonString(candidate.geometryGeoJson),
          centroidWkt: null,
          hasGeometry: Boolean(candidate.geometryGeoJson),
        },
        createdAt: sourceRetrievedAt,
        updatedAt: sourceRetrievedAt,
      };
      byIdentity.set(key, created);
      byId.set(created.id, created);
      return { parcel: created, created: true };
    },
  };
}

/**
 * Supabase service-role parcel store using upsert_parcel_from_provider RPC.
 */
export function createSupabaseParcelStore(): ParcelStore {
  return {
    async findByIdentity(provider, providerParcelId) {
      if (!isServiceRoleConfigured()) {
        throw new Error("Supabase service role is not configured.");
      }
      const admin = createServiceRoleClient();
      const { data, error } = await admin
        .from("parcels")
        .select("*")
        .eq("provider", provider)
        .eq("provider_parcel_id", providerParcelId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return mapParcel(data as ParcelRow);
    },

    async findById(parcelId) {
      if (!isServiceRoleConfigured()) {
        throw new Error("Supabase service role is not configured.");
      }
      const admin = createServiceRoleClient();
      const { data, error } = await admin
        .from("parcels")
        .select("*")
        .eq("id", parcelId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return mapParcel(data as ParcelRow);
    },

    async upsert(input: ParcelUpsertInput) {
      if (!isServiceRoleConfigured()) {
        throw new Error("Supabase service role is not configured.");
      }
      const admin = createServiceRoleClient();
      const { candidate, sourceRetrievedAt, rawSourceMetadata } = input;

      const existing = await this.findByIdentity(candidate.provider, candidate.providerParcelId);

      const { data, error } = await admin.rpc("upsert_parcel_from_provider", {
        p_provider: candidate.provider,
        p_provider_parcel_id: candidate.providerParcelId,
        p_apn: candidate.apn,
        p_normalized_apn: candidate.normalizedApn,
        p_county: candidate.county,
        p_state_region: candidate.stateRegion,
        p_country_code: candidate.countryCode,
        p_situs_address: candidate.situsAddress,
        p_acreage: candidate.acreage,
        p_geometry_geojson: geometryToGeoJsonString(candidate.geometryGeoJson),
        p_geometry_source: candidate.geometrySource,
        p_source_retrieved_at: sourceRetrievedAt,
        p_source_updated_at: candidate.sourceUpdatedAt,
        p_raw_source_metadata: rawSourceMetadata,
        p_geometry_quality: candidate.geometryQuality,
      });

      if (error || !data) {
        throw new Error(error?.message ?? "Parcel upsert failed.");
      }

      const parcel = mapParcel(data as ParcelRow);
      return { parcel, created: !existing };
    },
  };
}

export function getDefaultParcelStore(): ParcelStore {
  return createSupabaseParcelStore();
}
