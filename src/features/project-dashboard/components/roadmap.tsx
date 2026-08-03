"use client";

import { cn } from "@/lib/utils/cn";
import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import {
  milestoneStatusLabel,
  milestoneStatusTone,
} from "@/features/project-dashboard/lib/status-styles";
import type { Milestone } from "@/features/project-dashboard/types";

export interface RoadmapProps {
  milestones: Milestone[];
  currentMilestoneId?: string | null;
}

const DOT_CLASSES = {
  complete: "bg-success border-success",
  in_progress: "bg-primary border-primary",
  blocked: "bg-danger border-danger",
  not_started: "bg-transparent border-border",
} as const;

/**
 * Sequence mode only — no milestone currently has a startDate/targetDate
 * (see docs/PROJECT_DASHBOARD_ARCHITECTURE.md §6.2 and §15), so this
 * renders milestones in order rather than fabricating a calendar/Gantt
 * view from dates that don't exist.
 */
export function Roadmap({ milestones, currentMilestoneId }: RoadmapProps) {
  const { openMilestone, isSelected } = useDashboardDetail();

  return (
    <section aria-label="Roadmap" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Roadmap</h2>
      <p className="text-muted text-xs">
        Sequence view — no target dates are set yet, so milestones are shown in order rather than on
        a calendar.
      </p>
      <ol className="flex flex-col gap-0">
        {milestones.map((milestone, index) => (
          <li key={milestone.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full border-2",
                  DOT_CLASSES[milestone.status],
                )}
              />
              {index < milestones.length - 1 ? (
                <span className="border-border w-px flex-1 border-l" />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => openMilestone(milestone.id)}
              aria-haspopup="dialog"
              className={cn(
                "mb-6 flex flex-1 flex-col gap-1 rounded-lg border p-2 text-left",
                milestone.id === currentMilestoneId ? "border-primary/70" : "border-transparent",
                interactiveCardClass(isSelected("milestone", milestone.id)),
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {milestone.id}: {milestone.name}
                </span>
                {milestone.id === currentMilestoneId ? (
                  <DashboardBadge tone="info">Current</DashboardBadge>
                ) : null}
                <DashboardBadge tone={milestoneStatusTone(milestone.status)}>
                  {milestoneStatusLabel(milestone.status)}
                </DashboardBadge>
              </div>
              <p className="text-muted text-xs">{milestone.objective}</p>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
