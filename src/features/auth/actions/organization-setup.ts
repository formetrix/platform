"use server";

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { validateOrganizationName } from "@/lib/auth/validation";
import { validateOrganizationSlug } from "@/lib/organizations/slug";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  formError,
  readField,
  SUPABASE_UNCONFIGURED_MESSAGE,
  type AuthFormState,
  type FormErrors,
} from "@/features/auth/lib/form-state";

/** Status strings returned by public.create_organization_with_owner. */
type CreateOrganizationStatus =
  | "ok"
  | "unauthenticated"
  | "invalid_name"
  | "invalid_slug"
  | "profile_missing"
  | "already_member"
  | "slug_taken"
  | "conflict";

function statusOf(payload: unknown): CreateOrganizationStatus | null {
  if (typeof payload !== "object" || payload === null) return null;
  const status = (payload as { status?: unknown }).status;
  return typeof status === "string" ? (status as CreateOrganizationStatus) : null;
}

/**
 * First-login organization setup.
 *
 * Delegates to `public.create_organization_with_owner`, which creates the
 * Organization, the owner Membership, and the active-organization preference in
 * a single transaction. Splitting that across three client calls can strand an
 * organization with no owner if a later call fails — and an organization nobody
 * can administer is unrecoverable without service-role access.
 *
 * The function derives its actor from `auth.uid()`, so no user id crosses the
 * wire from the browser.
 */
export async function createOrganizationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return formError(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const auth = await getAuthenticatedUser();
  if (auth.status !== "authenticated") {
    return formError("Your session has expired. Sign in again to continue.");
  }

  const name = validateOrganizationName(readField(formData, "name"));
  const slugInput = readField(formData, "slug");
  const slug = validateOrganizationSlug(slugInput);

  const errors: FormErrors = {};
  if (!name.ok) errors.name = name.message;
  if (slugInput.trim().length === 0) {
    errors.slug = "Enter a workspace URL.";
  } else if (!slug.ok) {
    errors.slug = slug.reason;
  }
  if (Object.keys(errors).length > 0) {
    return fieldErrors(errors);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: name.ok ? name.value : "",
    p_slug: slug.ok ? slug.slug : "",
  });

  if (error) {
    return formError("The organization could not be created. Try again in a moment.");
  }

  const status = statusOf(data);

  // `already_member` is a success from the user's point of view — a resubmit or
  // a second tab, not an error to show them.
  if (status !== "ok" && status !== "already_member") {
    switch (status) {
      case "slug_taken":
      case "conflict":
        return fieldErrors({ slug: "That workspace URL is taken. Try another." });
      case "invalid_name":
        return fieldErrors({ name: "Use between 2 and 80 characters." });
      case "invalid_slug":
        return fieldErrors({ slug: "Use lowercase letters, numbers, and single hyphens." });
      case "unauthenticated":
        return formError("Your session has expired. Sign in again to continue.");
      default:
        return formError("The organization could not be created. Try again in a moment.");
    }
  }

  redirect(sanitizeReturnPath(readField(formData, "next")));
}
