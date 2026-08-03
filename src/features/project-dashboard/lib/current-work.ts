import type { ValidationIssue } from "@/features/project-dashboard/lib/validate-dashboard-data";
import type { DashboardData, Milestone, Ticket } from "@/features/project-dashboard/types";

/**
 * Ticket statuses that count as "currently being worked on" (FM-0027/FM-0028).
 * `review` is a reserved active status accepted by the model but not yet used
 * by any ticket (no Kanban column exists for it — see docs/DESIGN_SYSTEM.md
 * §15). Planned, ready, backlog, and completed are explicitly not active.
 * Kept as a string set so a reserved status resolves correctly if introduced.
 */
const ACTIVE_STATUSES = new Set<string>(["in_progress", "review", "blocked"]);

export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

/**
 * The resolved Current Work state, computed from structured data only —
 * never a fabricated fallback. Three outcomes:
 *  - `active`: a single valid, active ticket is the current focus.
 *  - `none`: no ticket is marked active (currentTicketId is absent).
 *  - `invalid`: the current-work pointers are inconsistent; `issues`
 *    explains why and the UI surfaces a warning instead of guessing.
 */
export type CurrentWorkResult =
  | {
      kind: "active";
      ticket: Ticket;
      milestone: Milestone;
      workstream: string | null;
      focusSummary: string | null;
      nextAction: string | null;
      /** Count of other active tickets not shown as the primary one. */
      additionalActiveCount: number;
      issues: ValidationIssue[];
    }
  | {
      kind: "none";
      milestone: Milestone | undefined;
      issues: ValidationIssue[];
    }
  | {
      kind: "invalid";
      issues: ValidationIssue[];
    };

/**
 * Resolves the dashboard's Current Work from `project-status.json`,
 * validating every pointer against the real records (FM-0027 Data
 * Integrity rules): currentTicketId must exist, belong to the stated
 * current milestone, hold an active status, and carry an in-range
 * progress value. Any inconsistency yields a visible warning rather than
 * a silent, invented current-work card.
 */
export function resolveCurrentWork(data: DashboardData): CurrentWorkResult {
  const { projectStatus } = data;
  const issues: ValidationIssue[] = [];

  const milestone = data.milestones.find((m) => m.id === projectStatus.currentMilestoneId);
  if (!milestone) {
    issues.push({
      severity: "warning",
      message: `Current Work: currentMilestoneId "${projectStatus.currentMilestoneId}" does not resolve to a milestone.`,
    });
  }

  const activeTickets = data.tickets.filter((t) => isActiveStatus(t.status));
  const currentTicketId = projectStatus.currentTicketId ?? null;

  if (!currentTicketId) {
    // No current ticket selected. If tickets are nonetheless active, that is
    // an inconsistency (either the intelligence script has not run, or
    // multiple tickets are active with no valid primary selected) — surface
    // it rather than silently showing nothing.
    if (activeTickets.length === 0) {
      return { kind: "none", milestone, issues };
    }
    issues.push({
      severity: "warning",
      message:
        activeTickets.length === 1
          ? `Current Work: ${activeTickets[0].id} is active but no current ticket is selected — run "npm run dashboard:update".`
          : `Current Work: ${activeTickets.length} tickets are active but no primary current ticket is selected — set a primary currentTicketId and run "npm run dashboard:update".`,
    });
    return { kind: "invalid", issues };
  }

  const ticket = data.tickets.find((t) => t.id === currentTicketId);
  if (!ticket) {
    issues.push({
      severity: "warning",
      message: `Current Work: currentTicketId "${currentTicketId}" does not resolve to a ticket.`,
    });
    return { kind: "invalid", issues };
  }

  if (!isActiveStatus(ticket.status)) {
    issues.push({
      severity: "warning",
      message: `Current Work: ticket ${ticket.id} has status "${ticket.status}", which is not an active status (expected In Progress or Blocked).`,
    });
  }

  if (milestone && ticket.milestoneId !== milestone.id) {
    issues.push({
      severity: "warning",
      message: `Current Work: ticket ${ticket.id} belongs to milestone "${ticket.milestoneId}", not the current milestone "${milestone.id}".`,
    });
  }

  if (ticket.progressPercent < 0 || ticket.progressPercent > 100) {
    issues.push({
      severity: "warning",
      message: `Current Work: ticket ${ticket.id} has out-of-range progressPercent ${ticket.progressPercent} (must be 0–100).`,
    });
  }

  // Any inconsistency (including a missing current milestone) means we do
  // not present a confident current-work card — surface the warning.
  if (issues.length > 0 || !milestone) {
    return { kind: "invalid", issues };
  }

  const additionalActiveCount = data.tickets.filter(
    (t) => t.id !== ticket.id && isActiveStatus(t.status),
  ).length;

  return {
    kind: "active",
    ticket,
    milestone,
    workstream: projectStatus.currentWorkstream ?? null,
    focusSummary: projectStatus.currentFocusSummary ?? null,
    nextAction: projectStatus.currentNextAction ?? null,
    additionalActiveCount,
    issues,
  };
}
