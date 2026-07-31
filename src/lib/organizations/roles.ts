import type { MembershipStatus, OrganizationRole } from "@/lib/organizations/types";
import { ORGANIZATION_ROLES } from "@/lib/organizations/types";

/** Higher number = more privilege. */
const ROLE_RANK: Record<OrganizationRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function isOrganizationRole(value: string): value is OrganizationRole {
  return (ORGANIZATION_ROLES as readonly string[]).includes(value);
}

export function roleRank(role: OrganizationRole): number {
  return ROLE_RANK[role];
}

/** True when `actual` meets or exceeds `minimum` in the hierarchy. */
export function roleSatisfies(actual: OrganizationRole, minimum: OrganizationRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}

export function canManageMemberships(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageOrganizationSettings(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canWriteOrganizationData(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function isReadOnlyRole(role: OrganizationRole): boolean {
  return role === "viewer";
}

/**
 * Whether an actor may assign `targetRole` to another member.
 * Nobody may grant `owner` except an existing owner (transfer flows later).
 * Actors cannot assign a role higher than their own.
 */
export function canAssignRole(actorRole: OrganizationRole, targetRole: OrganizationRole): boolean {
  if (targetRole === "owner") {
    return actorRole === "owner";
  }
  if (!canManageMemberships(actorRole)) {
    return false;
  }
  return ROLE_RANK[actorRole] >= ROLE_RANK[targetRole];
}

/**
 * Self-elevation check: a user must not change their own role upward
 * (or at all via self-service). Enforced in SQL trigger + this helper.
 */
export function isSelfRoleChangeAttempt(options: {
  actorUserId: string;
  membershipUserId: string;
  previousRole: OrganizationRole;
  nextRole: OrganizationRole;
}): boolean {
  return (
    options.actorUserId === options.membershipUserId && options.previousRole !== options.nextRole
  );
}

export function isActiveMembershipStatus(status: MembershipStatus): boolean {
  return status === "active";
}

export function isMembershipUsable(status: MembershipStatus): boolean {
  return status === "active";
}
