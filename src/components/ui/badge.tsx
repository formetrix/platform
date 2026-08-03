import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Shared semantic tone vocabulary for status/confidence indicators
 * app-wide. Promoted here from the project-dashboard feature (FM-0029)
 * once a second feature (properties) needed the same primitive — per
 * FORMETRIX.md §24, a component moves to src/components/ once a second
 * feature genuinely needs it, not before.
 */
export type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-border/40 text-muted border-border",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: Tone;
}

/** Compact pill badge. See docs/DESIGN_SYSTEM.md §10. */
export function Badge({ tone, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
