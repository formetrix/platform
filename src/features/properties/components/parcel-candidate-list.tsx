"use client";

import { Badge } from "@/components/ui/badge";
import { summarizeCandidate } from "@/features/properties/lib/add-property-messages";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";
import { cn } from "@/lib/utils/cn";

/**
 * Live provider results. Every value shown comes from the provider payload —
 * a missing field reads as "—" rather than being filled in (FORMETRIX.md §7).
 *
 * Regrid can return several parcels that share one address and footprint
 * (stacked tax accounts), so the APN is shown on every row: it is often the
 * only thing distinguishing two otherwise identical-looking results.
 */
export function ParcelCandidateList({
  candidates,
  selectedId,
  onSelect,
}: {
  candidates: NormalizedParcelCandidate[];
  selectedId: string | null;
  onSelect: (candidate: NormalizedParcelCandidate) => void;
}) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Parcel search results">
      {candidates.map((candidate) => {
        const summary = summarizeCandidate(candidate);
        const selected = candidate.providerParcelId === selectedId;

        return (
          <li key={candidate.providerParcelId}>
            <button
              type="button"
              onClick={() => onSelect(candidate)}
              aria-pressed={selected}
              className={cn(
                "border-border w-full rounded-lg border p-3 text-left transition-colors duration-200",
                "focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none",
                selected ? "border-primary bg-primary/5" : "hover:bg-border/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">{summary.primaryLine}</span>
                  <span className="text-muted truncate text-xs">{summary.locationLine}</span>
                </div>
                {summary.scoreLabel ? (
                  <Badge tone="muted" className="shrink-0">
                    {summary.scoreLabel}
                  </Badge>
                ) : null}
              </div>

              <dl className="text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div className="flex gap-1">
                  <dt>APN</dt>
                  <dd className="text-foreground font-metric">{summary.apnLabel}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Size</dt>
                  <dd className="text-foreground font-metric">{summary.sizeLabel}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Source</dt>
                  <dd className="text-foreground">{summary.providerLabel}</dd>
                </div>
              </dl>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
