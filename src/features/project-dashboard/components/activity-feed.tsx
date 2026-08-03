"use client";

import { useDashboardDetail } from "@/features/project-dashboard/components/details/dashboard-detail-context";
import type { ActivityEntry } from "@/features/project-dashboard/types";

export interface ActivityFeedProps {
  activity: ActivityEntry[];
  limit?: number;
}

const TYPE_ICON: Record<ActivityEntry["type"], string> = {
  ticket_created: "＋",
  ticket_status_changed: "↻",
  ticket_completed: "✓",
  milestone_updated: "◆",
  decision_recorded: "§",
  founder_decision_approved: "✓",
  commit_created: "⎇",
  release_published: "▲",
  management_doc_edited: "✎",
};

export function ActivityFeed({ activity, limit = 15 }: ActivityFeedProps) {
  const { openActivity, isSelected } = useDashboardDetail();
  const sorted = [...activity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return (
    <section aria-label="Recent activity" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
      <div className="bg-surface border-border divide-border divide-y overflow-hidden rounded-lg border">
        {sorted.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => openActivity(entry.id)}
            aria-haspopup="dialog"
            className={`hover:border-primary/60 focus-visible:ring-primary flex w-full gap-3 border-transparent px-4 py-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none ${
              isSelected("activity", entry.id) ? "bg-primary/10" : "hover:bg-border/20"
            }`}
          >
            <span className="text-muted" aria-hidden>
              {TYPE_ICON[entry.type]}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-sm">{entry.summary}</p>
              <p className="text-muted text-xs">
                {entry.actor} ·{" "}
                <time dateTime={entry.timestamp}>
                  {new Date(entry.timestamp).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </time>
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
