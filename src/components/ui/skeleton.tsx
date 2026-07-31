import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Placeholder block for content that is still loading. Prefer this
 * over a bare `Spinner` when the eventual content has a known shape
 * (a card, a row, a line of text) — it reduces layout shift.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-border/60 animate-pulse rounded-md", className)} {...props} />;
}
