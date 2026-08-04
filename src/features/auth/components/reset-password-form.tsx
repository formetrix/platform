"use client";

import { useActionState } from "react";

import { Field, fieldDescribedBy } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordAction } from "@/features/auth/actions/password-reset";
import { FormAlert, SubmitButton } from "@/features/auth/components/form-feedback";
import { initialAuthFormState } from "@/features/auth/lib/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialAuthFormState);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {formMessage ? <FormAlert message={formMessage} /> : null}

      <Field
        htmlFor="password"
        label="New password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
        error={errors.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          autoFocus
          minLength={PASSWORD_MIN_LENGTH}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", {
            hint: true,
            error: Boolean(errors.password),
          })}
        />
      </Field>

      <Field htmlFor="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={fieldDescribedBy("confirmPassword", {
            error: Boolean(errors.confirmPassword),
          })}
        />
      </Field>

      <SubmitButton pendingLabel="Updating password">Update password</SubmitButton>
    </form>
  );
}
