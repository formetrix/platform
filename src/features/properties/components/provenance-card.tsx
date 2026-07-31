import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FactRow } from "@/features/properties/components/fact-row";
import { formatDateTime } from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

export function ProvenanceCard({ view }: { view: WorkspaceView }) {
  const parcel = view.primaryParcel;

  if (!parcel) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Provenance</CardTitle>
        </CardHeader>
        <CardContent className="text-muted text-sm">
          Provenance appears after a parcel is imported from a provider.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Provenance</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <FactRow label="Provider" value={parcel.provenance.provider} mono />
          <FactRow label="Provider parcel id" value={parcel.provenance.providerParcelId} mono />
          <FactRow label="Geometry source" value={parcel.provenance.geometrySource ?? "—"} mono />
          <FactRow
            label="Source retrieved at"
            value={formatDateTime(parcel.provenance.sourceRetrievedAt)}
          />
          <FactRow
            label="Source updated at"
            value={formatDateTime(parcel.provenance.sourceUpdatedAt)}
          />
          <FactRow label="Geometry quality" value={parcel.provenance.geometryQuality ?? "—"} />
        </dl>
      </CardContent>
    </Card>
  );
}
