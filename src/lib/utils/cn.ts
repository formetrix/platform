import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names (`clsx`) and resolves conflicting
 * Tailwind utility classes (`tailwind-merge`), e.g. `cn("p-2", "p-4")`
 * resolves to `"p-4"` instead of emitting both.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
