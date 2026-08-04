"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

/**
 * Form-level error banner (as opposed to a single field's message).
 *
 * `role="alert"` so the failure is announced, and a leading dot plus text —
 * never color alone — carries the meaning (FORMETRIX.md §17).
 */
export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="border-danger/40 bg-danger/10 text-danger flex items-start gap-2 rounded-lg border p-3 text-sm"
    >
      <span aria-hidden className="bg-danger mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
      <p>{message}</p>
    </div>
  );
}

/** Terminal success panel — e.g. "we sent you a verification link". */
export function FormSuccess({
  heading,
  body,
  children,
}: {
  heading: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className="border-success/40 bg-success/10 flex flex-col gap-1.5 rounded-lg border p-4"
      >
        <p className="text-success text-sm font-semibold">{heading}</p>
        <p className="text-foreground/90 text-sm">{body}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Submit button that reflects the pending state of its own form.
 *
 * `useFormStatus` reads the enclosing form, so this stays correct without the
 * page threading a loading flag down — and disabling during flight is what
 * stops a double submission creating two accounts.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      className={cn("w-full", className)}
    >
      {pending ? (
        <>
          <Spinner className="h-4 w-4 border-current border-t-transparent" label={pendingLabel} />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
