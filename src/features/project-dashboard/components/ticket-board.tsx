import { TicketCard } from "@/features/project-dashboard/components/ticket-card";
import { ticketStatusLabel } from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket, TicketStatus } from "@/features/project-dashboard/types";

export interface TicketBoardProps {
  tickets: Ticket[];
  milestones: Milestone[];
  currentTicketId?: string | null;
}

/**
 * Columns are the project's actual five ticket statuses (Backlog, Planned,
 * In Progress, Blocked, Completed) — the same enum management/TICKETS.md
 * has used since FM-0001. "Ready" and "Review" aren't tracked statuses
 * anywhere in this project's data; adding them here would mean inventing
 * a ticket status distinction that doesn't exist, which is exactly what
 * this ticket's own instructions say not to do.
 */
const COLUMNS: TicketStatus[] = ["backlog", "planned", "in_progress", "blocked", "completed"];

const COLUMN_ACCENT: Record<TicketStatus, string> = {
  backlog: "bg-muted",
  planned: "bg-info",
  in_progress: "bg-primary",
  blocked: "bg-danger",
  completed: "bg-success",
};

const COLUMN_COUNT_TEXT: Record<TicketStatus, string> = {
  backlog: "text-muted",
  planned: "text-info",
  in_progress: "text-primary",
  blocked: "text-danger",
  completed: "text-success",
};

export function TicketBoard({ tickets, milestones, currentTicketId }: TicketBoardProps) {
  const milestoneById = new Map(milestones.map((m) => [m.id, m]));

  return (
    <section aria-label="Ticket board" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Ticket Board</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((status) => {
          const columnTickets = tickets.filter((t) => t.status === status);
          return (
            <div key={status} className="bg-border/10 flex flex-col gap-3 rounded-lg p-2">
              <div className="bg-border/10 sticky top-0 z-10 flex items-center gap-2 rounded-md px-1 py-1 backdrop-blur-sm">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${COLUMN_ACCENT[status]}`}
                />
                <span className="text-muted flex-1 text-xs font-semibold tracking-wide uppercase">
                  {ticketStatusLabel(status)}
                </span>
                <span className={`font-metric text-xs font-semibold ${COLUMN_COUNT_TEXT[status]}`}>
                  {columnTickets.length}
                </span>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
                {columnTickets.length === 0 ? (
                  <p className="text-muted px-1 text-xs">No tickets</p>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      milestone={milestoneById.get(ticket.milestoneId)}
                      isCurrent={ticket.id === currentTicketId}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
