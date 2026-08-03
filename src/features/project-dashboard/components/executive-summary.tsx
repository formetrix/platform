"use client";

import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import type { ProjectStatus, Release, TicketStatus } from "@/features/project-dashboard/types";

export interface ExecutiveSummaryProps {
  projectStatus: ProjectStatus;
  currentRelease: Release | undefined;
}

interface Stat {
  label: string;
  value: string | number;
  onClick: () => void;
}

export function ExecutiveSummary({ projectStatus, currentRelease }: ExecutiveSummaryProps) {
  const { openTicketList, openProgressExplanation, openRelease } = useDashboardDetail();
  const { ticketCounts } = projectStatus;

  const statusFilter = (status: TicketStatus | "all", label: string) => () =>
    openTicketList(status, label);

  const stats: Stat[] = [
    {
      label: "Overall completion",
      value: `${projectStatus.overallProgressPercent}%`,
      onClick: openProgressExplanation,
    },
    {
      label: "Total tickets",
      value: ticketCounts.total,
      onClick: statusFilter("all", "All Tickets"),
    },
    {
      label: "Completed",
      value: ticketCounts.completed,
      onClick: statusFilter("completed", "Completed Tickets"),
    },
    {
      label: "In progress",
      value: ticketCounts.inProgress,
      onClick: statusFilter("in_progress", "In-Progress Tickets"),
    },
    {
      label: "Planned",
      value: ticketCounts.planned,
      onClick: statusFilter("planned", "Planned Tickets"),
    },
    {
      label: "Blocked",
      value: ticketCounts.blocked,
      onClick: statusFilter("blocked", "Blocked Tickets"),
    },
    {
      label: "Current release",
      value: currentRelease ? `v${currentRelease.version}` : "None",
      onClick: () => currentRelease && openRelease(currentRelease.version),
    },
  ];

  return (
    <section
      aria-label="Executive summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7"
    >
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          onClick={stat.onClick}
          aria-haspopup="dialog"
          className={`bg-surface border-border flex flex-col gap-1 border p-4 text-left ${interactiveCardClass()}`}
        >
          <span className="font-metric text-2xl font-semibold">{stat.value}</span>
          <span className="text-muted text-sm">{stat.label}</span>
        </button>
      ))}
    </section>
  );
}
