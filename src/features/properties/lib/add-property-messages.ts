import type {
  AddPropertyImportOutcome,
  AddPropertySearchOutcome,
} from "@/features/properties/lib/add-property-workflow";
import { formatAcreage } from "@/features/properties/lib/format";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";

/**
 * User-facing copy for the Add Property flow.
 *
 * Pure functions over the workflow's outcome types, so the wording is unit-
 * tested and the components stay declarative. Every message says what happened
 * and what the user can do next (FORMETRIX.md §18), and none of them exposes a
 * provider string, status code, or environment variable name to a developer
 * who cannot act on it.
 */

export type FlowMessage = {
  title: string;
  detail: string;
  /** Whether re-running the same action could plausibly succeed. */
  retryable: boolean;
};

export function describeSearchOutcome(
  outcome: Exclude<AddPropertySearchOutcome, { status: "ok" }>,
  mode: "address" | "apn",
): FlowMessage {
  switch (outcome.status) {
    case "empty_query":
      return {
        title: mode === "apn" ? "Enter an APN" : "Enter an address",
        detail:
          mode === "apn"
            ? "Type the parcel number you want to look up."
            : "Type a street address, including the city or state if you know it.",
        retryable: true,
      };
    case "invalid_apn":
      return {
        title: "That APN doesn't look valid",
        detail: "Check the parcel number and try again — letters, digits, and dashes only.",
        retryable: true,
      };
    case "no_results":
      return {
        title: "No parcels matched",
        detail:
          mode === "apn"
            ? "No parcel with that number was found. Confirm the county's format, or search by address instead."
            : "Try a simpler address — just the street number and name — or search by APN instead.",
        retryable: true,
      };
    case "rate_limited":
      return {
        title: "Too many searches right now",
        detail: describeRetryDelay(outcome.retryAfterMs),
        retryable: true,
      };
    case "provider_unavailable":
      return {
        title: "The parcel service is unavailable",
        detail: "This is on the data provider's side, not your search. Try again in a few minutes.",
        retryable: true,
      };
    case "provider_unconfigured":
      return {
        title: "Parcel search is not configured",
        detail:
          "This deployment has no parcel data provider connected yet. An administrator needs to finish setup before properties can be imported.",
        retryable: false,
      };
    case "unconfigured":
      return {
        title: "Formetrix is not fully configured",
        detail: "The database connection is missing. An administrator needs to finish setup.",
        retryable: false,
      };
    case "unauthenticated":
      return {
        title: "Your session expired",
        detail: "Sign in again to keep searching.",
        retryable: false,
      };
    case "organization_missing":
      return {
        title: "No active organization",
        detail: "Set up your organization before importing properties.",
        retryable: false,
      };
    default:
      return {
        title: "Search failed",
        detail: "Something went wrong on our side. Try again in a moment.",
        retryable: true,
      };
  }
}

export function describeImportOutcome(
  outcome: Exclude<AddPropertyImportOutcome, { status: "ok" } | { status: "duplicate_property" }>,
): FlowMessage {
  switch (outcome.status) {
    case "invalid_selection":
      return {
        title: "That parcel can't be imported",
        detail: "The provider returned no stable id for it. Pick a different result.",
        retryable: false,
      };
    case "rate_limited":
      return {
        title: "Too many requests right now",
        detail: describeRetryDelay(outcome.retryAfterMs),
        retryable: true,
      };
    case "provider_unavailable":
      return {
        title: "The parcel service is unavailable",
        detail: "Nothing was saved. Try importing again in a few minutes.",
        retryable: true,
      };
    case "service_role_unconfigured":
      return {
        title: "Parcel import is not configured",
        detail:
          "This deployment cannot write parcel records yet. An administrator needs to finish server setup — nothing was saved.",
        retryable: false,
      };
    case "unconfigured":
      return {
        title: "Formetrix is not fully configured",
        detail: "The database connection is missing. Nothing was saved.",
        retryable: false,
      };
    case "unauthenticated":
      return {
        title: "Your session expired",
        detail: "Sign in again and re-run the import. Nothing was saved.",
        retryable: false,
      };
    case "organization_missing":
      return {
        title: "No active organization",
        detail: "Set up your organization before importing properties.",
        retryable: false,
      };
    case "insufficient_role":
      return {
        title: "You don't have permission to add properties",
        detail: "Ask an owner or admin of your organization to grant you access.",
        retryable: false,
      };
    default:
      return {
        title: "Import failed",
        detail: "Something went wrong and nothing was saved. Try again in a moment.",
        retryable: true,
      };
  }
}

function describeRetryDelay(retryAfterMs: number | undefined): string {
  if (!retryAfterMs || !Number.isFinite(retryAfterMs) || retryAfterMs <= 0) {
    return "The data provider is limiting requests. Wait a moment and try again.";
  }
  const seconds = Math.ceil(retryAfterMs / 1000);
  if (seconds < 60) {
    return `The data provider is limiting requests. Try again in about ${seconds} second${seconds === 1 ? "" : "s"}.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `The data provider is limiting requests. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Display fields for one candidate row. Absent values read as "—", never invented. */
export type CandidateSummary = {
  primaryLine: string;
  locationLine: string;
  apnLabel: string;
  sizeLabel: string;
  providerLabel: string;
  scoreLabel: string | null;
};

export function summarizeCandidate(candidate: NormalizedParcelCandidate): CandidateSummary {
  const location = [candidate.city, candidate.county, candidate.stateRegion]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return {
    primaryLine: candidate.situsAddress?.trim() || "Address not provided",
    locationLine: location.length > 0 ? location.join(" · ") : "Location not provided",
    apnLabel: candidate.apn?.trim() || "—",
    sizeLabel: formatAcreage(candidate.acreage),
    providerLabel: candidate.provider,
    scoreLabel: candidate.matchScore == null ? null : `Match ${Math.round(candidate.matchScore)}`,
  };
}
