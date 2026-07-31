import {
  attachParcelToProperty,
  createProperty,
  type AttachParcelResult,
  type PropertyResult,
} from "@/lib/properties/access";
import {
  createMemoryParcelStore,
  getDefaultParcelStore,
} from "@/lib/properties/ingestion/parcel-store";
import {
  mapRegridFailureToSearchResult,
  type CreatePropertyFromParcelInput,
  type CreatePropertyFromParcelResult,
  type ImportParcelResult,
  type ParcelSearchInput,
  type ParcelStore,
  type RefreshParcelResult,
  type SearchParcelsResult,
} from "@/lib/properties/ingestion/types";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createRegridClient,
  isRegridConfigured,
  REGRID_PROVIDER,
  type RegridClient,
} from "@/lib/regrid";
import { RegridClientError } from "@/lib/regrid/errors";
import { buildProvenanceMetadata } from "@/lib/regrid/normalize";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";
import type { CreatePropertyInput, Parcel, Property, PropertyParcel } from "@/lib/properties/types";

export type IngestionDependencies = {
  regridClient: RegridClient;
  parcelStore: ParcelStore;
  createPropertyFn: (input: CreatePropertyInput) => Promise<PropertyResult>;
  attachParcelFn: (options: {
    propertyId: string;
    parcelId: string;
    relationshipType?: "primary_site" | "component" | "adjacent" | "other";
    isPrimary?: boolean;
  }) => Promise<AttachParcelResult>;
  now: () => Date;
};

function defaultDependencies(overrides?: Partial<IngestionDependencies>): IngestionDependencies {
  return {
    regridClient: overrides?.regridClient ?? createRegridClient(),
    parcelStore: overrides?.parcelStore ?? getDefaultParcelStore(),
    createPropertyFn: overrides?.createPropertyFn ?? createProperty,
    attachParcelFn: overrides?.attachParcelFn ?? attachParcelToProperty,
    now: overrides?.now ?? (() => new Date()),
  };
}

function mapClientError(error: unknown): SearchParcelsResult {
  if (error instanceof RegridClientError) {
    return mapRegridFailureToSearchResult(error.toFailure());
  }
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Parcel search failed.",
  };
}

/**
 * Search Regrid for parcels by address, APN, or coordinates.
 * Does not write to the database.
 */
export async function searchParcels(
  query: ParcelSearchInput,
  deps?: Partial<IngestionDependencies>,
): Promise<SearchParcelsResult> {
  if (!isRegridConfigured() && !deps?.regridClient) {
    return { status: "unconfigured" };
  }

  const { regridClient } = defaultDependencies(deps);
  try {
    const candidates = await regridClient.search(query);
    return { status: "ok", candidates };
  } catch (error) {
    return mapClientError(error);
  }
}

/**
 * Upsert a parcel from a normalized candidate (or fetch by provider id).
 * Reuses existing rows with the same (provider, provider_parcel_id).
 */
export async function importParcel(
  input: { candidate: NormalizedParcelCandidate } | { providerParcelId: string },
  deps?: Partial<IngestionDependencies>,
): Promise<ImportParcelResult> {
  const needsApi = !("candidate" in input);
  if (!isRegridConfigured() && needsApi && !deps?.regridClient) {
    return { status: "unconfigured" };
  }
  if (!deps?.parcelStore && !isServiceRoleConfigured()) {
    return { status: "unconfigured" };
  }

  const { regridClient, parcelStore, now } = defaultDependencies(deps);

  try {
    let candidate: NormalizedParcelCandidate;
    if ("candidate" in input) {
      candidate = input.candidate;
    } else {
      const fetched = await regridClient.getByProviderParcelId(input.providerParcelId);
      if (!fetched) {
        return {
          status: "api_error",
          message: "Regrid returned no parcel for that id.",
          httpStatus: 404,
        };
      }
      candidate = fetched;
    }

    if (!candidate.providerParcelId) {
      return { status: "invalid_request", message: "Candidate is missing providerParcelId." };
    }

    const sourceRetrievedAt = now().toISOString();
    const rawSourceMetadata = {
      ...buildProvenanceMetadata(candidate),
      retrievedAt: sourceRetrievedAt,
    };

    const { parcel, created } = await parcelStore.upsert({
      candidate,
      sourceRetrievedAt,
      rawSourceMetadata,
    });

    return { status: "ok", parcel, created };
  } catch (error) {
    if (error instanceof RegridClientError) {
      const mapped = mapRegridFailureToSearchResult(error.toFailure());
      if (mapped.status === "ok") {
        return { status: "error", message: "Unexpected search success while importing." };
      }
      if (mapped.status === "invalid_apn") {
        return { status: "invalid_request", message: "Invalid APN." };
      }
      return mapped;
    }
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Parcel import failed.",
    };
  }
}

/**
 * Refresh an existing Formetrix parcel from Regrid by stored provider id.
 */
