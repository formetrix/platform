/**
 * Re-exported from the shared UI primitive (FM-0029) — promoted to
 * src/components/ui/ once the properties feature needed the same
 * component, per FORMETRIX.md §24. Kept as `DashboardBadge` here so
 * every existing dashboard import site is unaffected.
 */
export {
  Badge as DashboardBadge,
  type BadgeProps as DashboardBadgeProps,
} from "@/components/ui/badge";
