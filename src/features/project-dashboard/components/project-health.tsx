import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { formatDate } from "@/features/project-dashboard/components/details/detail-field";
import { healthStateLabel, healthStateTone } from "@/features/project-dashboard/lib/status-styles";
import type { ProjectHealth, ProjectStatus, Ticket } from "@/features/project-dashboard/types";

export interface ProjectHealthPanelProps {
  projectStatus: ProjectStatus;
  tickets: Ticket[];
}

const DEFAULT_HEALTH: ProjectHealth = {
  dataIntegrity: "unknown",
  lint: "unknown",
  typecheck: "unknown",
  formatting: "unknown",
  build: "unknown",
  gitSync: "unknown",
  deployment: "unknown",
  supabase: "unknown",
};

const HEALTH_ROWS: { key: keyof ProjectHealth; label: string }[] = [
  { key: "dataIntegrity", label: "Data integrity" },
  { key: "lint", label: "Lint" },
  { key: "typecheck", label: "Typecheck" },
  { key: "formatting", label: "Formatting" },
  { key: "build", label: "Build" },
  { key: "gitSync", label: "Git sync" },
  { key: "deployment", label: "Deployment" },
  { key: "supabase", label: "Supabase" },
];

/**
 * Mission Control status strip (FM-0028): surfaces the results of the
 * dashboard-intelligence run — last update time, active-ticket count,
 * integrity status, the current blocker, and the local project-health
 * signals. Every state carries a text label, so status is never conveyed
 * by color alone (docs/DESIGN_SYSTEM.md §14).
 */
export function ProjectHealthPanel({ projectStatus, tickets }: ProjectHealthPanelProps) {
  const health = projectStatus.health ?? DEFAULT_HEALTH;
  const warningCount = projectStatus.dataIntegrityWarningCount ?? 0;
  const activeCount = projectStatus.activeTicketCount ?? 0;
  const blockedTickets = tickets.filter((t) => t.status === "blocked");

  return (
    <section aria-label="Mission Control status" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Mission Control Status</h2>
        <span className="text-muted text-xs">
          Calculated by <code className="font-mono">npm run dashboard:update</code>
        </span>
      </div>

      <div className="bg-surface border-border flex flex-col gap-4 rounded-lg border p-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">Last update</dt>
            <dd className="text-sm">
              {formatDate(projectStatus.lastIntelligenceUpdate ?? projectStatus.generatedAt) ??
                "Never"}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">
              Active tickets
            </dt>
            <dd className="font-metric text-sm font-semibold">{activeCount}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">Integrity</dt>
            <dd className="flex items-center gap-2">
              <DashboardBadge tone={healthStateTone(health.dataIntegrity)}>
                {healthStateLabel(health.dataIntegrity)}
              </DashboardBadge>
              <span className="text-muted text-xs">
                {warningCount} warning{warningCount === 1 ? "" : "s"}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">
              Current blocker
            </dt>
            <dd className="text-sm">
              {blockedTickets.length === 0 ? (
                <span className="text-muted">None</span>
              ) : (
                <span className="text-danger">
                  {blockedTickets[0].id}: {blockedTickets[0].blockedReason ?? "no reason recorded"}
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="border-border grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
          {HEALTH_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <span className="text-muted text-xs">{row.label}</span>
              <DashboardBadge tone={healthStateTone(health[row.key])}>
                {healthStateLabel(health[row.key])}
              </DashboardBadge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
