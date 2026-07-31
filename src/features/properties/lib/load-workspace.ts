import { getCurrentOrganization } from "@/lib/organizations";
import {
  getPropertyById,
  listOrganizationProperties,
  listPropertyParcels,
  type Property,
  type Parcel,
  type PropertyParcel,
} from "@/lib/properties";
import { isRegridConfigured } from "@/lib/regrid";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type WorkspaceView = {
  property: Property;
  organizationName: string;
  organizationId: string;
  primaryParcel: Parcel | null;
  parcels: Parcel[];
  links: PropertyParcel[];
  regridConfigured: boolean;
};

export type LoadWorkspaceResult =
  | { status: "ok"; view: WorkspaceView }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type LoadPropertiesListResult =
  | {
      status: "ok";
      organizationName: string;
      organizationId: string;
      properties: Property[];
      regridConfigured: boolean;
    }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "error"; message: string };

function pickPrimaryParcel(links: PropertyParcel[], parcels: Parcel[]): Parcel | null {
  const byId = new Map(parcels.map((p) => [p.id, p]));
  const primaryLink = links.find((l) => l.isPrimary) ?? links[0];
  if (!primaryLink) return null;
  return byId.get(primaryLink.parcelId) ?? null;
}

/**
 * Load a Property workspace view from live services (no mock data).
 */
export async function loadPropertyWorkspace(propertyId: string): Promise<LoadWorkspaceResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const propertyResult = await getPropertyById(propertyId);
  if (propertyResult.status === "property_not_found") return { status: "not_found" };
  if (propertyResult.status !== "ok") {
    if (
      propertyResult.status === "unconfigured" ||
      propertyResult.status === "unauthenticated" ||
      propertyResult.status === "profile_missing" ||
      propertyResult.status === "organization_missing" ||
      propertyResult.status === "membership_inactive"
    ) {
      return { status: propertyResult.status };
    }
    return {
      status: "error",
      message:
        propertyResult.status === "error" ? propertyResult.message : "Unable to load property.",
    };
  }

  const parcelsResult = await listPropertyParcels(propertyId);
  if (parcelsResult.status !== "ok") {
    if (
      parcelsResult.status === "unconfigured" ||
      parcelsResult.status === "unauthenticated" ||
      parcelsResult.status === "profile_missing" ||
      parcelsResult.status === "organization_missing" ||
      parcelsResult.status === "membership_inactive"
    ) {
      return { status: parcelsResult.status };
    }
    if (parcelsResult.status === "property_not_found") return { status: "not_found" };
    return {
      status: "error",
      message: parcelsResult.status === "error" ? parcelsResult.message : "Unable to load parcels.",
    };
  }

  const org = await getCurrentOrganization();
  const organizationName =
    org.status === "ok" && org.organization.id === propertyResult.property.organizationId
      ? org.organization.name
      : "Organization";

  return {
    status: "ok",
    view: {
      property: propertyResult.property,
      organizationName,
      organizationId: propertyResult.property.organizationId,
      primaryParcel: pickPrimaryParcel(parcelsResult.links, parcelsResult.parcels),
      parcels: parcelsResult.parcels,
      links: parcelsResult.links,
      regridConfigured: isRegridConfigured(),
    },
  };
}

/**
 * List Properties for the caller's active Organization.
 */
export async function loadPropertiesList(): Promise<LoadPropertiesListResult> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const org = await getCurrentOrganization();
  if (org.status !== "ok") {
    if (
      org.status === "unconfigured" ||
      org.status === "unauthenticated" ||
      org.status === "profile_missing" ||
      org.status === "organization_missing" ||
      org.status === "membership_inactive"
    ) {
      return { status: org.status };
    }
    return {
      status: "error",
      message: org.status === "error" ? org.message : "Unable to load organization.",
    };
  }

  const listed = await listOrganizationProperties(org.organization.id);
  if (listed.status !== "ok") {
    if (
      listed.status === "unconfigured" ||
      listed.status === "unauthenticated" ||
      listed.status === "profile_missing" ||
      listed.status === "organization_missing" ||
      listed.status === "membership_inactive"
    ) {
      return { status: listed.status };
    }
    return {
      status: "error",
      message: listed.status === "error" ? listed.message : "Unable to load properties.",
    };
  }

  return {
    status: "ok",
    organizationName: org.organization.name,
    organizationId: org.organization.id,
    properties: listed.properties,
    regridConfigured: isRegridConfigured(),
  };
}
