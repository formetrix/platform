import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Text input primitive. Kept unopinionated per FORMETRIX.md §11 — labels,
 * hints, and error text are the `Field` wrapper's job, not this element's.
 */
export const inputBaseClass =
  "border-border bg-background text-foreground placeholder:text-muted/70 h-11 w-full rounded-lg border px-3 text-sm transition-colors duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn(inputBaseClass, className)} {...props} />;
});
Input.displayName = "Input";
