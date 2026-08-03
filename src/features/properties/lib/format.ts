import type { Parcel, Property } from "@/lib/properties/types";

export function formatPropertyAddress(property: Property): string {
  const line1 = property.addressLine1?.trim();
  const city = property.city?.trim();
  const state = property.stateRegion?.trim();
  const postal = property.postalCode?.trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  const tail = [cityState, postal].filter(Boolean).join(" ");
  if (line1 && tail) return `${line1}, ${tail}`;
  if (line1) return line1;
  if (tail) return tail;
  return "Address not set";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAcreage(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ac`;
}

export function formatLatLng(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(6);
}

export function geometryStatusLabel(parcel: Parcel | null): string {
  if (!parcel) return "No parcel";
  if (parcel.geometry.hasGeometry) return "Boundary present";
  return "No geometry";
}

export function truncateId(id: string, keep = 8): string {
  if (id.length <= keep * 2 + 1) return id;
  return `${id.slice(0, keep)}…${id.slice(-keep)}`;
}
