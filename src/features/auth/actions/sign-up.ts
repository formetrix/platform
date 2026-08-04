"use server";

import { redirect } from "next/navigation";

import { resolvePostAuthDestination } from "@/lib/auth/account-context";
import { describeSignUpError } from "@/lib/auth/messages";
import { buildAuthConfirmUrl } from "@/lib/auth/redirect-urls";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import {
  validateEmail,
  validateFullName,
  validateNewPassword,
  validatePasswordConfirmation,
  validateTermsAccepted,
} from "@/lib/auth/validation";
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

/**
 * Creates the Supabase Auth user. The matching `user_profiles` row is created
 * by the `on_auth_user_created` trigger (migration 20260804070000), so a signed-in
 * user can never exist without a profile.
 *
 * When the project requires email confirmation, Supabase returns a user but no
 * session — that is the verification state, not a failure. The same
 * "check your email" panel is shown whether or not the address was already
 * registered, so the screen cannot be used to enumerate accounts
 * (docs/AUTH_FLOW.md §8.5).
 */
export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return formError(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const fullName = validateFullName(readField(formData, "fullName"));
  const email = validateEmail(readField(formData, "email"));
  const password = validateNewPassword(readField(formData, "password"));
  const confirmation = validatePasswordConfirmation(
    password.ok ? password.value : readField(formData, "password"),
    readField(formData, "confirmPassword"),
  );
  const terms = validateTermsAccepted(formData.get("terms"));

  const errors: FormErrors = {};
  if (!fullName.ok) errors.fullName = fullName.message;
  if (!email.ok) errors.email = email.message;
  if (!password.ok) errors.password = password.message;
  if (!confirmation.ok) errors.confirmPassword = confirmation.message;
  if (!terms.ok) errors.terms = terms.message;
  if (Object.keys(errors).length > 0) {
    return fieldErrors(errors);
  }

  const next = sanitizeReturnPath(readField(formData, "next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.ok ? email.value : "",
    password: password.ok ? password.value : "",
    options: {
      data: { full_name: fullName.ok ? fullName.value : "" },
      emailRedirectTo: buildAuthConfirmUrl({ next }),
    },
  });

  if (error) {
    return formError(describeSignUpError(error));
  }

  if (!data.session) {
    return formDone(
      "Confirm your email address",
      `If that address can be used, a verification link is on its way to ${email.ok ? email.value : "your inbox"}. Open it to finish setting up your Formetrix account. The link expires after a short time — request a new one from the sign-in page if it does.`,
    );
  }

  // Email confirmation disabled for this project: the user is already signed in.
  const destination = await resolvePostAuthDestination(next);
  redirect(destination);
}
