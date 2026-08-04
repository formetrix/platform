import { getPropertyById, listPropertyParcels } from "@/lib/properties/access";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { pickPrimaryZoning } from "@/lib/zoning/format";
import {
  assembleParcelZoningOverview,
  type DimensionalRow,
  type DistrictRow,
  type LandUseRow,
  type MunicipalityRow,
  type OverlayRow,
  type ParcelZoningRow,
} from "@/lib/zoning/mappers";
import type { ParcelZoningOverview } from "@/lib/zoning/types";

const GENERIC_ERROR = "Zoning data could not be loaded. Try again shortly.";

export type ParcelZoningResult =
  | { status: "ok"; overviews: ParcelZoningOverview[]; primary: ParcelZoningOverview | null }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "property_not_found" }
  | { status: "error"; message: string };

export type PropertyZoningResult =
  | {
      status: "ok";
      overviews: ParcelZoningOverview[];
      primary: ParcelZoningOverview | null;
      parcelId: string | null;
    }
  | { status: "unauthenticated"; parcelId: null }
  | { status: "unconfigured"; parcelId: null }
  | { status: "profile_missing"; parcelId: null }
  | { status: "organization_missing"; parcelId: null }
  | { status: "membership_inactive"; parcelId: null }
  | { status: "property_not_found"; parcelId: null }
  | { status: "error"; message: string; parcelId: string | null };

async function loadOverviewsForParcelIds(
  parcelIds: string[],
): Promise<
  { status: "ok"; overviews: ParcelZoningOverview[] } | { status: "error"; message: string }
