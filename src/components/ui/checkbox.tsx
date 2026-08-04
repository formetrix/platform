import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Native checkbox with brand styling via `accent-color`, rather than a
 * hand-rolled div. Keeps keyboard behaviour, form submission, and assistive-tech
 * semantics for free (FORMETRIX.md §17: accessibility is a requirement).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "border-border accent-primary focus-visible:ring-primary/40 mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
