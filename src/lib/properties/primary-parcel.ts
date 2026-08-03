import type { PropertyParcel } from "@/lib/properties/types";

/**
 * Pure rules for primary parcel links (matches unique partial index in SQL).
 */
export function countPrimaryParcels(
  links: ReadonlyArray<Pick<PropertyParcel, "isPrimary">>,
): number {
  return links.filter((l) => l.isPrimary).length;
}

export function hasAtMostOnePrimary(
  links: ReadonlyArray<Pick<PropertyParcel, "isPrimary">>,
): boolean {
  return countPrimaryParcels(links) <= 1;
}

export type AttachPrimaryResult =
  | { ok: true; nextLinks: Array<{ parcelId: string; isPrimary: boolean }> }
  | { ok: false; reason: "duplicate_relationship" | "multiple_primary" };

/**
 * Simulates attaching a parcel; if `isPrimary`, clears other primaries.
 */
export function planAttachParcel(options: {
  existing: ReadonlyArray<{ parcelId: string; isPrimary: boolean }>;
  parcelId: string;
  isPrimary: boolean;
}): AttachPrimaryResult {
  if (options.existing.some((l) => l.parcelId === options.parcelId)) {
    return { ok: false, reason: "duplicate_relationship" };
  }

  const next = options.existing.map((l) =>
    options.isPrimary ? { ...l, isPrimary: false } : { ...l },
  );
  next.push({ parcelId: options.parcelId, isPrimary: options.isPrimary });

  if (!hasAtMostOnePrimary(next)) {
    return { ok: false, reason: "multiple_primary" };
  }

  return { ok: true, nextLinks: next };
}
