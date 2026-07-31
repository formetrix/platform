import type {
  DashboardData,
  Decision,
  Milestone,
  Ticket,
} from "@/features/project-dashboard/types";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// "review" and "ready" are reserved statuses the model accepts but no ticket
// currently uses (see docs/DESIGN_SYSTEM.md §15); included so a future ticket
// carrying one is not falsely flagged as an invalid status.
const TICKET_STATUSES = new Set([
  "backlog",
  "planned",
  "ready",
  "in_progress",
  "review",
  "blocked",
  "completed",
]);
const TICKET_PRIORITIES = new Set(["high", "medium", "low"]);
const MILESTONE_STATUSES = new Set(["not_started", "in_progress", "blocked", "complete"]);
const DECISION_STATUSES = new Set(["proposed", "approved", "superseded", "deprecated"]);

/**
 * Implements the validation rules from docs/PROJECT_DASHBOARD_ARCHITECTURE.md
 * §8. Referential-integrity and enum failures are hard errors (the route
 * refuses to render the dashboard on them); everything else is a warning
 * surfaced in the Data Integrity Warnings section instead of hidden.
 */
export function validateDashboardData(data: DashboardData): ValidationResult {
  const issues: ValidationIssue[] = [];
  const milestoneIds = new Set(data.milestones.map((m) => m.id));
  const ticketIds = new Set(data.tickets.map((t) => t.id));
  const decisionIds = new Set(data.decisions.map((d) => d.id));

  validateMilestones(data.milestones, issues);
  validateTickets(data.tickets, ticketIds, milestoneIds, issues);
  validateDecisions(data.decisions, decisionIds, ticketIds, issues);
  validateMilestoneTicketDerivation(data.milestones, data.tickets, issues);
  validateActivityReferences(data, issues);

  const hasError = issues.some((issue) => issue.severity === "error");
  return { valid: !hasError, issues };
}

function validateMilestones(milestones: Milestone[], issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  for (const milestone of milestones) {
    if (seen.has(milestone.id)) {
      issues.push({ severity: "error", message: `Duplicate milestone id: ${milestone.id}` });
    }
    seen.add(milestone.id);

    if (!MILESTONE_STATUSES.has(milestone.status)) {
      issues.push({
        severity: "error",
        message: `Milestone ${milestone.id} has invalid status "${milestone.status}"`,
      });
    }
    if (milestone.status === "complete" && !milestone.completedDate) {
      issues.push({
        severity: "warning",
        message: `Milestone ${milestone.id} is marked complete but has no completedDate`,
      });
    }
  }
}

function validateTickets(
  tickets: Ticket[],
  ticketIds: Set<string>,
  milestoneIds: Set<string>,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const ticket of tickets) {
    if (seen.has(ticket.id)) {
      issues.push({ severity: "error", message: `Duplicate ticket id: ${ticket.id}` });
    }
    seen.add(ticket.id);

    if (!TICKET_STATUSES.has(ticket.status)) {
      issues.push({
        severity: "error",
        message: `Ticket ${ticket.id} has invalid status "${ticket.status}"`,
      });
    }
    if (!TICKET_PRIORITIES.has(ticket.priority)) {
      issues.push({
        severity: "error",
        message: `Ticket ${ticket.id} has invalid priority "${ticket.priority}"`,
      });
    }
    if (!milestoneIds.has(ticket.milestoneId)) {
      issues.push({
        severity: "error",
        message: `Ticket ${ticket.id} references unknown milestoneId "${ticket.milestoneId}"`,
      });
    }
    for (const dependency of ticket.dependencies) {
      if (!ticketIds.has(dependency.ticketId)) {
        issues.push({
          severity: "error",
          message: `Ticket ${ticket.id} depends on unknown ticket "${dependency.ticketId}"`,
        });
      }
    }
    if (ticket.status === "blocked" && !ticket.blockedReason) {
      issues.push({
        severity: "warning",
        message: `Ticket ${ticket.id} is blocked but has no blockedReason`,
      });
    }
    if (ticket.status === "completed" && ticket.acceptanceCriteria.some((c) => !c.met)) {
      issues.push({
        severity: "warning",
        message: `Ticket ${ticket.id} is completed but has unmet acceptance criteria`,
      });
    }
    if (ticket.status === "completed" && !ticket.completedAt) {
      issues.push({
        severity: "warning",
        message: `Ticket ${ticket.id} is completed but has no completedAt date`,
      });
    }
    if (ticket.progressPercent < 0 || ticket.progressPercent > 100) {
      issues.push({
        severity: "warning",
        message: `Ticket ${ticket.id} has progressPercent ${ticket.progressPercent} outside the 0–100 range`,
      });
    }
    if (ticket.status === "in_progress" && ticket.acceptanceCriteria.length === 0) {
      issues.push({
        severity: "warning",
        message: `Ticket ${ticket.id} is in_progress with no acceptance criteria defined`,
      });
    }
  }
}

