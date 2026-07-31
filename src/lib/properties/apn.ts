/**
 * Normalized APN helpers for cross-provider lookup.
 * Display APN is preserved separately on the parcel row.
 */

export function normalizeApn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function apnsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeApn(a);
  const nb = normalizeApn(b);
  if (!na || !nb) return false;
  return na === nb;
}
