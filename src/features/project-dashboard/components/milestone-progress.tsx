"use client";

import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { computeMilestoneProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import {
  milestoneStatusLabel,
  milestoneStatusTone,
} from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface MilestoneProgressProps {
  milestones: Milestone[];
  tickets: Ticket[];
  currentMilestoneId?: string | null;
}

export function MilestoneProgress({
  milestones,
  tickets,
  currentMilestoneId,
}: MilestoneProgressProps) {
  const { openMilestone, isSelected } = useDashboardDetail();

  return (
    <section aria-label="Milestone progress" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Milestone Progress</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {milestones.map((milestone) => {
          const milestoneTickets = tickets.filter((t) => t.milestoneId === milestone.id);
          const completed = milestoneTickets.filter((t) => t.status === "completed").length;
          const progress = computeMilestoneProgress(milestone, tickets);
          const isCurrent = milestone.id === currentMilestoneId;

          return (
            <button
              key={milestone.id}
              type="button"
              onClick={() => openMilestone(milestone.id)}
              aria-haspopup="dialog"
              className={`bg-surface flex flex-col gap-3 border p-6 text-left ${
                isCurrent ? "border-primary/70" : "border-border"
              } ${interactiveCardClass(isSelected("milestone", milestone.id))}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold">
                    {milestone.id}: {milestone.name}
                  </h3>
                  <p className="text-muted text-sm">{milestone.objective}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {isCurrent ? <DashboardBadge tone="info">Current</DashboardBadge> : null}
                  <DashboardBadge tone={milestoneStatusTone(milestone.status)}>
                    {milestoneStatusLabel(milestone.status)}
                  </DashboardBadge>
                </div>
              </div>
              <ProgressBar
                percent={progress}
                tone={milestoneStatusTone(milestone.status)}
                label={`${completed} of ${milestoneTickets.length} tickets completed`}
              />
              {milestone.blockers.length > 0 ? (
                <ul className="text-danger flex flex-col gap-1 text-xs">
                  {milestone.blockers.map((blocker, index) => (
                    <li key={index}>⚠ {blocker.description}</li>
                  ))}
                </ul>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
