import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

type TimelineItem = {
  id: string;
  label: string;
  at: string | null;
  detail?: string;
  pending?: boolean;
};

export function PropertyTimeline({ view }: { view: WorkspaceView }) {
  const { property, primaryParcel } = view;

  const items: TimelineItem[] = [
    {
      id: "created",
      label: "Created",
      at: property.createdAt,
      detail: "Property record created in Formetrix",
    },
    {
      id: "parcel-imported",
      label: "Parcel imported",
      at: primaryParcel?.createdAt ?? null,
      detail: primaryParcel
        ? `Provider ${primaryParcel.provenance.provider}`
        : "No parcel linked yet",
      pending: !primaryParcel,
    },
    {
      id: "last-sync",
      label: "Last sync",
      at: primaryParcel?.provenance.sourceRetrievedAt ?? null,
      detail: primaryParcel
        ? "Latest retrieval from the data provider"
        : "Sync after a parcel is imported",
      pending: !primaryParcel?.provenance.sourceRetrievedAt,
    },
    {
      id: "future",
      label: "Future events",
      at: null,
      detail: "Zoning, constraints, and recommendation events will appear here",
      pending: true,
    },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Property timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative flex flex-col gap-4 border-l border-[var(--border)] pl-4">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span
                className={`absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full border-2 ${
                  item.pending ? "border-border bg-background" : "border-primary bg-primary"
                }`}
                aria-hidden
              />
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-muted font-metric text-xs">
                {item.pending && !item.at ? "Pending" : formatDateTime(item.at)}
              </p>
              {item.detail ? <p className="text-muted mt-0.5 text-xs">{item.detail}</p> : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
