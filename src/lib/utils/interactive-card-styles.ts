/**
 * Shared hover/selection treatment for clickable cards — per
 * docs/DESIGN_SYSTEM.md: 0.2s transition, subtle cyan emphasis and a
 * slight upward lift on hover, a subtle navy shadow (~10% opacity), and a
 * cyan ring when the item is the one currently selected/open.
 * `prefers-reduced-motion` is handled globally in globals.css, not here.
 *
 * Promoted from features/project-dashboard (FORMETRIX.md §24: a component
 * moves to a shared location once a second feature genuinely needs it —
 * the properties feature's list cards are the second use).
 */
export function interactiveCardClass(isSelected = false): string {
  return [
    "w-full text-left cursor-pointer rounded-lg transition-all duration-200",
    "shadow-[0_1px_2px_rgba(10,37,64,0.06)]",
    "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_8px_20px_-4px_rgba(10,37,64,0.10)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isSelected ? "border-primary ring-1 ring-primary" : "",
  ].join(" ");
}
