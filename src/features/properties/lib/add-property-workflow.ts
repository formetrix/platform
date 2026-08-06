import {
  findOrganizationPropertyByParcel,
  type PropertyForParcelResult,
} from "@/lib/properties/access";
import { createPropertyFromParcel, searchParcels } from "@/lib/properties/ingestion";
import type { SearchParcelsResult } from "@/lib/properties/ingestion/types";
import { getCurrentOrganization } from "@/lib/organizations";
import { REGRID_PROVIDER } from "@/lib/regrid";
import { normalizeApn } from "@/lib/properties/apn";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";

/**
 * Add Property workflow — the business logic behind parcel search and import,
 * deliberately free of React, Next, and any UI concern (FORMETRIX.md §10).
 *
 * The web UI reaches this through thin Server Actions. A future native client
 * can reach the same functions through a Route Handler without reimplementing
 * search, normalization, import, or property creation — which is the point of
 * keeping the orchestration here rather than inside a component.
 *
 * Nothing here accepts an organization or user id from the caller. The active
 * organization is resolved server-side from verified membership every time, so
 * a client cannot import into an organization it does not belong to.
 */

export type ParcelSearchMode = "address" | "apn";

export type AddPropertySearchOutcome =
  | { status: "ok"; candidates: NormalizedParcelCandidate[]; organizationName: string }
  | { status: "empty_query" }
  | { status: "invalid_apn" }
  | { status: "no_results" }
  | { status: "unconfigured" }
  | { status: "provider_unconfigured" }
  | { status: "unauthenticated" }
  | { status: "organization_missing" }
  | { status: "rate_limited"; retryAfterMs?: number }
  | { status: "provider_unavailable" }
  | { status: "error" };

export type AddPropertyImportOutcome =
  | { status: "ok"; propertyId: string; parcelCreated: boolean }
  | { status: "duplicate_property"; propertyId: string; propertyName: string }
  | { status: "invalid_selection" }
  | { status: "unconfigured" }
  | { status: "service_role_unconfigured" }
  | { status: "unauthenticated" }
  | { status: "organization_missing" }
  | { status: "insufficient_role" }
  | { status: "rate_limited"; retryAfterMs?: number }
  | { status: "provider_unavailable" }
  | { status: "error" };

/** Longest query we forward to the provider; guards against pathological input. */
const MAX_QUERY_LENGTH = 200;
const CANDIDATE_LIMIT = 10;

type OrganizationContext =
  | { status: "ok"; organizationId: string; organizationName: string }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "organization_missing" };

/** Resolves the caller's active organization from verified membership only. */
async function resolveOrganization(): Promise<OrganizationContext> {
  const current = await getCurrentOrganization();
  switch (current.status) {
    case "ok":
      return {
        status: "ok",
        organizationId: current.organization.id,
        organizationName: current.organization.name,
      };
    case "unconfigured":
      return { status: "unconfigured" };
    case "unauthenticated":
      return { status: "unauthenticated" };
    default:
      // profile_missing / organization_missing / membership_inactive / error all
      // mean the same thing to this workflow: no organization to import into.
      return { status: "organization_missing" };
  }
}

function mapSearchFailure(result: SearchParcelsResult): AddPropertySearchOutcome {
  switch (result.status) {
    case "unconfigured":
      return { status: "provider_unconfigured" };
    case "invalid_apn":
      return { status: "invalid_apn" };
    case "rate_limited":
      return { status: "rate_limited", retryAfterMs: result.retryAfterMs };
    case "api_error":
      return { status: "provider_unavailable" };
    case "invalid_request":
      return { status: "no_results" };
    default:
      return { status: "error" };
  }
}

/**
 * Searches the parcel provider for candidates the caller could import.
 * Read-only — nothing is written until `importSelectedParcel` runs.
 */
export async function searchParcelCandidates(input: {
  mode: ParcelSearchMode;
  query: string;
}): Promise<AddPropertySearchOutcome> {
  const query = input.query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return { status: "empty_query" };

  // Membership is checked before the provider is called: an unauthenticated
  // visitor must not be able to spend the organization's Regrid quota.
  const organization = await resolveOrganization();
  if (organization.status !== "ok") return organization;

  if (input.mode === "apn" && !normalizeApn(query)) {
    return { status: "invalid_apn" };
  }

  const result = await searchParcels(
    input.mode === "apn"
      ? { mode: "apn", apn: query, limit: CANDIDATE_LIMIT }
      : { mode: "address", query, limit: CANDIDATE_LIMIT },
  );

  if (result.status !== "ok") return mapSearchFailure(result);
  if (result.candidates.length === 0) return { status: "no_results" };

  return {
    status: "ok",
    candidates: result.candidates,
    organizationName: organization.organizationName,
  };
}

