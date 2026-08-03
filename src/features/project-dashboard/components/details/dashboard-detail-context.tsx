"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DetailDrawer } from "@/features/project-dashboard/components/details/detail-drawer";
import { ActivityDetail } from "@/features/project-dashboard/components/details/activity-detail";
import { DecisionDetail } from "@/features/project-dashboard/components/details/decision-detail";
import { MilestoneDetail } from "@/features/project-dashboard/components/details/milestone-detail";
import { ProgressExplanationDetail } from "@/features/project-dashboard/components/details/progress-explanation-detail";
import { ProjectCodesDetail } from "@/features/project-dashboard/components/details/project-codes-detail";
import { ReleaseDetail } from "@/features/project-dashboard/components/details/release-detail";
import { TicketDetail } from "@/features/project-dashboard/components/details/ticket-detail";
import { TicketListDetail } from "@/features/project-dashboard/components/details/ticket-list-detail";
import type { DashboardData, TicketStatus } from "@/features/project-dashboard/types";

type DetailTarget =
  | { kind: "ticket"; id: string }
  | { kind: "milestone"; id: string }
  | { kind: "decision"; id: string }
  | { kind: "activity"; id: string }
  | { kind: "release"; version: string }
  | { kind: "ticket-list"; status: TicketStatus | "all"; label: string }
  | { kind: "progress-explanation" }
  | { kind: "project-codes" };

interface DashboardDetailContextValue {
  openTicket: (id: string) => void;
  openMilestone: (id: string) => void;
  openDecision: (id: string) => void;
  openActivity: (id: string) => void;
  openRelease: (version: string) => void;
  openTicketList: (status: TicketStatus | "all", label: string) => void;
  openProgressExplanation: () => void;
  openProjectCodes: () => void;
  close: () => void;
  isSelected: (kind: DetailTarget["kind"], id: string) => boolean;
}

const DashboardDetailContext = createContext<DashboardDetailContextValue | null>(null);

export function useDashboardDetail(): DashboardDetailContextValue {
  const context = useContext(DashboardDetailContext);
  if (!context) {
    throw new Error("useDashboardDetail must be used within a DashboardDetailProvider");
  }
  return context;
}

export interface DashboardDetailProviderProps {
  data: DashboardData;
  children: ReactNode;
}

/**
 * Owns which detail panel (if any) is open and renders the single shared
 * DetailDrawer for the whole page — per FM-0026: "do not create a
 * separate bespoke modal for every section." Holds the full dataset so
 * a cross-reference clicked from inside one panel (a ticket dependency,
 * a milestone's ticket list) can open another panel without any child
 * component needing its own copy of the data.
 */
export function DashboardDetailProvider({ data, children }: DashboardDetailProviderProps) {
  const [target, setTarget] = useState<DetailTarget | null>(null);

  const close = useCallback(() => setTarget(null), []);
  const openTicket = useCallback((id: string) => setTarget({ kind: "ticket", id }), []);
  const openMilestone = useCallback((id: string) => setTarget({ kind: "milestone", id }), []);
  const openDecision = useCallback((id: string) => setTarget({ kind: "decision", id }), []);
  const openActivity = useCallback((id: string) => setTarget({ kind: "activity", id }), []);
  const openRelease = useCallback((version: string) => setTarget({ kind: "release", version }), []);
  const openTicketList = useCallback(
    (status: TicketStatus | "all", label: string) =>
      setTarget({ kind: "ticket-list", status, label }),
    [],
  );
  const openProgressExplanation = useCallback(
    () => setTarget({ kind: "progress-explanation" }),
    [],
  );
  const openProjectCodes = useCallback(() => setTarget({ kind: "project-codes" }), []);

  const isSelected = useCallback(
    (kind: DetailTarget["kind"], id: string) => {
      if (!target || target.kind !== kind) return false;
      if (
        target.kind === "ticket" ||
        target.kind === "milestone" ||
        target.kind === "decision" ||
        target.kind === "activity"
      ) {
        return target.id === id;
      }
      if (target.kind === "release") return target.version === id;
      return false;
    },
    [target],
  );

  const value = useMemo<DashboardDetailContextValue>(
    () => ({
      openTicket,
      openMilestone,
      openDecision,
      openActivity,
      openRelease,
      openTicketList,
      openProgressExplanation,
      openProjectCodes,
      close,
      isSelected,
    }),
    [
      openTicket,
      openMilestone,
      openDecision,
      openActivity,
      openRelease,
      openTicketList,
      openProgressExplanation,
      openProjectCodes,
      close,
      isSelected,
    ],
  );

  const { title, eyebrow, body } = renderTarget(target, data, {
    openTicket,
    openMilestone,
    openDecision,
    openActivity,
    openRelease,
  });

  return (
    <DashboardDetailContext.Provider value={value}>
      {children}
      <DetailDrawer isOpen={target !== null} title={title} eyebrow={eyebrow} onClose={close}>
        {body}
      </DetailDrawer>
    </DashboardDetailContext.Provider>
  );
}

