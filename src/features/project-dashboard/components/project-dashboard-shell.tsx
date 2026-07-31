"use client";

import { ActivityFeed } from "@/features/project-dashboard/components/activity-feed";
import { CurrentWork } from "@/features/project-dashboard/components/current-work";
import { DashboardHeader } from "@/features/project-dashboard/components/dashboard-header";
import { DashboardDetailProvider } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { DecisionLog } from "@/features/project-dashboard/components/decision-log";
import { ExecutiveSummary } from "@/features/project-dashboard/components/executive-summary";
import { MilestoneProgress } from "@/features/project-dashboard/components/milestone-progress";
import { ProjectHealthPanel } from "@/features/project-dashboard/components/project-health";
import { ReleaseHistory } from "@/features/project-dashboard/components/release-history";
import { RisksAndBlockers } from "@/features/project-dashboard/components/risks-and-blockers";
import { Roadmap } from "@/features/project-dashboard/components/roadmap";
import { TicketBoard } from "@/features/project-dashboard/components/ticket-board";
import type { CurrentWorkResult } from "@/features/project-dashboard/lib/current-work";
import type { ValidationIssue } from "@/features/project-dashboard/lib/validate-dashboard-data";
import type { DashboardData, Milestone, Release } from "@/features/project-dashboard/types";

export interface ProjectDashboardShellProps {
  data: DashboardData;
  currentMilestone: Milestone | undefined;
  currentRelease: Release | undefined;
  currentWork: CurrentWorkResult;
  warnings: ValidationIssue[];
}

/**
 * The dashboard's single client boundary (FM-0026A). Every interactive
 * section and the shared detail drawer render from inside this one
 * "use client" module, wrapped in exactly one DashboardDetailProvider.
 *
 * Previously, `page.tsx` (a Server Component) directly authored JSX for
 * nine independent "use client" section components and passed that mixed
 * tree as `children` into `DashboardDetailProvider`. That composition is
 * valid Next.js — Server Components can be passed as children to Client
 * Components — and server-rendered correctly (verified via `curl` during
 * FM-0026). But it puts nine separate server→client boundary crossings
 * in one tree, which is exactly the shape that's fragile under React
 * Fast Refresh in dev mode: editing any one of those files independently
 * can leave a stale module reference for the Context, producing
 * "useDashboardDetail must be used within a DashboardDetailProvider"
 * (FM-0026A) even though the tree is structurally wrapped correctly.
 *
 * Collapsing to one client boundary removes that failure mode entirely —
 * there is nothing left to get out of sync.
 */
export function ProjectDashboardShell({
  data,
  currentMilestone,
  currentRelease,
  currentWork,
  warnings,
}: ProjectDashboardShellProps) {
  const currentMilestoneId = data.projectStatus.currentMilestoneId;
  const activeTicketId = currentWork.kind === "active" ? currentWork.ticket.id : null;

  return (
    <DashboardDetailProvider data={data}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        <DashboardHeader
          projectStatus={data.projectStatus}
          currentMilestone={currentMilestone}
          currentRelease={currentRelease}
        />
        <CurrentWork result={currentWork} />
        <ExecutiveSummary projectStatus={data.projectStatus} currentRelease={currentRelease} />
        <ProjectHealthPanel projectStatus={data.projectStatus} tickets={data.tickets} />
        <MilestoneProgress
          milestones={data.milestones}
          tickets={data.tickets}
          currentMilestoneId={currentMilestoneId}
        />
        <TicketBoard
          tickets={data.tickets}
          milestones={data.milestones}
          currentTicketId={activeTicketId}
        />
        <Roadmap milestones={data.milestones} currentMilestoneId={currentMilestoneId} />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ActivityFeed activity={data.activity} />
          <DecisionLog decisions={data.decisions} />
        </div>
        <RisksAndBlockers tickets={data.tickets} milestones={data.milestones} issues={warnings} />
        <ReleaseHistory releases={data.releases} />
      </div>
    </DashboardDetailProvider>
  );
}
