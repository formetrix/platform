import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FactRow } from "@/features/properties/components/fact-row";
import {
  formatAcreage,
  formatDateTime,
  geometryStatusLabel,
} from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

export function ParcelSummaryCard({ view }: { view: WorkspaceView }) {
  const parcel = view.primaryParcel;

  if (!parcel) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Parcel summary</CardTitle>
        </CardHeader>
        <CardContent className="text-muted flex flex-col gap-2 text-sm">
          <p>No parcel is linked to this property.</p>
          <p className="text-xs">
            {view.regridConfigured
              ? "Import a parcel via Regrid ingestion services to populate this summary."
              : "Regrid is not configured — parcel import is unavailable until REGRID_API_TOKEN is set."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Parcel summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <FactRow label="APN" value={parcel.apn ?? "—"} mono />
          <FactRow label="County" value={parcel.county ?? "—"} />
          <FactRow label="State" value={parcel.stateRegion ?? "—"} />
          <FactRow label="Acreage" value={formatAcreage(parcel.acreage)} mono />
          <FactRow label="Provider" value={parcel.provenance.provider} mono />
          <FactRow label="Geometry" value={geometryStatusLabel(parcel)} />
          <FactRow label="Last sync" value={formatDateTime(parcel.provenance.sourceRetrievedAt)} />
          <FactRow label="Situs" value={parcel.situsAddress ?? "—"} />
        </dl>
      </CardContent>
    </Card>
  );
}
