"use client";

import { Button } from "@/components/ui/button";

export interface ErrorFallbackProps {
  title?: string;
  /** Whether to mention that some data on this page may be incomplete. */
  mayBeIncomplete?: boolean;
  onRetry?: () => void;
}

/**
 * Shared visual for `error.tsx` / `global-error.tsx` boundaries.
 * FORMETRIX.md §18 requires user-facing errors to say what happened,
 * what the user can do next, and whether data may be incomplete — this
 * keeps that structure consistent everywhere an error boundary renders.
 */
export function ErrorFallback({
  title = "Something went wrong.",
  mayBeIncomplete = true,
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted max-w-md text-sm">
        {mayBeIncomplete && "Some information on this page may be incomplete. "}
        You can try again, or come back later if the problem continues.
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
