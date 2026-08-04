"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

import { inputBaseClass } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password field with a show/hide toggle.
 *
 * The toggle is a real `<button>` carrying `aria-pressed` and a label that
 * states the *action*, so assistive tech announces the state change instead of
 * an unlabelled icon. Revealing the value is deliberate: on a device the user
 * controls, being able to check what was typed prevents far more failed
 * sign-ins than it exposes.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  const statusId = useId();

  return (
    <div className="relative">
      <input
        type={revealed ? "text" : "password"}
        className={cn(inputBaseClass, "pr-16", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setRevealed((current) => !current)}
        aria-pressed={revealed}
        aria-label={revealed ? "Hide password" : "Show password"}
        aria-describedby={statusId}
        className="text-muted hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
      >
        {revealed ? "Hide" : "Show"}
      </button>
      <span id={statusId} className="sr-only" aria-live="polite">
        {revealed ? "Password is visible" : "Password is hidden"}
      </span>
    </div>
  );
}
