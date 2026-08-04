"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/features/auth/actions/password-reset";
import { FormAlert, FormSuccess, SubmitButton } from "@/features/auth/components/form-feedback";
import { initialAuthFormState } from "@/features/auth/lib/form-state";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialAuthFormState);

  if (state.status === "done") {
    return (
      <FormSuccess heading={state.heading} body={state.body}>
        <Link href={SIGN_IN_PATH} className={buttonVariants({ variant: "secondary" })}>
          Back to sign in
        </Link>
      </FormSuccess>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {formMessage ? <FormAlert message={formMessage} /> : null}

      <Field htmlFor="email" label="Email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", { error: Boolean(errors.email) })}
        />
      </Field>

      <SubmitButton pendingLabel="Sending link">Send reset link</SubmitButton>
    </form>
  );
}
