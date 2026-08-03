import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FactRow } from "@/features/properties/components/fact-row";
import { PropertyStatusBadge } from "@/features/properties/components/property-status-badge";
import {
  formatAcreage,
  formatLatLng,
  formatPropertyAddress,
} from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

/**
 * What the property is and where it is — FM-0014 acceptance core.
 */
export function DashboardIdentityCard({ view }: { view: WorkspaceView }) {
  const { property, organizationName, primaryParcel } = view;

  return (
    <Card className="shadow-soft xl:col-span-2">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            Property Dashboard
          </p>
          <CardTitle className="text-xl sm:text-2xl">{property.name}</CardTitle>
        </div>
        <PropertyStatusBadge status={property.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-muted mb-2 text-xs font-medium tracking-wide uppercase">
              What it is
            </p>
            <dl>
              <FactRow label="Property name" value={property.name} />
              <FactRow label="Current status" value={property.status.replaceAll("_", " ")} />
              <FactRow label="Organization" value={organizationName} />
              <FactRow label="APN" value={primaryParcel?.apn ?? "—"} mono />
              <FactRow label="Acreage" value={formatAcreage(primaryParcel?.acreage)} mono />
              <FactRow label="Linked parcels" value={String(view.parcels.length)} mono />
            </dl>
          </div>
          <div>
            <p className="text-muted mb-2 text-xs font-medium tracking-wide uppercase">
              Where it is
            </p>
            <dl>
              <FactRow label="Address" value={formatPropertyAddress(property)} />
              <FactRow label="County" value={primaryParcel?.county ?? "—"} />
              <FactRow
                label="State"
                value={primaryParcel?.stateRegion ?? property.stateRegion ?? "—"}
              />
              <FactRow label="Postal code" value={property.postalCode ?? "—"} mono />
              <FactRow label="Latitude" value={formatLatLng(property.latitude)} mono />
              <FactRow label="Longitude" value={formatLatLng(property.longitude)} mono />
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
