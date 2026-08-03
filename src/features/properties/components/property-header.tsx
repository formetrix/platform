import { PropertyStatusBadge } from "@/features/properties/components/property-status-badge";
import { formatAcreage, formatDate, formatPropertyAddress } from "@/features/properties/lib/format";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

/**
 * Workspace header: name, address, status, organization, created date,
 * and a recommendation placeholder line (engine not yet implemented).
 */
export function PropertyHeader({ view }: { view: WorkspaceView }) {
  const { property, organizationName, primaryParcel } = view;
  const address = formatPropertyAddress(property);

  return (
    <header className="border-border bg-surface shadow-soft rounded-lg border p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{property.name}</h1>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-muted text-sm sm:text-base">{address}</p>
          <dl className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
            <div className="flex gap-1">
              <dt className="font-medium text-[var(--foreground)]/70">Organization</dt>
              <dd>{organizationName}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium text-[var(--foreground)]/70">Created</dt>
              <dd>{formatDate(property.createdAt)}</dd>
            </div>
            {primaryParcel ? (
              <div className="flex gap-1">
                <dt className="font-medium text-[var(--foreground)]/70">Primary parcel</dt>
                <dd className="font-metric">
                  {primaryParcel.apn ? `APN ${primaryParcel.apn}` : "Linked"}
                  {primaryParcel.acreage != null
                    ? ` · ${formatAcreage(primaryParcel.acreage)}`
                    : ""}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="border-border bg-background/60 max-w-md rounded-lg border border-dashed p-4 lg:min-w-[240px]">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            Current Recommendation
          </p>
          <p className="mt-1 text-sm">Recommendation engine not yet implemented.</p>
        </div>
      </div>
    </header>
  );
}
