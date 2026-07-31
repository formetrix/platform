import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { computeTicketProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import { priorityTone, ticketStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface TicketListDetailProps {
  tickets: Ticket[];
  milestones: Milestone[];
  onOpenTicket: (id: string) => void;
}

/** Powers the executive summary cards' "click to see the matching tickets" behavior. */
export function TicketListDetail({ tickets, milestones, onOpenTicket }: TicketListDetailProps) {
  const milestoneById = new Map(milestones.map((m) => [m.id, m]));

  if (tickets.length === 0) {
    return <p className="text-muted text-sm">No tickets match.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <button
            type="button"
            onClick={() => onOpenTicket(ticket.id)}
            className="border-border hover:border-primary/60 hover:bg-border/20 focus-visible:ring-primary flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-metric text-xs font-semibold">{ticket.id}</span>
              <div className="flex items-center gap-1.5">
                <DashboardBadge tone={priorityTone(ticket.priority)}>
                  {ticket.priority}
                </DashboardBadge>
                <DashboardBadge tone={ticketStatusTone(ticket.status)}>
                  {ticket.status}
                </DashboardBadge>
              </div>
            </div>
            <p className="text-sm font-medium">{ticket.title}</p>
            <p className="text-muted text-xs">
              {milestoneById.get(ticket.milestoneId)?.name ?? ticket.milestoneId}
            </p>
            <ProgressBar
              percent={computeTicketProgress(ticket)}
              tone={ticketStatusTone(ticket.status)}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
