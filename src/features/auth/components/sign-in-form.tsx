"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signInAction } from "@/features/auth/actions/sign-in";
import { FormAlert, SubmitButton } from "@/features/auth/components/form-feedback";
import { initialAuthFormState } from "@/features/auth/lib/form-state";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/routes";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initialAuthFormState);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {/* Server-side sanitized before use; the value here is only a candidate. */}
      <input type="hidden" name="next" value={next} />

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

      <Field
        htmlFor="password"
        label="Password"
        error={errors.password}
        action={
          <Link
            href={FORGOT_PASSWORD_PATH}
            className="text-primary text-xs font-medium underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", { error: Boolean(errors.password) })}
        />
      </Field>

      <SubmitButton pendingLabel="Signing in">Sign in</SubmitButton>
    </form>
  );
}
