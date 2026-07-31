/**
 * Parcel identity is provider-scoped: the same physical land record may appear
 * under different providers with different ids. Uniqueness is
 * (provider, providerParcelId) — not APN alone (APNs collide across counties).
 */

export type ParcelIdentityKey = {
  provider: string;
  providerParcelId: string;
};

export function normalizeParcelIdentity(input: {
  provider: string;
  providerParcelId: string;
}): ParcelIdentityKey | null {
  const provider = input.provider.trim().toLowerCase();
  const providerParcelId = input.providerParcelId.trim();
  if (!provider || !providerParcelId) return null;
  return { provider, providerParcelId };
}

export function parcelIdentityKey(input: ParcelIdentityKey): string {
  return `${input.provider}::${input.providerParcelId}`;
}

export function isSameParcelIdentity(a: ParcelIdentityKey, b: ParcelIdentityKey): boolean {
  const na = normalizeParcelIdentity(a);
  const nb = normalizeParcelIdentity(b);
  if (!na || !nb) return false;
  return parcelIdentityKey(na) === parcelIdentityKey(nb);
}
