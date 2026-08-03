import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import {
  DetailField,
  DetailSection,
  formatDate,
} from "@/features/project-dashboard/components/details/detail-field";
import { DetailLink } from "@/features/project-dashboard/components/details/detail-link";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { computeTicketProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import {
  priorityTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/features/project-dashboard/lib/status-styles";
import type { ActivityEntry, Milestone, Ticket } from "@/features/project-dashboard/types";

export interface TicketDetailProps {
  ticket: Ticket;
  milestone: Milestone | undefined;
  allTickets: Ticket[];
  relatedActivity: ActivityEntry[];
  onOpenTicket: (id: string) => void;
  onOpenMilestone: (id: string) => void;
}

export function TicketDetail({
  ticket,
  milestone,
  allTickets,
  relatedActivity,
  onOpenTicket,
  onOpenMilestone,
}: TicketDetailProps) {
  const progress = computeTicketProgress(ticket);
  const ticketsById = new Map(allTickets.map((t) => [t.id, t]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <DashboardBadge tone={ticketStatusTone(ticket.status)}>
          {ticketStatusLabel(ticket.status)}
        </DashboardBadge>
        <DashboardBadge tone={priorityTone(ticket.priority)}>
          {ticket.priority} priority
        </DashboardBadge>
        <DashboardBadge tone="muted">{ticket.type}</DashboardBadge>
      </div>

      <ProgressBar percent={progress} tone={ticketStatusTone(ticket.status)} label="Progress" />

      <DetailSection title="Overview">
        <DetailField label="Description">{ticket.description}</DetailField>
        <DetailField label="Milestone">
          {milestone ? (
            <DetailLink onClick={() => onOpenMilestone(milestone.id)}>
              {milestone.id}: {milestone.name}
            </DetailLink>
          ) : (
            ticket.milestoneId
          )}
        </DetailField>
        <DetailField label="Owner">{ticket.owner}</DetailField>
      </DetailSection>

      {ticket.acceptanceCriteria.length > 0 ? (
        <DetailSection title="Acceptance Criteria">
          <ul className="flex flex-col gap-1.5">
            {ticket.acceptanceCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className={criterion.met ? "text-success" : "text-muted"} aria-hidden>
                  {criterion.met ? "✓" : "○"}
                </span>
                <span className={criterion.met ? "" : "text-muted"}>{criterion.text}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ticket.dependencies.length > 0 ? (
        <DetailSection title="Dependencies">
          <ul className="flex flex-col gap-2">
            {ticket.dependencies.map((dependency) => {
              const referenced = ticketsById.get(dependency.ticketId);
              return (
                <li key={dependency.ticketId} className="flex flex-col gap-0.5">
                  {referenced ? (
                    <DetailLink onClick={() => onOpenTicket(dependency.ticketId)}>
                      {dependency.ticketId} — {referenced.title}
                    </DetailLink>
                  ) : (
                    <span className="text-muted font-mono text-sm">{dependency.ticketId}</span>
                  )}
                  {dependency.note ? <p className="text-muted text-xs">{dependency.note}</p> : null}
                </li>
              );
            })}
          </ul>
        </DetailSection>
      ) : null}

      <DetailSection title="Timeline">
        <DetailField label="Created">{formatDate(ticket.createdAt)}</DetailField>
        <DetailField label="Started">{formatDate(ticket.startedAt)}</DetailField>
        <DetailField label="Completed">{formatDate(ticket.completedAt)}</DetailField>
        <DetailField label="Last Updated">{formatDate(ticket.lastUpdatedAt)}</DetailField>
      </DetailSection>

      {ticket.blockedReason ? (
        <DetailSection title="Blocked">
          <p className="text-danger text-sm">{ticket.blockedReason}</p>
        </DetailSection>
      ) : null}

      {ticket.commitSha || ticket.pullRequest || ticket.release ? (
        <DetailSection title="Delivery">
          <DetailField label="Commit">
            {ticket.commitSha ? (
              <code className="font-mono text-xs">{ticket.commitSha}</code>
            ) : null}
          </DetailField>
          <DetailField label="Pull Request">{ticket.pullRequest}</DetailField>
          <DetailField label="Release">{ticket.release ? `v${ticket.release}` : null}</DetailField>
        </DetailSection>
      ) : null}

      {ticket.status === "completed" && relatedActivity.length > 0 ? (
        <DetailSection title="Related Activity">
          <ul className="flex flex-col gap-2">
            {relatedActivity.map((activity) => (
              <li key={activity.id} className="text-sm">
                <span className="text-muted">{formatDate(activity.timestamp)}</span> —{" "}
                {activity.summary}
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}
    </div>
  );
}
