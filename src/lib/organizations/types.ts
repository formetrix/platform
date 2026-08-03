/**
 * Application types for organization membership (FM-0010).
 * Column names map to snake_case in Postgres; this layer uses camelCase.
 */

export const ORGANIZATION_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

/**
 * Membership lifecycle statuses (ADR-0032).
 * Replaces the earlier design sketch `revoked` with `removed`, and adds
 * `suspended` for temporary disable without deleting the row.
 */
export const MEMBERSHIP_STATUSES = ["invited", "active", "suspended", "removed"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export type UserProfile = {
  /** Primary key; equals Supabase Auth user id. */
  id: string;
  /**
   * Auth identity id — always identical to `id` (profile is 1:1 with auth.users).
   * Exposed so call sites can say "auth user" without ambiguity.
   */
  authUserId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  /** Preferred active org; must be verified against an active membership. */
  activeOrganizationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  invitedBy: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationWithMembership = {
  organization: Organization;
  membership: OrganizationMembership;
};
