import { requireOrganizationMembership, requireOrganizationRole } from "@/lib/organizations/access";
import { canWriteOrganizationData } from "@/lib/organizations/roles";
import { validateLatLngPair } from "@/lib/properties/geometry";
import { mapParcel, mapProperty, mapPropertyParcel } from "@/lib/properties/mappers";
import { planAttachParcel } from "@/lib/properties/primary-parcel";
import { isPropertyStatus, validatePropertyStatusTransition } from "@/lib/properties/status";
import type {
  CreatePropertyInput,
  Parcel,
  Property,
  PropertyParcel,
  PropertyParcelRelationshipType,
  UpdatePropertyInput,
} from "@/lib/properties/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Property access could not be verified. Try again shortly.";

type ParcelGeoJsonRow = {
  parcel_id: string;
  geometry_geojson: Record<string, unknown> | null;
  centroid_geojson: Record<string, unknown> | null;
};

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

/**
 * Attach ST_AsGeoJSON payloads for Mapbox (FM-0015).
 * Soft-fails when the RPC is not yet applied — map empty-state still works.
 */
async function enrichParcelsWithGeoJson(
  supabase: SupabaseRpcClient,
  parcels: Parcel[],
): Promise<Parcel[]> {
  if (parcels.length === 0) return parcels;

  const { data, error } = await supabase.rpc("parcel_geometries_geojson", {
    p_parcel_ids: parcels.map((p) => p.id),
  });
  if (error || !Array.isArray(data)) return parcels;

  const byId = new Map<string, ParcelGeoJsonRow>();
  for (const row of data as ParcelGeoJsonRow[]) {
    if (row?.parcel_id) byId.set(row.parcel_id, row);
  }

  return parcels.map((parcel) => {
    const geo = byId.get(parcel.id);
    if (!geo) return parcel;
    const geometryGeoJson = geo.geometry_geojson ?? parcel.geometry.geometryGeoJson;
    const centroidGeoJson = geo.centroid_geojson ?? parcel.geometry.centroidGeoJson;
    return {
      ...parcel,
      geometry: {
        ...parcel.geometry,
        geometryGeoJson,
        centroidGeoJson,
        hasGeometry: parcel.geometry.hasGeometry || Boolean(geometryGeoJson),
      },
    };
  });
}

export type PropertyResult =
  | { status: "ok"; property: Property }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "property_not_found" }
  | { status: "invalid_geometry" }
  | { status: "error"; message: string };

export type PropertyListResult =
  | { status: "ok"; properties: Property[] }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "error"; message: string };

export type AttachParcelResult =
  | { status: "ok"; link: PropertyParcel }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "property_not_found" }
  | { status: "parcel_not_found" }
  | { status: "duplicate_relationship" }
  | { status: "invalid_geometry" }
  | { status: "error"; message: string };

export type PropertyParcelsResult =
  | { status: "ok"; links: PropertyParcel[]; parcels: Parcel[] }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "property_not_found" }
  | { status: "invalid_geometry" }
  | { status: "error"; message: string };

async function fetchPropertyRow(propertyId: string) {
  const supabase = await createClient();
  return supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
}

/**
 * Load a Property by id after verifying the caller is an active member of its org.
 */
