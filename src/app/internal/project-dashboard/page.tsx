import type { Metadata } from "next";

import { DataIntegrityError } from "@/features/project-dashboard/components/data-integrity-error";
import { ProjectDashboardShell } from "@/features/project-dashboard/components/project-dashboard-shell";
import { resolveCurrentWork } from "@/features/project-dashboard/lib/current-work";
import { loadDashboardData } from "@/features/project-dashboard/lib/load-dashboard-data";
import { validateDashboardData } from "@/features/project-dashboard/lib/validate-dashboard-data";

export const metadata: Metadata = {
  title: "Project Dashboard",
  robots: { index: false, follow: false },
};

// Always read management/data/*.json fresh — this is an internal tool
// that should reflect the latest hand-edited (or, later, hook-updated)
// state, not a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function ProjectDashboardPage() {
  const data = await loadDashboardData();
  const validation = validateDashboardData(data);

  if (!validation.valid) {
    return <DataIntegrityError issues={validation.issues} />;
  }

  const currentMilestone = data.milestones.find(
    (m) => m.id === data.projectStatus.currentMilestoneId,
  );
  const currentRelease = data.releases.find((r) => r.status === "unreleased") ?? data.releases[0];
  const currentWork = resolveCurrentWork(data);
  const warnings = [
    ...validation.issues.filter((issue) => issue.severity === "warning"),
    ...currentWork.issues,
  ];

  return (
    <ProjectDashboardShell
      data={data}
      currentMilestone={currentMilestone}
      currentRelease={currentRelease}
      currentWork={currentWork}
      warnings={warnings}
    />
  );
}