> {
  if (parcelIds.length === 0) return { status: "ok", overviews: [] };

  try {
    const supabase = await createClient();
    const { data: links, error: linkError } = await supabase
      .from("parcel_zoning")
      .select("*")
      .in("parcel_id", parcelIds);

    if (linkError) return { status: "error", message: GENERIC_ERROR };
    const parcelLinks = (links ?? []) as ParcelZoningRow[];
    if (parcelLinks.length === 0) return { status: "ok", overviews: [] };

    const districtIds = [...new Set(parcelLinks.map((l) => l.district_id))];
    const linkIds = parcelLinks.map((l) => l.id);

    const [
      { data: districts, error: districtError },
      { data: landUses, error: landUseError },
      { data: dimensionals, error: dimensionalError },
      { data: overlayLinks, error: overlayLinkError },
    ] = await Promise.all([
      supabase.from("zoning_districts").select("*").in("id", districtIds),
      supabase.from("zoning_land_uses").select("*").in("district_id", districtIds),
      supabase.from("zoning_dimensional_regulations").select("*").in("district_id", districtIds),
      supabase.from("parcel_zoning_overlays").select("*").in("parcel_zoning_id", linkIds),
    ]);

    if (districtError || landUseError || dimensionalError || overlayLinkError) {
      return { status: "error", message: GENERIC_ERROR };
    }

    const districtRows = (districts ?? []) as DistrictRow[];
    const municipalityIds = [...new Set(districtRows.map((d) => d.municipality_id))];
    const { data: municipalities, error: muniError } = await supabase
      .from("zoning_municipalities")
      .select("*")
      .in("id", municipalityIds);
    if (muniError) return { status: "error", message: GENERIC_ERROR };

    const overlayIds = [
      ...new Set(((overlayLinks ?? []) as { overlay_id: string }[]).map((row) => row.overlay_id)),
    ];
    let overlayRows: OverlayRow[] = [];
    if (overlayIds.length > 0) {
      const { data: overlays, error: overlayError } = await supabase
        .from("zoning_overlays")
        .select("*")
        .in("id", overlayIds);
      if (overlayError) return { status: "error", message: GENERIC_ERROR };
      overlayRows = (overlays ?? []) as OverlayRow[];
    }

    const muniById = new Map(
      ((municipalities ?? []) as MunicipalityRow[]).map((m) => [m.id, m] as const),
    );
    const districtById = new Map(districtRows.map((d) => [d.id, d]));
    const dimensionalByDistrict = new Map(
      ((dimensionals ?? []) as DimensionalRow[]).map((d) => [d.district_id, d]),
    );
    const landUsesByDistrict = new Map<string, LandUseRow[]>();
    for (const use of (landUses ?? []) as LandUseRow[]) {
      const list = landUsesByDistrict.get(use.district_id) ?? [];
      list.push(use);
      landUsesByDistrict.set(use.district_id, list);
    }
    const overlaysByLink = new Map<string, OverlayRow[]>();
    const overlayById = new Map(overlayRows.map((o) => [o.id, o]));
    for (const row of (overlayLinks ?? []) as { parcel_zoning_id: string; overlay_id: string }[]) {
      const overlay = overlayById.get(row.overlay_id);
      if (!overlay) continue;
      const list = overlaysByLink.get(row.parcel_zoning_id) ?? [];
      list.push(overlay);
      overlaysByLink.set(row.parcel_zoning_id, list);
    }

    const overviews: ParcelZoningOverview[] = [];
    for (const link of parcelLinks) {
      const district = districtById.get(link.district_id);
      if (!district) continue;
      const municipality = muniById.get(district.municipality_id);
      if (!municipality) continue;
      overviews.push(
        assembleParcelZoningOverview({
          link,
          municipality,
          district,
          overlays: overlaysByLink.get(link.id) ?? [],
          landUses: landUsesByDistrict.get(district.id) ?? [],
          dimensional: dimensionalByDistrict.get(district.id) ?? null,
        }),
      );
    }

    return { status: "ok", overviews };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

/**
 * Load zoning classifications for a parcel (authenticated, RLS).
 * Returns empty overviews when no zoning is stored — never invents facts.
 */
export async function getParcelZoning(parcelId: string): Promise<ParcelZoningResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const loaded = await loadOverviewsForParcelIds([parcelId]);
  if (loaded.status !== "ok") return loaded;

  return {
    status: "ok",
    overviews: loaded.overviews,
    primary: pickPrimaryZoning(loaded.overviews),
  };
}

/**
 * Load primary-parcel zoning for a Property workspace.
 */
export async function getPropertyZoning(propertyId: string): Promise<PropertyZoningResult> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured", parcelId: null };
  }

  const property = await getPropertyById(propertyId);
  if (property.status !== "ok") {
    if (property.status === "error") {
      return { status: "error", message: property.message, parcelId: null };
    }
    if (
      property.status === "unauthenticated" ||
      property.status === "unconfigured" ||
      property.status === "profile_missing" ||
      property.status === "organization_missing" ||
      property.status === "membership_inactive" ||
      property.status === "property_not_found"
    ) {
      return { status: property.status, parcelId: null };
    }
    return { status: "error", message: GENERIC_ERROR, parcelId: null };
  }

  const parcels = await listPropertyParcels(propertyId);
  if (parcels.status !== "ok") {
    if (parcels.status === "error") {
      return { status: "error", message: parcels.message, parcelId: null };
    }
    if (
      parcels.status === "unauthenticated" ||
      parcels.status === "unconfigured" ||
      parcels.status === "profile_missing" ||
      parcels.status === "organization_missing" ||
      parcels.status === "membership_inactive" ||
      parcels.status === "property_not_found"
    ) {
      return { status: parcels.status, parcelId: null };
    }
    return { status: "error", message: GENERIC_ERROR, parcelId: null };
  }

  const primaryLink = parcels.links.find((l) => l.isPrimary) ?? parcels.links[0] ?? null;
  const parcelId = primaryLink?.parcelId ?? null;
  if (!parcelId) {
    return { status: "ok", overviews: [], primary: null, parcelId: null };
  }

  const loaded = await loadOverviewsForParcelIds([parcelId]);
  if (loaded.status !== "ok") {
    return { status: "error", message: loaded.message, parcelId };
  }

  return {
    status: "ok",
    overviews: loaded.overviews,
    primary: pickPrimaryZoning(loaded.overviews),
    parcelId,
  };
}
