import type {
  MembershipStatus,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  UserProfile,
} from "@/lib/organizations/types";
import { isOrganizationRole } from "@/lib/organizations/roles";
import { MEMBERSHIP_STATUSES } from "@/lib/organizations/types";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  active_organization_id: string | null;
  created_at: string;
  updated_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

function isMembershipStatus(value: string): value is MembershipStatus {
  return (MEMBERSHIP_STATUSES as readonly string[]).includes(value);
}

export function mapUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    activeOrganizationId: row.active_organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrganizationMembership(row: MembershipRow): OrganizationMembership | null {
  if (!isOrganizationRole(row.role) || !isMembershipStatus(row.status)) {
    return null;
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role as OrganizationRole,
    status: row.status,
    invitedBy: row.invited_by,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
