"use server";

import { redirect } from "next/navigation";

import { resolvePostAuthDestination } from "@/lib/auth/account-context";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  describePasswordResetRequestError,
  describePasswordUpdateError,
} from "@/lib/auth/messages";
import { buildAuthConfirmUrl } from "@/lib/auth/redirect-urls";
import { validateNewPassword, validatePasswordConfirmation } from "@/lib/auth/validation";
import { validateEmail } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  formDone,
  formError,
  readField,
  SUPABASE_UNCONFIGURED_MESSAGE,
  type AuthFormState,
  type FormErrors,
} from "@/features/auth/lib/form-state";

const EXPIRED_RECOVERY_MESSAGE =
  "This password reset link is no longer valid. Request a new one and open the most recent email.";

/**
 * Sends the password recovery email.
 *
 * The confirmation panel is identical whether or not the address has an
 * account — Supabase deliberately does not report which, and neither does this
 * screen (docs/AUTH_FLOW.md §8.5). Rate limiting is surfaced honestly, because
 * silently doing nothing would leave the user resubmitting forever.
 */
export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return formError(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const email = validateEmail(readField(formData, "email"));
  if (!email.ok) {
    return fieldErrors({ email: email.message });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    // `type` — not `next` — carries the recovery intent: return paths reject
    // every /auth/* path, so the confirm handler routes recovery explicitly.
    redirectTo: buildAuthConfirmUrl({ type: "recovery" }),
  });

  if (error) {
    return formError(describePasswordResetRequestError(error));
  }

  return formDone(
    "Check your email",
    `If ${email.value} has a Formetrix account, a password reset link is on its way. The link works once and expires after a short time.`,
  );
}

/**
 * Sets the new password using the recovery session established by the emailed
 * link. `getAuthenticatedUser()` re-verifies that session against Supabase
 * rather than trusting the cookie, so a stale or forged cookie cannot reach
 * `updateUser`.
 */
export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return formError(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const password = validateNewPassword(readField(formData, "password"));
  const confirmation = validatePasswordConfirmation(
    password.ok ? password.value : readField(formData, "password"),
    readField(formData, "confirmPassword"),
  );

  const errors: FormErrors = {};
  if (!password.ok) errors.password = password.message;
  if (!confirmation.ok) errors.confirmPassword = confirmation.message;
  if (Object.keys(errors).length > 0) {
    return fieldErrors(errors);
  }

  const auth = await getAuthenticatedUser();
  if (auth.status !== "authenticated") {
    return formError(EXPIRED_RECOVERY_MESSAGE);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: password.ok ? password.value : "",
  });

  if (error) {
    return formError(describePasswordUpdateError(error));
  }

  const destination = await resolvePostAuthDestination(null);
  redirect(destination);
}
