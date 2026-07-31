import type { Parcel, Property, PropertyParcel } from "@/lib/properties/types";
import type { NormalizedParcelCandidate, ParcelSearchQuery } from "@/lib/regrid/types";
import type { RegridFailure } from "@/lib/regrid/errors";

export type SearchParcelsResult =
  | { status: "ok"; candidates: NormalizedParcelCandidate[] }
  | { status: "unconfigured" }
  | { status: "invalid_apn" }
  | { status: "invalid_request"; message: string }
  | { status: "rate_limited"; retryAfterMs?: number; message: string }
  | { status: "api_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string };

export type ImportParcelResult =
  | { status: "ok"; parcel: Parcel; created: boolean }
  | { status: "unconfigured" }
  | { status: "invalid_request"; message: string }
  | { status: "rate_limited"; retryAfterMs?: number; message: string }
  | { status: "api_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string };

export type RefreshParcelResult =
  | { status: "ok"; parcel: Parcel }
  | { status: "unconfigured" }
  | { status: "parcel_not_found" }
  | { status: "not_found" }
  | { status: "rate_limited"; retryAfterMs?: number; message: string }
  | { status: "api_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string };

export type CreatePropertyFromParcelResult =
  | {
      status: "ok";
      property: Property;
      parcel: Parcel;
      link: PropertyParcel;
      parcelCreated: boolean;
    }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "invalid_request"; message: string }
  | { status: "duplicate_relationship" }
  | { status: "rate_limited"; retryAfterMs?: number; message: string }
  | { status: "api_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string };

export type CreatePropertyFromParcelInput = {
  organizationId: string;
  /** Selected search candidate (preferred). */
  candidate?: NormalizedParcelCandidate;
  /** Or import by Regrid provider id (fetches from API if candidate omitted). */
  providerParcelId?: string;
  /** Optional Property display name; defaults to situs address / APN. */
  name?: string;
};

export type ParcelUpsertInput = {
  candidate: NormalizedParcelCandidate;
  sourceRetrievedAt: string;
  rawSourceMetadata: Record<string, unknown>;
};

export type ParcelStore = {
  findByIdentity(provider: string, providerParcelId: string): Promise<Parcel | null>;
  findById(parcelId: string): Promise<Parcel | null>;
  upsert(input: ParcelUpsertInput): Promise<{ parcel: Parcel; created: boolean }>;
};

export type ParcelSearchInput = ParcelSearchQuery;

export function mapRegridFailureToSearchResult(failure: RegridFailure): SearchParcelsResult {
  if (failure.code === "unconfigured") return { status: "unconfigured" };
  if (failure.code === "invalid_apn") return { status: "invalid_apn" };
  if (failure.code === "invalid_request") {
    return { status: "invalid_request", message: failure.message };
  }
  if (failure.code === "rate_limited") {
    return {
      status: "rate_limited",
      retryAfterMs: failure.retryAfterMs,
      message: failure.message,
    };
  }
  if (
    failure.code === "api_error" ||
    failure.code === "unauthorized" ||
    failure.code === "not_found" ||
    failure.code === "network_error" ||
    failure.code === "parse_error"
  ) {
    return {
      status: "api_error",
      message: failure.message,
      httpStatus: failure.httpStatus,
    };
  }
  return { status: "error", message: failure.message };
}
