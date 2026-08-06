"use server";

import {
  importSelectedParcel,
  searchParcelCandidates,
  type AddPropertyImportOutcome,
  type AddPropertySearchOutcome,
  type ParcelSearchMode,
} from "@/features/properties/lib/add-property-workflow";

/**
 * Server Actions for the Add Property flow.
 *
 * Deliberately thin: every decision lives in `add-property-workflow`, which has
 * no framework dependency, so the same logic can be exposed to a native client
 * through a Route Handler later without a second implementation.
 *
 * Neither action accepts an organization or user id. The workflow resolves the
 * active organization from verified membership on every call, so a crafted
 * request cannot search or import on behalf of another organization.
 */

export async function searchParcelCandidatesAction(input: {
  mode: ParcelSearchMode;
  query: string;
}): Promise<AddPropertySearchOutcome> {
  const mode: ParcelSearchMode = input?.mode === "apn" ? "apn" : "address";
  const query = typeof input?.query === "string" ? input.query : "";
  return searchParcelCandidates({ mode, query });
}

/**
 * Imports the parcel the user selected, identified only by its provider id.
 *
 * Passing the id rather than the candidate object means the server re-fetches
 * the parcel from the provider, so what gets stored is authoritative provider
 * data rather than a copy that round-tripped through the browser. A caller can
 * therefore only choose *which* parcel to import, never what it says.
 */
export async function importParcelAction(
  providerParcelId: string,
): Promise<AddPropertyImportOutcome> {
  return importSelectedParcel(typeof providerParcelId === "string" ? providerParcelId : "");
}
