import { cn } from "@/lib/utils/cn";

export interface SpinnerProps {
  className?: string;
  /** Accessible label for screen readers. */
  label?: string;
}

/**
 * Minimal loading indicator used by route-level `loading.tsx` files and
 * any component waiting on async data.
 */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "border-border border-t-foreground inline-block h-5 w-5 animate-spin rounded-full border-2",
        className,
      )}
    />
  );
}
