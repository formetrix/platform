import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { milestoneStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, ProjectStatus, Release } from "@/features/project-dashboard/types";

export interface DashboardHeaderProps {
  projectStatus: ProjectStatus;
  currentMilestone: Milestone | undefined;
  currentRelease: Release | undefined;
}

export function DashboardHeader({
  projectStatus,
  currentMilestone,
  currentRelease,
}: DashboardHeaderProps) {
  const generated = new Date(projectStatus.generatedAt);

  return (
    <header className="border-border flex flex-col gap-4 border-b pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
          >
            F
          </span>
          <span className="font-metric text-sm font-semibold tracking-wide uppercase">
            Formetrix
          </span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Project Control</h1>
            <DashboardBadge tone="muted">Internal</DashboardBadge>
          </div>
          <p className="text-muted text-sm">
            Version {currentRelease?.version ?? "unreleased"}
            {currentRelease?.status === "unreleased" ? " (unreleased)" : ""} · Current milestone:{" "}
            {currentMilestone?.name ?? "unknown"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs">Overall status</span>
            <DashboardBadge
              tone={currentMilestone ? milestoneStatusTone(currentMilestone.status) : "muted"}
            >
              {projectStatus.overallProgressPercent}% complete
            </DashboardBadge>
          </div>
          <p className="text-muted text-xs">
            Last updated{" "}
            <time dateTime={projectStatus.generatedAt}>
              {generated.toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              })}{" "}
              UTC
            </time>
          </p>
        </div>
      </div>
    </header>
  );
}
