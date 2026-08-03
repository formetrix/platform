/**
 * Organization ownership checks for Properties.
 * Client-supplied organization ids are never sufficient alone — callers must
 * also verify membership via `@/lib/organizations`.
 */

export function propertyBelongsToOrganization(
  propertyOrganizationId: string,
  organizationId: string,
): boolean {
  return (
    Boolean(propertyOrganizationId) &&
    Boolean(organizationId) &&
    propertyOrganizationId === organizationId
  );
}

export function assertPropertyOrganizationAccess(options: {
  propertyOrganizationId: string;
  activeOrganizationId: string;
  isActiveMember: boolean;
}): boolean {
  if (!options.isActiveMember) return false;
  return propertyBelongsToOrganization(
    options.propertyOrganizationId,
    options.activeOrganizationId,
  );
}
