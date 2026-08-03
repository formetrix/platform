import type { Tone } from "@/components/ui/badge";
import type {
  DecisionStatus,
  HealthState,
  MilestoneStatus,
  TicketPriority,
  TicketStatus,
} from "@/features/project-dashboard/types";

export type { Tone };

export function ticketStatusTone(status: TicketStatus): Tone {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "blocked":
      return "danger";
    case "planned":
      return "warning";
    case "backlog":
      return "muted";
  }
}

export function ticketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function milestoneStatusTone(status: MilestoneStatus): Tone {
  switch (status) {
    case "complete":
      return "success";
    case "in_progress":
      return "info";
    case "blocked":
      return "danger";
    case "not_started":
      return "muted";
  }
}

export function milestoneStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "blocked":
      return "Blocked";
    case "complete":
      return "Complete";
  }
}

/**
 * Per FM-0026's brand rules: red is reserved for blocked/critical states
 * only (see ticketStatusTone), not for priority — high priority uses
 * orange ("warning") instead, so a merely-high-priority ticket doesn't
 * visually compete with an actually-blocked one.
 */
export function priorityTone(priority: TicketPriority): Tone {
  switch (priority) {
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "muted";
  }
}

/**
 * FM-0028 project-health signals. "not_configured"/"unknown"/"pending" read
 * as muted/neutral — deliberately not green — so an unverified integration
 * never looks like a healthy one.
 */
export function healthStateTone(state: HealthState): Tone {
  switch (state) {
    case "passing":
    case "healthy":
      return "success";
    case "warning":
      return "warning";
    case "failing":
      return "danger";
    case "pending":
      return "info";
    case "not_configured":
    case "unknown":
      return "muted";
  }
}

export function healthStateLabel(state: HealthState): string {
  switch (state) {
    case "passing":
      return "Passing";
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "failing":
      return "Failing";
    case "pending":
      return "Pending";
    case "not_configured":
      return "Not configured";
    case "unknown":
      return "Unknown";
  }
}

export function decisionStatusTone(status: DecisionStatus): Tone {
  switch (status) {
    case "approved":
      return "success";
    case "proposed":
      return "info";
    case "superseded":
      return "warning";
    case "deprecated":
      return "danger";
  }
}
