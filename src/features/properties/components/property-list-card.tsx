import Link from "next/link";

import { PropertyStatusBadge } from "@/features/properties/components/property-status-badge";
import { formatDate, formatPropertyAddress } from "@/features/properties/lib/format";
import { interactiveCardClass } from "@/lib/utils/interactive-card-styles";
import type { Property } from "@/lib/properties/types";

/** One property summary row on /properties — links into its workspace. */
export function PropertyListCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/property/${property.id}`}
      className={`border-border bg-surface text-surface-foreground shadow-soft flex flex-col gap-2 border p-5 sm:p-6 ${interactiveCardClass()}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{property.name}</h2>
        <PropertyStatusBadge status={property.status} />
      </div>
      <p className="text-muted text-sm">{formatPropertyAddress(property)}</p>
      <p className="text-muted font-metric text-xs">Updated {formatDate(property.updatedAt)}</p>
    </Link>
  );
}
