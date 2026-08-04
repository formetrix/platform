/**
 * Where a visitor goes immediately after authenticating (FM-0006A).
 *
 * Pure decision logic, kept apart from the Supabase lookup that feeds it so the
 * routing rule itself is unit-testable. The lookup lives in
 * `@/lib/auth/account-context`.
 */

import { ORGANIZATION_SETUP_PATH } from "@/lib/auth/routes";
import { sanitizeReturnPath } from "@/lib/auth/return-path";

/**
 * Collapses the organization-lookup outcomes into the three routing cases that
 * matter. `unknown` means the lookup itself failed — treat it as "carry on to
 * the requested page" rather than as "no organization", because sending a user
 * with an existing organization to setup would invite a duplicate one.
 */
export type OrganizationPresence = "present" | "absent" | "unknown";

/**
 * First-login rule: a verified user with no usable organization must set one up
 * before any organization-scoped screen can mean anything. Everyone else
 * continues to their sanitized return path.
 */
export function choosePostAuthDestination(options: {
  organization: OrganizationPresence;
  next?: string | null;
}): string {
  if (options.organization === "absent") {
    return ORGANIZATION_SETUP_PATH;
  }
  return sanitizeReturnPath(options.next);
}
