"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signUpAction } from "@/features/auth/actions/sign-up";
import { FormAlert, FormSuccess, SubmitButton } from "@/features/auth/components/form-feedback";
import { initialAuthFormState } from "@/features/auth/lib/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signUpAction, initialAuthFormState);

  // Terminal state: the account exists and the verification email has been sent.
  // Re-rendering the form here would invite a duplicate submission.
  if (state.status === "done") {
    return (
      <FormSuccess heading={state.heading} body={state.body}>
        <Link href={SIGN_IN_PATH} className={buttonVariants({ variant: "secondary" })}>
          Continue to sign in
        </Link>
      </FormSuccess>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {formMessage ? <FormAlert message={formMessage} /> : null}

      <Field htmlFor="fullName" label="Full name" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          autoFocus
          placeholder="Jordan Ellis"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={fieldDescribedBy("fullName", { error: Boolean(errors.fullName) })}
        />
      </Field>

      <Field htmlFor="email" label="Work email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", { error: Boolean(errors.email) })}
        />
      </Field>

      <Field
        htmlFor="password"
        label="Password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
        error={errors.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", {
            hint: true,
            error: Boolean(errors.password),
          })}
        />
      </Field>

      <Field htmlFor="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="terms"
            name="terms"
            value="accepted"
            required
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={fieldDescribedBy("terms", { error: Boolean(errors.terms) })}
          />
          <label htmlFor="terms" className="text-muted text-sm">
            I agree to the Formetrix terms of service and privacy policy.
          </label>
        </div>
        {errors.terms ? (
          <p id="terms-error" role="alert" className="text-danger text-xs font-medium">
            {errors.terms}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Creating account">Create account</SubmitButton>
    </form>
  );
}
