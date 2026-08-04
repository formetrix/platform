"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonVariant } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/sign-out";

function SignOutSubmit({ variant, label }: { variant: ButtonVariant; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending} aria-busy={pending}>
      {pending ? "Signing out…" : label}
    </Button>
  );
}

/**
 * Posts to the sign-out Server Action.
 *
 * A form rather than an onClick handler, so the session is cleared server-side
 * where the auth cookies actually live, and so it still works if the client
 * bundle has not hydrated yet.
 */
export function SignOutButton({
  variant = "ghost",
  label = "Sign out",
}: {
  variant?: ButtonVariant;
  label?: string;
}) {
  return (
    <form action={signOutAction}>
      <SignOutSubmit variant={variant} label={label} />
    </form>
  );
}
