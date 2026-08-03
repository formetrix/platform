import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  assertActiveMembershipForOrganization,
  selectActiveOrganization,
} from "@/lib/organizations/active-organization";
import {
  mapOrganization,
  mapOrganizationMembership,
  mapUserProfile,
} from "@/lib/organizations/mappers";
import { isMembershipUsable, roleSatisfies } from "@/lib/organizations/roles";
import type {
  Organization,
  OrganizationMembership,
  OrganizationRole,
  OrganizationWithMembership,
  UserProfile,
} from "@/lib/organizations/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ProfileResult =
  | { status: "ok"; profile: UserProfile }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "error"; message: string };

export type OrganizationResult =
  | {
      status: "ok";
      organization: Organization;
      membership: OrganizationMembership;
      profile: UserProfile;
    }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "error"; message: string };

export type MembershipRequirementResult =
  | {
      status: "ok";
      organization: Organization;
      membership: OrganizationMembership;
      profile: UserProfile;
    }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "organization_missing" }
  | { status: "membership_inactive" }
  | { status: "insufficient_role" }
  | { status: "error"; message: string };

export type ListOrganizationsResult =
  | { status: "ok"; items: OrganizationWithMembership[]; profile: UserProfile }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "profile_missing" }
  | { status: "error"; message: string };

const GENERIC_ERROR = "Organization access could not be verified. Try again shortly.";

async function loadProfileForAuthUser(authUserId: string): Promise<ProfileResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, email, display_name, avatar_url, active_organization_id, created_at, updated_at")
      .eq("id", authUserId)
      .maybeSingle();

    if (error) {
      return { status: "error", message: GENERIC_ERROR };
    }
    if (!data) {
      return { status: "profile_missing" };
    }
    return { status: "ok", profile: mapUserProfile(data) };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

/**
 * Loads the application profile for the verified Auth user.
 */
export async function getCurrentUserProfile(): Promise<ProfileResult> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured" };
  }

  const auth = await getAuthenticatedUser();
  if (auth.status === "unconfigured") return { status: "unconfigured" };
  if (auth.status === "unauthenticated") return { status: "unauthenticated" };
  if (auth.status === "error") return { status: "error", message: auth.message };

  return loadProfileForAuthUser(auth.user.id);
}

async function loadUserOrganizations(profile: UserProfile): Promise<ListOrganizationsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_memberships")
      .select(
        `
        id, organization_id, user_id, role, status, invited_by, joined_at, created_at, updated_at,
        organizations (
          id, name, slug, created_by, created_at, updated_at
        )
      `,
      )
      .eq("user_id", profile.id);

    if (error) {
      return { status: "error", message: GENERIC_ERROR };
    }

    const items: OrganizationWithMembership[] = [];
    for (const row of data ?? []) {
      const membership = mapOrganizationMembership({
        id: row.id,
        organization_id: row.organization_id,
        user_id: row.user_id,
        role: row.role,
        status: row.status,
        invited_by: row.invited_by,
        joined_at: row.joined_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      const orgRaw = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      if (!membership || !orgRaw) continue;
      items.push({
        membership,
        organization: mapOrganization(orgRaw),
      });
    }

    return { status: "ok", items, profile };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

/**
 * Lists organizations the current user belongs to (any membership status).
 * Callers typically filter to `status === "active"` for workspace access.
 */
export async function listUserOrganizations(): Promise<ListOrganizationsResult> {
  const profileResult = await getCurrentUserProfile();
  if (profileResult.status !== "ok") {
    return profileResult;
  }
  return loadUserOrganizations(profileResult.profile);
}

/**
 * Resolves the V1 active organization from verified memberships + stored preference.
 * Does not trust client query parameters as authorization proof.
 */
export async function getCurrentOrganization(): Promise<OrganizationResult> {
  const listed = await listUserOrganizations();
  if (listed.status !== "ok") {
    return listed;
  }

  const activeItems = listed.items.filter((item) => isMembershipUsable(item.membership.status));
  if (activeItems.length === 0) {
    return { status: "organization_missing" };
  }

  const selected = selectActiveOrganization({
    preferredOrganizationId: listed.profile.activeOrganizationId,
    organizations: activeItems,
  });

  if (!selected) {
    return { status: "organization_missing" };
  }

  if (!isMembershipUsable(selected.membership.status)) {
    return { status: "membership_inactive" };
  }

  return {
    status: "ok",
    organization: selected.organization,
    membership: selected.membership,
    profile: listed.profile,
  };
}

/**
 * Requires an active membership in `organizationId`.
 * Client-supplied ids are accepted only after membership verification.
 */
export async function requireOrganizationMembership(
  organizationId: string,
): Promise<MembershipRequirementResult> {
  if (!organizationId) {
    return { status: "organization_missing" };
  }

  const listed = await listUserOrganizations();
  if (listed.status !== "ok") {
    return listed;
  }

  if (
    !assertActiveMembershipForOrganization(
      organizationId,
      listed.items.map((i) => i.membership),
    )
  ) {
    const any = listed.items.find((i) => i.organization.id === organizationId);
    if (!any) return { status: "organization_missing" };
    return { status: "membership_inactive" };
  }

  const match = listed.items.find((i) => i.organization.id === organizationId);
  if (!match) {
    return { status: "organization_missing" };
  }

  return {
    status: "ok",
    organization: match.organization,
    membership: match.membership,
    profile: listed.profile,
  };
}

/**
 * Requires an active membership whose role meets or exceeds `minimumRole`.
 */
export async function requireOrganizationRole(
  organizationId: string,
  minimumRole: OrganizationRole,
): Promise<MembershipRequirementResult> {
  const membership = await requireOrganizationMembership(organizationId);
  if (membership.status !== "ok") {
    return membership;
  }

  if (!roleSatisfies(membership.membership.role, minimumRole)) {
    return { status: "insufficient_role" };
  }

  return membership;
}
