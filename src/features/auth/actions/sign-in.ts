"use server";

import { redirect } from "next/navigation";

import { resolvePostAuthDestination } from "@/lib/auth/account-context";
import { describeSignInError } from "@/lib/auth/messages";
import { validateEmail, validateSubmittedPassword } from "@/lib/auth/validation";
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

/**
 * Email + password sign-in.
 *
 * The password never reaches the browser's JavaScript: the form posts to this
 * Server Action, which is also what lets `@supabase/ssr` write the session
 * cookies through Next's cookie store in one round-trip.
 *
 * Where the user lands is decided server-side by `resolvePostAuthDestination`
 * from verified membership rows — the submitted `next` is only ever a
 * *candidate*, sanitized before use.
 */
export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return formError(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const email = validateEmail(readField(formData, "email"));
  const password = validateSubmittedPassword(readField(formData, "password"));

  const errors: FormErrors = {};
  if (!email.ok) errors.email = email.message;
  if (!password.ok) errors.password = password.message;
  if (!email.ok || !password.ok) {
    return fieldErrors(errors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    return formError(describeSignInError(error));
  }

  const destination = await resolvePostAuthDestination(readField(formData, "next"));
  redirect(destination);
}
