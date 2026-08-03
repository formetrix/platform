"use client";

import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";

/**
 * Compact trigger that opens the Project Codes / Naming Key legend in the
 * shared detail drawer (FM-0027). A real <button>, keyboard-focusable,
 * announced as opening a dialog.
 */
export function ProjectCodesButton() {
  const { openProjectCodes } = useDashboardDetail();

  return (
    <button
      type="button"
      onClick={openProjectCodes}
      aria-haspopup="dialog"
      className="border-border text-muted hover:border-primary/60 hover:text-foreground focus-visible:ring-primary focus-visible:ring-offset-background inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span aria-hidden className="font-metric text-primary font-semibold">
        {"{ }"}
      </span>
      Project Codes
    </button>
  );
}
