import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { choosePostAuthDestination, type OrganizationPresence } from "@/lib/auth/post-auth";
import { getCurrentOrganization } from "@/lib/organizations/access";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side account resolution used right after authentication (FM-0006A).
 *
 * Every value here comes from Supabase's verified `getUser()` round-trip and
 * from rows the database returns under RLS — never from a form field, cookie
 * value, or query parameter naming a user (FORMETRIX.md §19).
 */

/**
 * Repairs a missing `user_profiles` row for the signed-in user.
 *
 * The `on_auth_user_created` trigger (migration 20260804070000) is the primary
 * path; this covers users created before it existed and the deliberately
 * non-fatal case where the trigger swallowed an error rather than blocking
 * account creation. Writes only the caller's own row — RLS policy
 * `user_profiles_insert_own` would reject anything else.
 */
export async function ensureUserProfile(): Promise<void> {
  const auth = await getAuthenticatedUser();
  if (auth.status !== "authenticated") return;

  const email = auth.user.email;
  if (!email) return;

  const metadata = auth.user.user_metadata as { full_name?: unknown } | null;
  const fullName = typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";

  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (existing) return;

    await supabase.from("user_profiles").insert({
      id: auth.user.id,
      email,
      display_name: fullName.length > 0 ? fullName : null,
    });
  } catch {
    // A profile that cannot be written must not break the sign-in redirect.
    // The organization-setup RPC creates the row as its own fallback.
  }
}

async function resolveOrganizationPresence(): Promise<OrganizationPresence> {
  const result = await getCurrentOrganization();
  switch (result.status) {
    case "ok":
      return "present";
    case "organization_missing":
    case "membership_inactive":
    case "profile_missing":
      return "absent";
    default:
      // unauthenticated / unconfigured / error — do not claim the user has no
      // organization on the strength of a failed lookup.
      return "unknown";
  }
}

/**
 * The path to send a freshly authenticated user to: organization setup on first
 * login, otherwise their sanitized `next` (default `/properties`).
 */
export async function resolvePostAuthDestination(next?: string | null): Promise<string> {
  await ensureUserProfile();
  const organization = await resolveOrganizationPresence();
  return choosePostAuthDestination({ organization, next });
}