interface Navigators {
  openTicket: (id: string) => void;
  openMilestone: (id: string) => void;
  openDecision: (id: string) => void;
  openActivity: (id: string) => void;
  openRelease: (version: string) => void;
}

function renderTarget(
  target: DetailTarget | null,
  data: DashboardData,
  nav: Navigators,
): { title: string; eyebrow?: string; body: ReactNode } {
  if (!target) return { title: "", body: null };

  switch (target.kind) {
    case "ticket": {
      const ticket = data.tickets.find((t) => t.id === target.id);
      if (!ticket) return { title: "Ticket not found", body: <NotFound id={target.id} /> };
      const milestone = data.milestones.find((m) => m.id === ticket.milestoneId);
      const relatedActivity = data.activity.filter((a) => a.relatedTicketId === ticket.id);
      return {
        title: ticket.title,
        eyebrow: ticket.id,
        body: (
          <TicketDetail
            ticket={ticket}
            milestone={milestone}
            allTickets={data.tickets}
            relatedActivity={relatedActivity}
            onOpenTicket={nav.openTicket}
            onOpenMilestone={nav.openMilestone}
          />
        ),
      };
    }
    case "milestone": {
      const milestone = data.milestones.find((m) => m.id === target.id);
      if (!milestone) return { title: "Milestone not found", body: <NotFound id={target.id} /> };
      return {
        title: milestone.name,
        eyebrow: milestone.id,
        body: (
          <MilestoneDetail
            milestone={milestone}
            allTickets={data.tickets}
            onOpenTicket={nav.openTicket}
          />
        ),
      };
    }
    case "decision": {
      const decision = data.decisions.find((d) => d.id === target.id);
      if (!decision) return { title: "Decision not found", body: <NotFound id={target.id} /> };
      return {
        title: decision.decision,
        eyebrow: `${decision.id} · ${decision.kind === "founder" ? "Founder Decision" : "Architecture Decision"}`,
        body: (
          <DecisionDetail
            decision={decision}
            allTickets={data.tickets}
            onOpenTicket={nav.openTicket}
          />
        ),
      };
    }
    case "activity": {
      const activity = data.activity.find((a) => a.id === target.id);
      if (!activity) return { title: "Activity not found", body: <NotFound id={target.id} /> };
      return {
        title: activity.summary,
        eyebrow: activity.id,
        body: (
          <ActivityDetail
            activity={activity}
            allTickets={data.tickets}
            allDecisions={data.decisions}
            allReleases={data.releases}
            onOpenTicket={nav.openTicket}
            onOpenDecision={nav.openDecision}
            onOpenRelease={nav.openRelease}
          />
        ),
      };
    }
    case "release": {
      const release = data.releases.find((r) => r.version === target.version);
      if (!release) return { title: "Release not found", body: <NotFound id={target.version} /> };
      return {
        title: `v${release.version}`,
        eyebrow: "Release",
        body: (
          <ReleaseDetail
            release={release}
            allTickets={data.tickets}
            allDecisions={data.decisions}
            onOpenTicket={nav.openTicket}
            onOpenDecision={nav.openDecision}
          />
        ),
      };
    }
    case "ticket-list": {
      const tickets =
        target.status === "all"
          ? data.tickets
          : data.tickets.filter((t) => t.status === target.status);
      return {
        title: target.label,
        eyebrow: `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`,
        body: (
          <TicketListDetail
            tickets={tickets}
            milestones={data.milestones}
            onOpenTicket={nav.openTicket}
          />
        ),
      };
    }
    case "progress-explanation": {
      return {
        title: "How Overall Completion is calculated",
        eyebrow: "Project Status",
        body: <ProgressExplanationDetail milestones={data.milestones} tickets={data.tickets} />,
      };
    }
    case "project-codes": {
      return {
        title: "Project Codes",
        eyebrow: "Naming Key",
        body: <ProjectCodesDetail />,
      };
    }
  }
}

function NotFound({ id }: { id: string }) {
  return <p className="text-muted text-sm">No record found for &ldquo;{id}&rdquo;.</p>;
}