function validateDecisions(
  decisions: Decision[],
  decisionIds: Set<string>,
  ticketIds: Set<string>,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const decision of decisions) {
    if (seen.has(decision.id)) {
      issues.push({ severity: "error", message: `Duplicate decision id: ${decision.id}` });
    }
    seen.add(decision.id);

    if (!DECISION_STATUSES.has(decision.status)) {
      issues.push({
        severity: "error",
        message: `Decision ${decision.id} has invalid status "${decision.status}"`,
      });
    }
    const expectedPrefix = decision.kind === "architecture" ? "ADR-" : "FD-";
    if (!decision.id.startsWith(expectedPrefix)) {
      issues.push({
        severity: "error",
        message: `Decision ${decision.id} has kind "${decision.kind}" but an id that doesn't start with "${expectedPrefix}"`,
      });
    }
    for (const relatedId of decision.relatedTicketIds ?? []) {
      if (!ticketIds.has(relatedId)) {
        issues.push({
          severity: "warning",
          message: `Decision ${decision.id} references unknown ticket "${relatedId}"`,
        });
      }
    }
    if (decision.supersedes && !decisionIds.has(decision.supersedes)) {
      issues.push({
        severity: "warning",
        message: `Decision ${decision.id} supersedes unknown decision "${decision.supersedes}"`,
      });
    }
  }
}

/** ADR-0017: milestone.ticketIds must exactly match tickets whose milestoneId points back. */
function validateMilestoneTicketDerivation(
  milestones: Milestone[],
  tickets: Ticket[],
  issues: ValidationIssue[],
): void {
  for (const milestone of milestones) {
    const actualTicketIds = new Set(
      tickets.filter((t) => t.milestoneId === milestone.id).map((t) => t.id),
    );
    const declaredTicketIds = new Set(milestone.ticketIds);

    for (const id of actualTicketIds) {
      if (!declaredTicketIds.has(id)) {
        issues.push({
          severity: "warning",
          message: `Ticket ${id} has milestoneId "${milestone.id}" but is missing from that milestone's ticketIds`,
        });
      }
    }
    for (const id of declaredTicketIds) {
      if (!actualTicketIds.has(id)) {
        issues.push({
          severity: "warning",
          message: `Milestone ${milestone.id} lists ${id} in ticketIds, but that ticket's milestoneId doesn't point back`,
        });
      }
    }
  }
}

function validateActivityReferences(data: DashboardData, issues: ValidationIssue[]): void {
  const ticketIds = new Set(data.tickets.map((t) => t.id));
  const milestoneIds = new Set(data.milestones.map((m) => m.id));
  const decisionIds = new Set(data.decisions.map((d) => d.id));

  for (const entry of data.activity) {
    if (entry.relatedTicketId && !ticketIds.has(entry.relatedTicketId)) {
      issues.push({
        severity: "warning",
        message: `Activity ${entry.id} references unknown ticket "${entry.relatedTicketId}"`,
      });
    }
    if (entry.relatedMilestoneId && !milestoneIds.has(entry.relatedMilestoneId)) {
      issues.push({
        severity: "warning",
        message: `Activity ${entry.id} references unknown milestone "${entry.relatedMilestoneId}"`,
      });
    }
    if (entry.relatedDecisionId && !decisionIds.has(entry.relatedDecisionId)) {
      issues.push({
        severity: "warning",
        message: `Activity ${entry.id} references unknown decision "${entry.relatedDecisionId}"`,
      });
    }
  }
}
