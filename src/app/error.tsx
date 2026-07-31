"use client";

import { useEffect } from "react";

import { ErrorFallback } from "@/components/error/error-fallback";

/**
 * Route-level error boundary. Next.js renders this in place of the
 * segment that threw, keeping the rest of the layout (header/footer)
 * intact. See FORMETRIX.md §18: preserve enough context to debug
 * without exposing internals to the user.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No error-reporting service wired up yet — console is the only
    // observability channel until one is added.
    console.error(error);
  }, [error]);

  return <ErrorFallback onRetry={reset} />;
}
