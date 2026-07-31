import { Card } from "@/components/ui/card";
import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import type { ValidationIssue } from "@/features/project-dashboard/lib/validate-dashboard-data";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface RisksAndBlockersProps {
  tickets: Ticket[];
  milestones: Milestone[];
  issues: ValidationIssue[];
}

const STALE_THRESHOLD_DAYS = 7;

export function RisksAndBlockers({ tickets, milestones, issues }: RisksAndBlockersProps) {
  const blockedTickets = tickets.filter((t) => t.status === "blocked");
  const blockedMilestones = milestones.filter(
    (m) => m.status === "blocked" || m.blockers.length > 0,
  );
  const now = Date.now();
  const staleTickets = tickets.filter((t) => {
    if (t.status !== "in_progress") return false;
    const ageDays = (now - new Date(t.lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays > STALE_THRESHOLD_DAYS;
  });

  const hasAnyRisk =
    blockedTickets.length > 0 ||
    blockedMilestones.length > 0 ||
    staleTickets.length > 0 ||
    issues.length > 0;

  return (
    <section aria-label="Risks and blockers" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Risks and Blockers</h2>

      {!hasAnyRisk ? (
        <Card>
          <p className="text-muted text-sm">No active blockers recorded.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {blockedTickets.map((ticket) => (
            <Card key={ticket.id} className="flex flex-row items-center justify-between gap-2 p-3">
              <div>
                <p className="text-sm font-medium">
                  {ticket.id}: {ticket.title}
                </p>
                <p className="text-danger text-xs">
                  {ticket.blockedReason ?? "No reason recorded"}
                </p>
              </div>
              <DashboardBadge tone="danger">Blocked</DashboardBadge>
            </Card>
          ))}
          {blockedMilestones.map((milestone) => (
            <Card key={milestone.id} className="flex flex-col gap-1 p-3">
              <p className="text-sm font-medium">
                {milestone.id}: {milestone.name}
              </p>
              {milestone.blockers.map((blocker, index) => (
                <p key={index} className="text-danger text-xs">
                  {blocker.description}
                </p>
              ))}
            </Card>
          ))}
          {staleTickets.map((ticket) => (
            <Card key={ticket.id} className="flex flex-row items-center justify-between gap-2 p-3">
              <p className="text-sm font-medium">
                {ticket.id}: {ticket.title}
              </p>
              <DashboardBadge tone="warning">
                In progress &gt; {STALE_THRESHOLD_DAYS}d without an update
              </DashboardBadge>
            </Card>
          ))}
          {issues.length > 0 ? (
            <Card className="flex flex-col gap-1 p-3">
              <p className="text-sm font-medium">Data Integrity Warnings ({issues.length})</p>
              <ul className="text-warning flex flex-col gap-1 text-xs">
                {issues.map((issue, index) => (
                  <li key={index}>⚠ {issue.message}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </section>
  );
}
