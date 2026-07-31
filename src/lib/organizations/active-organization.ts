import type { OrganizationMembership, OrganizationWithMembership } from "@/lib/organizations/types";
import { isMembershipUsable } from "@/lib/organizations/roles";

/**
 * Pure V1 active-organization selection (ADR-0030 / FM-0010).
 *
 * Order:
 * 1. Preferred id, if it matches a verified usable (active) membership
 * 2. Otherwise the sole active membership (V1 expects at most one)
 * 3. Otherwise null — caller should send the user to onboarding
 *
 * Client-supplied org ids are never trusted unless present in `memberships`
 * with an active status. Future multi-org switching stores a new preference
 * and re-runs this resolver; UI is deferred (FD-0002).
 */
export function selectActiveOrganizationId(options: {
  preferredOrganizationId: string | null | undefined;
  memberships: ReadonlyArray<Pick<OrganizationMembership, "organizationId" | "status">>;
}): string | null {
  const active = options.memberships.filter((m) => isMembershipUsable(m.status));
  if (active.length === 0) return null;

  if (options.preferredOrganizationId) {
    const match = active.find((m) => m.organizationId === options.preferredOrganizationId);
    if (match) return match.organizationId;
  }

  // V1: unique active membership index means length should be 1.
  return active[0]?.organizationId ?? null;
}

export function selectActiveOrganization(options: {
  preferredOrganizationId: string | null | undefined;
  organizations: ReadonlyArray<OrganizationWithMembership>;
}): OrganizationWithMembership | null {
  const id = selectActiveOrganizationId({
    preferredOrganizationId: options.preferredOrganizationId,
    memberships: options.organizations.map((o) => o.membership),
  });
  if (!id) return null;
  return options.organizations.find((o) => o.organization.id === id) ?? null;
}

/**
 * Rejects unauthorized org access: requested id must match an active membership.
 */
export function assertActiveMembershipForOrganization(
  organizationId: string,
  memberships: ReadonlyArray<Pick<OrganizationMembership, "organizationId" | "status">>,
): boolean {
  return memberships.some(
    (m) => m.organizationId === organizationId && isMembershipUsable(m.status),
  );
}
