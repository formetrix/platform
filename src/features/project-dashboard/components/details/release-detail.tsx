import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import {
  DetailField,
  DetailSection,
} from "@/features/project-dashboard/components/details/detail-field";
import { DetailLink } from "@/features/project-dashboard/components/details/detail-link";
import type { Decision, Release, ReleaseStatus, Ticket } from "@/features/project-dashboard/types";

export interface ReleaseDetailProps {
  release: Release;
  allTickets: Ticket[];
  allDecisions: Decision[];
  onOpenTicket: (id: string) => void;
  onOpenDecision: (id: string) => void;
}

const STATUS_TONE: Record<ReleaseStatus, "success" | "info" | "danger"> = {
  released: "success",
  unreleased: "info",
  yanked: "danger",
};

export function ReleaseDetail({
  release,
  allTickets,
  allDecisions,
  onOpenTicket,
  onOpenDecision,
}: ReleaseDetailProps) {
  const entries = [...release.added, ...release.changed, ...release.fixed];
  const ticketIds = Array.from(
    new Set(entries.map((e) => e.ticketId).filter((id): id is string => Boolean(id))),
  );
  const decisionIds = Array.from(
    new Set(entries.map((e) => e.decisionId).filter((id): id is string => Boolean(id))),
  );
  const referencedTickets = ticketIds
    .map((id) => allTickets.find((t) => t.id === id))
    .filter((t): t is Ticket => Boolean(t));
  const committedCount = referencedTickets.filter((t) => t.commitSha).length;

  return (
    <div className="flex flex-col gap-6">
      <DashboardBadge tone={STATUS_TONE[release.status]}>{release.status}</DashboardBadge>

      <DetailSection title="Overview">
        <DetailField label="Version">{release.version}</DetailField>
        <DetailField label="Work Started">{release.workStartedDate}</DetailField>
        <DetailField label="Released">{release.releaseDate}</DetailField>
        <DetailField label="Tag">{release.tag ?? "Not yet tagged"}</DetailField>
        {release.note ? <DetailField label="Note">{release.note}</DetailField> : null}
      </DetailSection>

      <DetailSection title="Git Status">
        <p className="text-sm">
          {referencedTickets.length === 0
            ? "No tickets are linked to this release yet."
            : committedCount === referencedTickets.length
              ? `All ${referencedTickets.length} linked tickets are committed.`
              : `${committedCount} of ${referencedTickets.length} linked tickets are committed; the rest are still in the working tree.`}
        </p>
        <p className="text-muted text-xs">
          {release.status === "unreleased"
            ? "Not marked as published — this release has not been tagged or published."
            : `Marked as ${release.status}.`}
        </p>
      </DetailSection>

      {ticketIds.length > 0 ? (
        <DetailSection title={`Included Tickets (${ticketIds.length})`}>
          <ul className="flex flex-col gap-1">
            {ticketIds.map((id) => {
              const ticket = allTickets.find((t) => t.id === id);
              return (
                <li key={id}>
                  {ticket ? (
                    <DetailLink onClick={() => onOpenTicket(id)}>
                      {id} — {ticket.title}
                    </DetailLink>
                  ) : (
                    <span className="text-muted font-mono text-sm">{id}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </DetailSection>
      ) : null}

      {decisionIds.length > 0 ? (
        <DetailSection title={`Included Decisions (${decisionIds.length})`}>
          <ul className="flex flex-col gap-1">
            {decisionIds.map((id) => {
              const decision = allDecisions.find((d) => d.id === id);
              return (
                <li key={id}>
                  {decision ? (
                    <DetailLink onClick={() => onOpenDecision(id)}>
                      {id} — {decision.decision}
                    </DetailLink>
                  ) : (
                    <span className="text-muted font-mono text-sm">{id}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </DetailSection>
      ) : null}

      {release.added.length > 0 ? (
        <DetailSection title="Added">
          <ul className="flex list-inside list-disc flex-col gap-1 text-sm">
            {release.added.map((entry, index) => (
              <li key={index}>{entry.summary}</li>
            ))}
          </ul>
        </DetailSection>
      ) : null}
    </div>
  );
}
