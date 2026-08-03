import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import {
  DetailField,
  DetailSection,
  formatDate,
} from "@/features/project-dashboard/components/details/detail-field";
import { DetailLink } from "@/features/project-dashboard/components/details/detail-link";
import type { ActivityEntry, Decision, Release, Ticket } from "@/features/project-dashboard/types";

export interface ActivityDetailProps {
  activity: ActivityEntry;
  allTickets: Ticket[];
  allDecisions: Decision[];
  allReleases: Release[];
  onOpenTicket: (id: string) => void;
  onOpenDecision: (id: string) => void;
  onOpenRelease: (version: string) => void;
}

const TYPE_LABEL: Record<ActivityEntry["type"], string> = {
  ticket_created: "Ticket Created",
  ticket_status_changed: "Ticket Status Changed",
  ticket_completed: "Ticket Completed",
  milestone_updated: "Milestone Updated",
  decision_recorded: "Decision Recorded",
  founder_decision_approved: "Founder Decision Approved",
  commit_created: "Commit Created",
  release_published: "Release Published",
  management_doc_edited: "Management Doc Edited",
};

export function ActivityDetail({
  activity,
  allTickets,
  allDecisions,
  allReleases,
  onOpenTicket,
  onOpenDecision,
  onOpenRelease,
}: ActivityDetailProps) {
  const ticket = activity.relatedTicketId
    ? allTickets.find((t) => t.id === activity.relatedTicketId)
    : undefined;
  const decision = activity.relatedDecisionId
    ? allDecisions.find((d) => d.id === activity.relatedDecisionId)
    : undefined;
  const release = activity.relatedRelease
    ? allReleases.find((r) => r.version === activity.relatedRelease)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <DashboardBadge tone="muted">{TYPE_LABEL[activity.type]}</DashboardBadge>

      <DetailSection title="Summary">
        <p className="text-sm">{activity.summary}</p>
      </DetailSection>

      <DetailSection title="Details">
        <DetailField label="Actor">{activity.actor}</DetailField>
        <DetailField label="Timestamp">{formatDate(activity.timestamp)}</DetailField>
        <DetailField label="Commit">
          {activity.commitSha ? (
            <code className="font-mono text-xs">{activity.commitSha}</code>
          ) : null}
        </DetailField>
      </DetailSection>

      {activity.previousValue || activity.newValue ? (
        <DetailSection title="State Change">
          <DetailField label="Previous">{activity.previousValue}</DetailField>
          <DetailField label="New">{activity.newValue}</DetailField>
        </DetailSection>
      ) : null}

      {ticket || decision || release ? (
        <DetailSection title="Related Records">
          {ticket ? (
            <DetailField label="Ticket">
              <DetailLink onClick={() => onOpenTicket(ticket.id)}>
                {ticket.id} — {ticket.title}
              </DetailLink>
            </DetailField>
          ) : null}
          {decision ? (
            <DetailField label="Decision">
              <DetailLink onClick={() => onOpenDecision(decision.id)}>
                {decision.id} — {decision.decision}
              </DetailLink>
            </DetailField>
          ) : null}
          {release ? (
            <DetailField label="Release">
              <DetailLink onClick={() => onOpenRelease(release.version)}>
                v{release.version}
              </DetailLink>
            </DetailField>
          ) : null}
        </DetailSection>
      ) : null}
    </div>
  );
}