export async function getPropertyById(propertyId: string): Promise<PropertyResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };
  if (!propertyId) return { status: "property_not_found" };

  try {
    const { data, error } = await fetchPropertyRow(propertyId);
    if (error) return { status: "error", message: GENERIC_ERROR };
    if (!data) return { status: "property_not_found" };

    const membership = await requireOrganizationMembership(data.organization_id);
    if (membership.status !== "ok") return membership;

    const property = mapProperty(data);
    if (!property) return { status: "error", message: GENERIC_ERROR };
    return { status: "ok", property };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function listOrganizationProperties(
  organizationId: string,
): Promise<PropertyListResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const membership = await requireOrganizationMembership(organizationId);
  if (membership.status !== "ok") return membership;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) return { status: "error", message: GENERIC_ERROR };

    const properties: Property[] = [];
    for (const row of data ?? []) {
      const mapped = mapProperty(row);
      if (mapped) properties.push(mapped);
    }
    return { status: "ok", properties };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const membership = await requireOrganizationRole(input.organizationId, "member");
  if (membership.status !== "ok") return membership;
  if (!canWriteOrganizationData(membership.membership.role)) {
    return { status: "insufficient_role" };
  }

  const latLng = validateLatLngPair(input.latitude, input.longitude);
  if (!latLng.ok) return { status: "invalid_geometry" };

  const status = input.status ?? "discovered";
  if (!isPropertyStatus(status)) return { status: "error", message: "Invalid property status." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .insert({
        organization_id: input.organizationId,
        name: input.name.trim(),
        status,
        address_line_1: input.addressLine1 ?? null,
        address_line_2: input.addressLine2 ?? null,
        city: input.city ?? null,
        state_region: input.stateRegion ?? null,
        postal_code: input.postalCode ?? null,
        country_code: input.countryCode ?? null,
        latitude: latLng.latitude,
        longitude: latLng.longitude,
        created_by: membership.profile.id,
      })
      .select("*")
      .single();

    if (error || !data) return { status: "error", message: GENERIC_ERROR };
    const property = mapProperty(data);
    if (!property) return { status: "error", message: GENERIC_ERROR };
    return { status: "ok", property };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function updateProperty(
  propertyId: string,
  patch: UpdatePropertyInput,
): Promise<PropertyResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const existing = await getPropertyById(propertyId);
  if (existing.status !== "ok") return existing;

  const membership = await requireOrganizationRole(existing.property.organizationId, "member");
  if (membership.status !== "ok") return membership;

  if (patch.status && patch.status !== existing.property.status) {
    const transition = validatePropertyStatusTransition(existing.property.status, patch.status);
    if (!transition.ok) {
      return { status: "error", message: transition.reason };
    }
  }

  const latLng = validateLatLngPair(
    patch.latitude === undefined ? existing.property.latitude : patch.latitude,
    patch.longitude === undefined ? existing.property.longitude : patch.longitude,
  );
  if (!latLng.ok) return { status: "invalid_geometry" };

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.status !== undefined) {
    updates.status = patch.status;
    updates.archived_at =
      patch.status === "archived" ? (patch.archivedAt ?? new Date().toISOString()) : null;
  }
  if (patch.addressLine1 !== undefined) updates.address_line_1 = patch.addressLine1;
  if (patch.addressLine2 !== undefined) updates.address_line_2 = patch.addressLine2;
  if (patch.city !== undefined) updates.city = patch.city;
  if (patch.stateRegion !== undefined) updates.state_region = patch.stateRegion;
  if (patch.postalCode !== undefined) updates.postal_code = patch.postalCode;
  if (patch.countryCode !== undefined) updates.country_code = patch.countryCode;
  if (patch.latitude !== undefined || patch.longitude !== undefined) {
    updates.latitude = latLng.latitude;
    updates.longitude = latLng.longitude;
  }
  if (patch.archivedAt !== undefined && patch.status === undefined) {
    updates.archived_at = patch.archivedAt;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", propertyId)
      .select("*")
      .single();

    if (error || !data) return { status: "error", message: GENERIC_ERROR };
    const property = mapProperty(data);
    if (!property) return { status: "error", message: GENERIC_ERROR };
    return { status: "ok", property };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function listPropertyParcels(propertyId: string): Promise<PropertyParcelsResult> {
  const property = await getPropertyById(propertyId);
  if (property.status !== "ok") return property;

  try {
    const supabase = await createClient();
    const { data: links, error: linkError } = await supabase
      .from("property_parcels")
      .select("*")
      .eq("property_id", propertyId);

    if (linkError) return { status: "error", message: GENERIC_ERROR };

    const mappedLinks: PropertyParcel[] = [];
    for (const row of links ?? []) {
      const mapped = mapPropertyParcel(row);
      if (mapped) mappedLinks.push(mapped);
    }

    const parcelIds = mappedLinks.map((l) => l.parcelId);
    let parcels: Parcel[] = [];
    if (parcelIds.length > 0) {
      const { data: parcelRows, error: parcelError } = await supabase
        .from("parcels")
        .select("*")
        .in("id", parcelIds);
      if (parcelError) return { status: "error", message: GENERIC_ERROR };
      parcels = (parcelRows ?? []).map(mapParcel);
      parcels = await enrichParcelsWithGeoJson(supabase, parcels);
    }

    return { status: "ok", links: mappedLinks, parcels };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function attachParcelToProperty(options: {
  propertyId: string;
  parcelId: string;
  relationshipType?: PropertyParcelRelationshipType;
  isPrimary?: boolean;
}): Promise<AttachParcelResult> {
  const listed = await listPropertyParcels(options.propertyId);
  if (listed.status !== "ok") return listed;

  const property = await getPropertyById(options.propertyId);
  if (property.status !== "ok") return property;

  const membership = await requireOrganizationRole(property.property.organizationId, "member");
  if (membership.status !== "ok") return membership;

  const plan = planAttachParcel({
    existing: listed.links.map((l) => ({ parcelId: l.parcelId, isPrimary: l.isPrimary })),
    parcelId: options.parcelId,
    isPrimary: options.isPrimary ?? false,
  });
  if (!plan.ok) {
    if (plan.reason === "duplicate_relationship") {
      return { status: "duplicate_relationship" };
    }
    return { status: "error", message: "A property may have at most one primary parcel." };
  }

  try {
    const supabase = await createClient();
    const { data: parcel, error: parcelError } = await supabase
      .from("parcels")
      .select("id")
      .eq("id", options.parcelId)
      .maybeSingle();
    if (parcelError) return { status: "error", message: GENERIC_ERROR };
    if (!parcel) return { status: "parcel_not_found" };

    if (options.isPrimary) {
      await supabase
        .from("property_parcels")
        .update({ is_primary: false })
        .eq("property_id", options.propertyId)
        .eq("is_primary", true);
    }

    const { data, error } = await supabase
      .from("property_parcels")
      .insert({
        property_id: options.propertyId,
        parcel_id: options.parcelId,
        relationship_type: options.relationshipType ?? "component",
        is_primary: options.isPrimary ?? false,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") return { status: "duplicate_relationship" };
      return { status: "error", message: GENERIC_ERROR };
    }

    const link = mapPropertyParcel(data);
    if (!link) return { status: "error", message: GENERIC_ERROR };
    return { status: "ok", link };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}
