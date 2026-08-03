import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import {
  DetailField,
  DetailSection,
} from "@/features/project-dashboard/components/details/detail-field";
import { DetailLink } from "@/features/project-dashboard/components/details/detail-link";
import { decisionStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Decision, Ticket } from "@/features/project-dashboard/types";

export interface DecisionDetailProps {
  decision: Decision;
  allTickets: Ticket[];
  onOpenTicket: (id: string) => void;
}

export function DecisionDetail({ decision, allTickets, onOpenTicket }: DecisionDetailProps) {
  const ticketsById = new Map(allTickets.map((t) => [t.id, t]));
  const relatedTicketIds = decision.relatedTicketIds ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <DashboardBadge tone={decision.kind === "founder" ? "info" : "muted"}>
          {decision.kind === "founder" ? "Founder Decision" : "Architecture Decision"}
        </DashboardBadge>
        <DashboardBadge tone={decisionStatusTone(decision.status)}>
          {decision.status}
        </DashboardBadge>
        <span className="text-muted text-xs">{decision.date}</span>
      </div>

      <DetailSection title="Decision">
        <p className="text-sm">{decision.decision}</p>
      </DetailSection>

      <DetailSection title="Rationale">
        <p className="text-sm">{decision.rationale}</p>
      </DetailSection>

      {decision.kind === "architecture" && decision.alternativesConsidered.length > 0 ? (
        <DetailSection title="Alternatives Considered">
          <ul className="flex list-inside list-disc flex-col gap-1 text-sm">
            {decision.alternativesConsidered.map((alternative, index) => (
              <li key={index}>{alternative}</li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {decision.kind === "architecture" ? (
        <DetailSection title="Architecture Impact">
          <p className="text-sm">{decision.impact}</p>
        </DetailSection>
      ) : (
        <DetailSection title="Product Impact">
          <p className="text-sm">{decision.productImpact}</p>
          <DetailField label="Deferred Implications">{decision.deferredImplications}</DetailField>
        </DetailSection>
      )}

      {decision.supersedes || decision.supersededBy ? (
        <DetailSection title="Supersession">
          <DetailField label="Supersedes">{decision.supersedes}</DetailField>
          <DetailField label="Superseded By">{decision.supersededBy}</DetailField>
        </DetailSection>
      ) : null}

      {relatedTicketIds.length > 0 ? (
        <DetailSection title="Related Tickets">
          <ul className="flex flex-col gap-1">
            {relatedTicketIds.map((id) => {
              const ticket = ticketsById.get(id);
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
    </div>
  );
}
