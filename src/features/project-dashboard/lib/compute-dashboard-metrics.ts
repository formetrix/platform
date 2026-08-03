import type { Milestone, Ticket, TicketStatus } from "@/features/project-dashboard/types";

/**
 * docs/PROJECT_DASHBOARD_ARCHITECTURE.md §5.1. Deliberately ignores the
 * `progressPercent` value stored on the ticket — that field exists for
 * non-dashboard consumers (Excel/PDF exports); trusting it here would
 * reintroduce the exact two-sources-of-truth problem ADR-0017 exists to
 * prevent. Computed fresh, every render, from status + acceptance criteria.
 */
export function computeTicketProgress(ticket: Ticket): number {
  if (ticket.status === "completed") return 100;
  if (ticket.status === "backlog" || ticket.status === "planned") return 0;

  // in_progress or blocked
  if (ticket.acceptanceCriteria.length === 0) return 50;
  const met = ticket.acceptanceCriteria.filter((c) => c.met).length;
  return Math.round((100 * met) / ticket.acceptanceCriteria.length);
}

/**
 * Milestone completion (FM-0028): completed tickets / total scoped tickets,
 * the deterministic baseline formula this ticket adopts. This replaces the
 * earlier "mean of each ticket's acceptance-criteria ratio" (architecture
 * §5.2). Two reasons: (1) it is the simplest defensible number — a ticket
 * either is or isn't done — and (2) it now matches the "X of Y tickets
 * completed" label already shown beneath every milestone bar, which the
 * criteria-mean did not. No cancelled/deferred status exists in the model,
 * so every ticket in the milestone is "scoped"; if one is added later it is
 * excluded here (see scripts/update-dashboard-intelligence.ts / MISSION_CONTROL).
 */
export function computeMilestoneProgress(milestone: Milestone, allTickets: Ticket[]): number {
  const tickets = allTickets.filter((t) => t.milestoneId === milestone.id);
  if (tickets.length === 0) return 0;
  const completed = tickets.filter((t) => t.status === "completed").length;
  return Math.round((100 * completed) / tickets.length);
}

/**
 * Overall completion (FM-0028): equal-weighted mean of each milestone's
 * completion. Equal-weighting per milestone is preserved from architecture
 * §5.3 deliberately — a global completed/total ratio was considered and
 * rejected because Milestone 0's large ticket count would dominate and
 * overstate whole-product progress while later milestones sit at 0%.
 */
export function computeOverallProgress(milestones: Milestone[], tickets: Ticket[]): number {
  if (milestones.length === 0) return 0;
  const sum = milestones.reduce(
    (total, milestone) => total + computeMilestoneProgress(milestone, tickets),
    0,
  );
  return Math.round(sum / milestones.length);
}

export function countTicketsByStatus(tickets: Ticket[]): Record<TicketStatus, number> {
  const counts: Record<TicketStatus, number> = {
    backlog: 0,
    planned: 0,
    in_progress: 0,
    blocked: 0,
    completed: 0,
  };
  for (const ticket of tickets) {
    counts[ticket.status] += 1;
  }
  return counts;
}

export function groupTicketsByMilestone(tickets: Ticket[]): Map<string, Ticket[]> {
  const groups = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const existing = groups.get(ticket.milestoneId) ?? [];
    existing.push(ticket);
    groups.set(ticket.milestoneId, existing);
  }
  return groups;
}
