import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FactRow } from "@/features/properties/components/fact-row";
import { PropertyStatusBadge } from "@/features/properties/components/property-status-badge";
import {
  formatAcreage,
  formatDateTime,
  formatLatLng,
  formatPropertyAddress,
  geometryStatusLabel,
  truncateId,
} from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

export function OverviewSummaryCard({ view }: { view: WorkspaceView }) {
  const { property, organizationName, primaryParcel } = view;
  const parcelImported = Boolean(primaryParcel);
  const lastSync = primaryParcel?.provenance.sourceRetrievedAt ?? null;

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>Property summary</CardTitle>
        <PropertyStatusBadge status={property.status} />
      </CardHeader>
      <CardContent>
        <dl>
          <FactRow label="Property name" value={property.name} />
          <FactRow label="Address" value={formatPropertyAddress(property)} />
          <FactRow label="APN" value={primaryParcel?.apn ?? "—"} mono />
          <FactRow label="County" value={primaryParcel?.county ?? "—"} />
          <FactRow
            label="State"
            value={primaryParcel?.stateRegion ?? property.stateRegion ?? "—"}
          />
          <FactRow label="Acreage" value={formatAcreage(primaryParcel?.acreage)} mono />
          <FactRow label="Latitude" value={formatLatLng(property.latitude)} mono />
          <FactRow label="Longitude" value={formatLatLng(property.longitude)} mono />
          <FactRow label="Provider" value={primaryParcel?.provenance.provider ?? "—"} mono />
          <FactRow label="Geometry status" value={geometryStatusLabel(primaryParcel)} />
          <FactRow label="Parcel imported" value={parcelImported ? "Yes" : "No"} />
          <FactRow label="Last sync" value={formatDateTime(lastSync)} />
          <FactRow
            label="Created by"
            value={property.createdBy ? truncateId(property.createdBy) : "—"}
            mono
          />
          <FactRow label="Created at" value={formatDateTime(property.createdAt)} />
          <FactRow label="Updated at" value={formatDateTime(property.updatedAt)} />
          <FactRow label="Current status" value={property.status.replaceAll("_", " ")} />
          <FactRow label="Organization" value={organizationName} />
          <FactRow
            label="Primary parcel"
            value={
              primaryParcel
                ? primaryParcel.apn
                  ? `APN ${primaryParcel.apn}`
                  : truncateId(primaryParcel.id)
                : "None linked"
            }
            mono
          />
        </dl>
      </CardContent>
    </Card>
  );
}
