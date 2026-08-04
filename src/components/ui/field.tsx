import { type LabelHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-foreground text-sm font-medium", className)} {...props} />;
}

export interface FieldProps {
  /** Must match the control's `id` so clicking the label focuses it. */
  htmlFor: string;
  label: string;
  /** Rendered before the control; use for format guidance, not for errors. */
  hint?: ReactNode;
  /** Present only when the field failed validation. */
  error?: string | null;
  /** Right-aligned link or control on the label row (e.g. "Forgot password?"). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * One labelled form control with its hint and error text.
 *
 * The error carries `role="alert"` and an `id` the control references through
 * `aria-describedby`, so a screen reader announces the failure rather than
 * leaving the user with a red border they cannot perceive (FORMETRIX.md §17:
 * never convey meaning by color alone).
 */
export function Field({ htmlFor, label, hint, error, action, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The `aria-describedby` value for a control inside a `Field`, pointing at
 * whichever of hint/error is actually rendered.
 */
export function fieldDescribedBy(
  id: string,
  options: { hint?: boolean; error?: boolean },
): string | undefined {
  const ids = [options.hint ? `${id}-hint` : null, options.error ? `${id}-error` : null].filter(
    Boolean,
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}
