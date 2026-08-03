import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import {
  DetailField,
  DetailSection,
  formatDate,
} from "@/features/project-dashboard/components/details/detail-field";
import { DetailLink } from "@/features/project-dashboard/components/details/detail-link";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { computeMilestoneProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import {
  milestoneStatusLabel,
  milestoneStatusTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface MilestoneDetailProps {
  milestone: Milestone;
  allTickets: Ticket[];
  onOpenTicket: (id: string) => void;
}

export function MilestoneDetail({ milestone, allTickets, onOpenTicket }: MilestoneDetailProps) {
  const tickets = allTickets.filter((t) => t.milestoneId === milestone.id);
  const completed = tickets.filter((t) => t.status === "completed").length;
  const progress = computeMilestoneProgress(milestone, allTickets);

  return (
    <div className="flex flex-col gap-6">
      <DashboardBadge tone={milestoneStatusTone(milestone.status)}>
        {milestoneStatusLabel(milestone.status)}
      </DashboardBadge>

      <ProgressBar
        percent={progress}
        tone={milestoneStatusTone(milestone.status)}
        label={`${completed} of ${tickets.length} tickets completed (computed)`}
      />

      <DetailSection title="Overview">
        <DetailField label="Objective">{milestone.objective}</DetailField>
      </DetailSection>

      {milestone.deliverables.length > 0 ? (
        <DetailSection title="Deliverables">
          <ul className="flex list-inside list-disc flex-col gap-1 text-sm">
            {milestone.deliverables.map((deliverable, index) => (
              <li key={index}>{deliverable}</li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      <DetailSection title={`Included Tickets (${tickets.length})`}>
        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex items-center justify-between gap-2">
              <DetailLink onClick={() => onOpenTicket(ticket.id)}>
                {ticket.id} — {ticket.title}
              </DetailLink>
              <DashboardBadge tone={ticketStatusTone(ticket.status)}>
                {ticketStatusLabel(ticket.status)}
              </DashboardBadge>
            </li>
          ))}
        </ul>
      </DetailSection>

      {milestone.blockers.length > 0 ? (
        <DetailSection title="Blockers">
          <ul className="text-danger flex flex-col gap-1 text-sm">
            {milestone.blockers.map((blocker, index) => (
              <li key={index}>{blocker.description}</li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      <DetailSection title="Timeline">
        <DetailField label="Start Date">{milestone.startDate}</DetailField>
        <DetailField label="Target Date">{milestone.targetDate}</DetailField>
        <DetailField label="Completion Date">{milestone.completedDate}</DetailField>
        <DetailField label="Last Updated">{formatDate(milestone.lastUpdatedAt)}</DetailField>
      </DetailSection>
    </div>
  );
}
