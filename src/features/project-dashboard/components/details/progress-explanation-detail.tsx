import { DetailSection } from "@/features/project-dashboard/components/details/detail-field";
import { ProgressBar } from "@/features/project-dashboard/components/progress-bar";
import {
  computeMilestoneProgress,
  computeOverallProgress,
} from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import { milestoneStatusTone } from "@/features/project-dashboard/lib/status-styles";
import type { Milestone, Ticket } from "@/features/project-dashboard/types";

export interface ProgressExplanationDetailProps {
  milestones: Milestone[];
  tickets: Ticket[];
}

/**
 * Explains the Overall Completion figure — computed live from ticket data,
 * never a hand-set number, and recomputed into the stored snapshot by
 * `npm run dashboard:update` (FM-0028). This panel exists so that figure is
 * never a mystery: every dashboard number should be traceable to how it was
 * derived (FORMETRIX.md §7).
 */
export function ProgressExplanationDetail({ milestones, tickets }: ProgressExplanationDetailProps) {
  const overall = computeOverallProgress(milestones, tickets);

  return (
    <div className="flex flex-col gap-6">
      <DetailSection title="Formula">
        <p className="text-sm">
          A milestone&rsquo;s completion is{" "}
          <strong>completed tickets ÷ total scoped tickets</strong> in that milestone (FM-0028).
          Overall completion is the mean of each milestone&rsquo;s completion, weighted equally per
          milestone (not per ticket) so a milestone with many tickets doesn&rsquo;t dominate one
          with few. Both are recomputed by{" "}
          <code className="font-mono text-xs">npm run dashboard:update</code> and are always between
          0 and 100. See <code className="font-mono text-xs">docs/MISSION_CONTROL.md</code>.
        </p>
      </DetailSection>

      <DetailSection title={`Milestones (${milestones.length})`}>
        <div className="flex flex-col gap-4">
          {milestones.map((milestone) => (
            <ProgressBar
              key={milestone.id}
              percent={computeMilestoneProgress(milestone, tickets)}
              tone={milestoneStatusTone(milestone.status)}
              label={`${milestone.id}: ${milestone.name}`}
            />
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Result">
        <ProgressBar percent={overall} tone="info" label="Overall Completion" />
      </DetailSection>
    </div>
  );
}