function mapDuplicateLookupFailure(
  result: Exclude<PropertyForParcelResult, { status: "ok" }>,
): AddPropertyImportOutcome {
  switch (result.status) {
    case "unconfigured":
      return { status: "unconfigured" };
    case "unauthenticated":
      return { status: "unauthenticated" };
    case "insufficient_role":
      return { status: "insufficient_role" };
    case "profile_missing":
    case "organization_missing":
    case "membership_inactive":
      return { status: "organization_missing" };
    default:
      return { status: "error" };
  }
}

/**
 * Imports the parcel the user selected and creates the Property that owns it.
 *
 * Takes only the provider's parcel id, not the candidate object. The server
 * re-fetches the parcel from the provider, which means the stored record is
 * authoritative and current rather than a copy that round-tripped through the
 * browser — and it removes any question of what a tampered candidate could
 * write. (It is also the only shape that survives the round trip: the raw
 * provider feature embedded in a candidate breaks Server Action argument
 * deserialization.)
 *
 * Delegates to `createPropertyFromParcel`, reusing the parcel upsert — identity
 * is `(provider, providerParcelId)`, so a parcel another organization already
 * pulled is reused rather than duplicated as a second land record — and the
 * property/link creation path.
 */
export async function importSelectedParcel(
  providerParcelId: string,
): Promise<AddPropertyImportOutcome> {
  const parcelId = typeof providerParcelId === "string" ? providerParcelId.trim() : "";
  if (!parcelId) return { status: "invalid_selection" };

  const organization = await resolveOrganization();
  if (organization.status !== "ok") return organization;

  // Checked before writing: the parcel row is shared across organizations, so
  // only an existing *Property* in this organization counts as a duplicate.
  const existing = await findOrganizationPropertyByParcel(
    organization.organizationId,
    REGRID_PROVIDER,
    parcelId,
  );
  if (existing.status !== "ok") return mapDuplicateLookupFailure(existing);
  if (existing.property) {
    return {
      status: "duplicate_property",
      propertyId: existing.property.id,
      propertyName: existing.property.name,
    };
  }

  const created = await createPropertyFromParcel({
    organizationId: organization.organizationId,
    providerParcelId: parcelId,
  });

  switch (created.status) {
    case "ok":
      return {
        status: "ok",
        propertyId: created.property.id,
        parcelCreated: created.parcelCreated,
      };
    case "unconfigured":
      // Reached when SUPABASE_SERVICE_ROLE_KEY is absent: parcel writes go
      // through a service-role RPC because `parcels` grants `authenticated`
      // no insert policy (FM-0030).
      return { status: "service_role_unconfigured" };
    case "unauthenticated":
      return { status: "unauthenticated" };
    case "insufficient_role":
      return { status: "insufficient_role" };
    case "profile_missing":
    case "organization_missing":
    case "membership_inactive":
      return { status: "organization_missing" };
    case "rate_limited":
      return { status: "rate_limited", retryAfterMs: created.retryAfterMs };
    case "api_error":
      return { status: "provider_unavailable" };
    case "duplicate_relationship":
      // The link already existed — a concurrent import of the same parcel.
      // Re-resolve so the caller can open the Property that won the race.
      return resolveExistingAfterRace(organization.organizationId, REGRID_PROVIDER, parcelId);
    default:
      return { status: "error" };
  }
}

async function resolveExistingAfterRace(
  organizationId: string,
  provider: string,
  providerParcelId: string,
): Promise<AddPropertyImportOutcome> {
  const existing = await findOrganizationPropertyByParcel(
    organizationId,
    provider,
    providerParcelId,
  );
  if (existing.status === "ok" && existing.property) {
    return {
      status: "duplicate_property",
      propertyId: existing.property.id,
      propertyName: existing.property.name,
    };
  }
  return { status: "error" };
}
