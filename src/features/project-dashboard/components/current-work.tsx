"use client";

import { cn } from "@/lib/utils/cn";
import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { formatDate } from "@/features/project-dashboard/components/details/detail-field";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import { ProjectCodesButton } from "@/features/project-dashboard/components/project-codes-button";
import { computeTicketProgress } from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import type { CurrentWorkResult } from "@/features/project-dashboard/lib/current-work";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import {
  priorityTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/features/project-dashboard/lib/status-styles";

export interface CurrentWorkProps {
  result: CurrentWorkResult;
}

/**
 * The dashboard's most prominent, top-of-page answer to "what are we
 * working on right now?" (FM-0027). Restrained branded surface with an
 * Electric Cyan active indicator; the whole active card opens the full
 * ticket in the shared detail drawer. Data comes only from
 * lib/current-work.ts — inconsistencies show a warning, never a guess.
 */
export function CurrentWork({ result }: CurrentWorkProps) {
  return (
    <section aria-label="Current work" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Current Work</h2>
        <ProjectCodesButton />
      </div>
      {result.kind === "active" ? (
        <ActiveCurrentWork result={result} />
      ) : result.kind === "invalid" ? (
        <InvalidCurrentWork result={result} />
      ) : (
        <NoCurrentWork result={result} />
      )}
    </section>
  );
}

function ActiveIndicator() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="bg-primary h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(0,212,255,0.18)]"
      />
      <span className="text-primary text-xs font-semibold tracking-wide uppercase">Active</span>
    </span>
  );
}

function ActiveCurrentWork({ result }: { result: Extract<CurrentWorkResult, { kind: "active" }> }) {
  const { openTicket } = useDashboardDetail();
  const { ticket, milestone, workstream, focusSummary, nextAction, additionalActiveCount } = result;
  const progress = computeTicketProgress(ticket);
  const description = focusSummary ?? ticket.description;

  return (
    <button
      type="button"
      onClick={() => openTicket(ticket.id)}
      aria-haspopup="dialog"
      aria-label={`Current Work: ${ticket.id} ${ticket.title}. Open full details.`}
      className={cn(
        "bg-surface border-border border-l-primary flex flex-col gap-4 border border-l-4 p-6",
        interactiveCardClass(),
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <ActiveIndicator />
        {additionalActiveCount > 0 ? (
          <span className="text-muted text-xs">
            +{additionalActiveCount} more active ticket{additionalActiveCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-metric text-muted text-sm font-semibold">
          {milestone.id} — {milestone.name}
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-metric text-primary text-lg font-semibold">{ticket.id}</span>
          <span className="text-base font-semibold">{ticket.title}</span>
        </div>
      </div>

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

      {description ? <p className="text-muted text-sm">{description}</p> : null}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workstream ? <CurrentWorkField label="Workstream">{workstream}</CurrentWorkField> : null}
        {ticket.dependencies.length > 0 ? (
          <CurrentWorkField label="Dependencies">
            {ticket.dependencies.map((d) => d.ticketId).join(", ")}
          </CurrentWorkField>
        ) : null}
        <CurrentWorkField label="Last updated">
          {formatDate(ticket.lastUpdatedAt) ?? "—"}
        </CurrentWorkField>
      </dl>

      {ticket.blockedReason ? (
        <div className="border-danger/30 bg-danger/10 rounded-lg border p-3">
          <p className="text-danger text-xs font-semibold tracking-wide uppercase">Blocker</p>
          <p className="text-sm">{ticket.blockedReason}</p>
        </div>
      ) : null}

      {nextAction ? (
        <div className="border-primary/30 bg-primary/5 rounded-lg border p-3">
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">Next action</p>
          <p className="text-sm">{nextAction}</p>
        </div>
      ) : null}
    </button>
  );
}

function CurrentWorkField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function NoCurrentWork({ result }: { result: Extract<CurrentWorkResult, { kind: "none" }> }) {
  const { openMilestone } = useDashboardDetail();
  const { milestone } = result;

  return (
    <div className="bg-surface border-border border-l-border flex flex-col gap-3 rounded-lg border border-l-4 p-6">
      {milestone ? (
        <button
          type="button"
          onClick={() => openMilestone(milestone.id)}
          aria-haspopup="dialog"
          className="text-primary focus-visible:ring-primary self-start rounded font-mono text-sm font-medium underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {milestone.id} — {milestone.name}
        </button>
      ) : null}
      <p className="text-muted text-sm">No engineering ticket is currently marked as active.</p>
    </div>
  );
}

function InvalidCurrentWork({
  result,
}: {
  result: Extract<CurrentWorkResult, { kind: "invalid" }>;
}) {
  return (
    <div
      role="alert"
      className="bg-surface border-warning/40 border-l-warning flex flex-col gap-2 rounded-lg border border-l-4 p-6"
    >
      <p className="text-warning text-xs font-semibold tracking-wide uppercase">
        Current Work data inconsistency
      </p>
      <p className="text-sm">
        The current-work pointers in <code className="font-mono text-xs">project-status.json</code>{" "}
        do not match the underlying records, so no current work is shown rather than a guessed
        value.
      </p>
      <ul className="text-muted flex flex-col gap-1 text-xs">
        {result.issues.map((issue, index) => (
          <li key={index}>⚠ {issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