export async function refreshParcel(
  parcelId: string,
  deps?: Partial<IngestionDependencies>,
): Promise<RefreshParcelResult> {
  if (!deps?.parcelStore && !isServiceRoleConfigured()) {
    return { status: "unconfigured" };
  }
  if (!isRegridConfigured() && !deps?.regridClient) {
    return { status: "unconfigured" };
  }

  const { regridClient, parcelStore, now } = defaultDependencies(deps);

  try {
    const existing = await parcelStore.findById(parcelId);
    if (!existing) return { status: "parcel_not_found" };
    if (existing.provenance.provider !== REGRID_PROVIDER) {
      return {
        status: "error",
        message: `Cannot refresh provider "${existing.provenance.provider}" via Regrid.`,
      };
    }

    const candidate = await regridClient.getByProviderParcelId(
      existing.provenance.providerParcelId,
    );
    if (!candidate) return { status: "not_found" };

    const sourceRetrievedAt = now().toISOString();
    const rawSourceMetadata = {
      ...buildProvenanceMetadata(candidate),
      retrievedAt: sourceRetrievedAt,
      previousRetrievedAt: existing.provenance.sourceRetrievedAt,
    };

    const { parcel } = await parcelStore.upsert({
      candidate,
      sourceRetrievedAt,
      rawSourceMetadata,
    });

    return { status: "ok", parcel };
  } catch (error) {
    if (error instanceof RegridClientError) {
      const mapped = mapRegridFailureToSearchResult(error.toFailure());
      if (mapped.status === "rate_limited") return mapped;
      if (mapped.status === "api_error") return mapped;
      if (mapped.status === "unconfigured") return mapped;
      return {
        status: "error",
        message: mapped.status === "error" ? mapped.message : error.message,
      };
    }
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Parcel refresh failed.",
    };
  }
}

function defaultPropertyName(candidate: NormalizedParcelCandidate): string {
  if (candidate.situsAddress) return candidate.situsAddress;
  if (candidate.apn) return `Parcel ${candidate.apn}`;
  return `Parcel ${candidate.providerParcelId}`;
}

/**
 * Create an Organization Property linked to an imported (or reused) Parcel.
 * Workflow: resolve candidate → importParcel → createProperty → attach primary link.
 */
export async function createPropertyFromParcel(
  input: CreatePropertyFromParcelInput,
  deps?: Partial<IngestionDependencies>,
): Promise<CreatePropertyFromParcelResult> {
  if (!isSupabaseConfigured() && !deps?.createPropertyFn) {
    return { status: "unconfigured" };
  }
  if (!deps?.parcelStore && !isServiceRoleConfigured()) {
    return { status: "unconfigured" };
  }

  if (!input.candidate && !input.providerParcelId) {
    return {
      status: "invalid_request",
      message: "Provide a search candidate or providerParcelId.",
    };
  }

  const resolved = defaultDependencies(deps);

  const imported = await importParcel(
    input.candidate
      ? { candidate: input.candidate }
      : { providerParcelId: input.providerParcelId! },
    resolved,
  );

  if (imported.status !== "ok") {
    if (imported.status === "unconfigured") return { status: "unconfigured" };
    if (imported.status === "invalid_request") return imported;
    if (imported.status === "rate_limited") return imported;
    if (imported.status === "api_error") return imported;
    return { status: "error", message: imported.message };
  }

  const candidate =
    input.candidate ??
    ({
      provider: REGRID_PROVIDER,
      providerParcelId: imported.parcel.provenance.providerParcelId,
      situsAddress: imported.parcel.situsAddress,
      apn: imported.parcel.apn,
      city: null,
      postalCode: null,
      stateRegion: imported.parcel.stateRegion,
      countryCode: imported.parcel.countryCode,
      acreage: imported.parcel.acreage,
    } as NormalizedParcelCandidate);

  const propertyResult = await resolved.createPropertyFn({
    organizationId: input.organizationId,
    name: (input.name?.trim() || defaultPropertyName(candidate)).slice(0, 200),
    status: "discovered",
    addressLine1: candidate.situsAddress,
    city: candidate.city,
    stateRegion: candidate.stateRegion,
    postalCode: candidate.postalCode,
    countryCode: candidate.countryCode ?? "US",
  });

  if (propertyResult.status !== "ok") {
    return propertyResult as CreatePropertyFromParcelResult;
  }

  const attach = await resolved.attachParcelFn({
    propertyId: propertyResult.property.id,
    parcelId: imported.parcel.id,
    relationshipType: "primary_site",
    isPrimary: true,
  });

  if (attach.status === "duplicate_relationship") {
    return { status: "duplicate_relationship" };
  }
  if (attach.status !== "ok") {
    if (
      attach.status === "unauthenticated" ||
      attach.status === "unconfigured" ||
      attach.status === "profile_missing" ||
      attach.status === "organization_missing" ||
      attach.status === "membership_inactive" ||
      attach.status === "insufficient_role"
    ) {
      return { status: attach.status };
    }
    return {
      status: "error",
      message: attach.status === "error" ? attach.message : "Failed to link parcel to property.",
    };
  }

  return {
    status: "ok",
    property: propertyResult.property,
    parcel: imported.parcel,
    link: attach.link,
    parcelCreated: imported.created,
  };
}

/** Test helper — memory store + injectable client. */
export function createTestIngestionDeps(
  overrides: Partial<IngestionDependencies> & { parcels?: Parcel[] } = {},
): IngestionDependencies {
  const { parcels, ...rest } = overrides;
  return defaultDependencies({
    parcelStore: rest.parcelStore ?? createMemoryParcelStore(parcels),
    ...rest,
  });
}

export type { Parcel, Property, PropertyParcel };
