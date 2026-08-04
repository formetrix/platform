import type { ParcelZoningOverview, ZoningDimensionalRegulations } from "@/lib/zoning/types";

/** Missing zoning fields stay explicit — never coerce null to "0" or "N/A invent". */
export function formatZoningMissing(): string {
  return "Not available";
}

export function formatZoningCode(overview: ParcelZoningOverview | null): string {
  if (!overview) return formatZoningMissing();
  const name = overview.district.name?.trim();
  return name ? `${overview.district.code} — ${name}` : overview.district.code;
}

export function formatMunicipality(overview: ParcelZoningOverview | null): string {
  if (!overview) return formatZoningMissing();
  const parts = [
    overview.municipality.name,
    overview.municipality.stateRegion,
    overview.municipality.countryCode,
  ].filter(Boolean);
  return parts.join(", ") || formatZoningMissing();
}

export function formatUseList(uses: { useLabel: string }[], emptyLabel = "None listed"): string {
  if (uses.length === 0) return emptyLabel;
  return uses.map((u) => u.useLabel).join("; ");
}

export function formatFar(value: number | null | undefined): string {
  if (value == null) return formatZoningMissing();
  return `${value} FAR`;
}

export function formatDensity(value: number | null | undefined): string {
  if (value == null) return formatZoningMissing();
  return `${value} units/acre`;
}

export function formatHeightFt(value: number | null | undefined): string {
  if (value == null) return formatZoningMissing();
  return `${value} ft`;
}

export function formatLotCoveragePct(value: number | null | undefined): string {
  if (value == null) return formatZoningMissing();
  return `${value}%`;
}

export function formatSetbackFt(value: number | null | undefined): string {
  if (value == null) return formatZoningMissing();
  return `${value} ft`;
}

export function formatSetbacksSummary(dimensional: ZoningDimensionalRegulations | null): string {
  if (!dimensional) return formatZoningMissing();
  const parts = [
    dimensional.setbackFrontFt != null ? `Front ${dimensional.setbackFrontFt} ft` : null,
    dimensional.setbackSideFt != null ? `Side ${dimensional.setbackSideFt} ft` : null,
    dimensional.setbackRearFt != null ? `Rear ${dimensional.setbackRearFt} ft` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : formatZoningMissing();
}

export function formatParking(dimensional: ZoningDimensionalRegulations | null): string {
  const text = dimensional?.parkingRequirementText?.trim();
  return text && text.length > 0 ? text : formatZoningMissing();
}

export function formatOverlays(overview: ParcelZoningOverview | null): string {
  if (!overview || overview.overlays.length === 0) return "None listed";
  return overview.overlays.map((o) => (o.name ? `${o.code} — ${o.name}` : o.code)).join("; ");
}

/** True when at least one dimensional field is present. */
export function hasAnyDimensional(dimensional: ZoningDimensionalRegulations | null): boolean {
  if (!dimensional) return false;
  return (
    dimensional.maxFar != null ||
    dimensional.maxDensityUnitsPerAcre != null ||
    dimensional.maxHeightFt != null ||
    dimensional.maxLotCoveragePct != null ||
    dimensional.setbackFrontFt != null ||
    dimensional.setbackSideFt != null ||
    dimensional.setbackRearFt != null ||
    Boolean(dimensional.parkingRequirementText?.trim())
  );
}

export function pickPrimaryZoning(overviews: ParcelZoningOverview[]): ParcelZoningOverview | null {
  if (overviews.length === 0) return null;
  return overviews.find((z) => z.isPrimary) ?? overviews[0] ?? null;
}
