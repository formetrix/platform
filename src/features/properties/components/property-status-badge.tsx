import { Badge } from "@/components/ui/badge";
import { propertyStatusLabel, propertyStatusTone } from "@/features/properties/lib/property-styles";
import type { PropertyStatus } from "@/lib/properties/types";

/**
 * Centralized Property lifecycle badge — labels from `@/lib/properties`
 * status helpers (FM-0013).
 */
export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge tone={propertyStatusTone(status)}>{propertyStatusLabel(status)}</Badge>;
}
