"use client";

import { DashboardBadge } from "@/features/project-dashboard/components/badge";
import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import { interactiveCardClass } from "@/features/project-dashboard/lib/interactive-card-styles";
import { decisionStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Decision } from "@/features/project-dashboard/types";

export interface DecisionLogProps {
  decisions: Decision[];
  limit?: number;
}

export function DecisionLog({ decisions, limit = 8 }: DecisionLogProps) {
  const { openDecision, isSelected } = useDashboardDetail();
  const sorted = [...decisions]
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id),
    )
    .slice(0, limit);

  return (
    <section aria-label="Decisions" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Decisions</h2>
      <div className="flex flex-col gap-2">
        {sorted.map((decision) => (
          <button
            key={decision.id}
            type="button"
            onClick={() => openDecision(decision.id)}
            aria-haspopup="dialog"
            className={`bg-surface border-border flex flex-col gap-1 border p-3 text-left ${interactiveCardClass(isSelected("decision", decision.id))}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-metric text-xs font-semibold">{decision.id}</span>
              <DashboardBadge tone={decision.kind === "founder" ? "info" : "muted"}>
                {decision.kind === "founder" ? "Founder" : "Architecture"}
              </DashboardBadge>
              <DashboardBadge tone={decisionStatusTone(decision.status)}>
                {decision.status}
              </DashboardBadge>
              <span className="text-muted text-xs">{decision.date}</span>
            </div>
            <p className="text-sm">{decision.decision}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
