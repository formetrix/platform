"use client";

import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import type { Release, ReleaseStatus } from "@/features/project-dashboard/types";

export interface ReleaseHistoryProps {
  releases: Release[];
}

const STATUS_TONE: Record<ReleaseStatus, "success" | "info" | "danger"> = {
  released: "success",
  unreleased: "info",
  yanked: "danger",
};

export function ReleaseHistory({ releases }: ReleaseHistoryProps) {
  const { openRelease, isSelected } = useDashboardDetail();

  return (
    <section aria-label="Release history" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Release History</h2>
      <div className="flex flex-col gap-3">
        {releases.map((release) => (
          <button
            key={release.version}
            type="button"
            onClick={() => openRelease(release.version)}
            aria-haspopup="dialog"
            className={`bg-surface border-border flex flex-col gap-2 border p-6 text-left ${interactiveCardClass(isSelected("release", release.version))}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-metric text-lg font-semibold">v{release.version}</span>
              <DashboardBadge tone={STATUS_TONE[release.status]}>{release.status}</DashboardBadge>
            </div>
            <p className="text-muted text-sm">
              {release.workStartedDate ?? "?"}
              {release.releaseDate ? ` – ${release.releaseDate}` : ""}
            </p>
            {release.note ? <p className="text-muted text-xs italic">{release.note}</p> : null}
            {release.added.length > 0 ? (
              <p className="text-muted text-xs">
                {release.added.length} items added — click for details
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
