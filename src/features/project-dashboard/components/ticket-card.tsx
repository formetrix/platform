"use client";

import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { computeTicketProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import { priorityTone, ticketStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface TicketCardProps {
  ticket: Ticket;
  milestone: Milestone | undefined;
  isCurrent?: boolean;
}

export function TicketCard({ ticket, milestone, isCurrent = false }: TicketCardProps) {
  const { openTicket, isSelected } = useDashboardDetail();
  const progress = computeTicketProgress(ticket);

  return (
    <button
      type="button"
      onClick={() => openTicket(ticket.id)}
      aria-haspopup="dialog"
      className={`bg-surface flex flex-col gap-2 border p-3 ${
        isCurrent ? "border-primary/70" : "border-border"
      } ${interactiveCardClass(isSelected("ticket", ticket.id))}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-metric text-muted text-xs">{ticket.id}</span>
        <div className="flex items-center gap-1.5">
          {isCurrent ? <DashboardBadge tone="info">Current</DashboardBadge> : null}
          <DashboardBadge tone={priorityTone(ticket.priority)}>{ticket.priority}</DashboardBadge>
        </div>
      </div>
      <p className="text-sm leading-snug font-medium">{ticket.title}</p>
      <p className="text-muted text-xs">{milestone?.name ?? ticket.milestoneId}</p>
      <ProgressBar percent={progress} tone={ticketStatusTone(ticket.status)} />
      {ticket.dependencies.length > 0 ? (
        <p className="text-muted text-xs">
          Depends on: {ticket.dependencies.map((d) => d.ticketId).join(", ")}
        </p>
      ) : null}
      {ticket.blockedReason ? (
        <p className="text-danger text-xs">Blocked: {ticket.blockedReason}</p>
      ) : null}
    </button>
  );
}
