import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  availabilityLabel,
  availabilityTone,
  type DashboardInventory,
} from "@/features/properties/lib/dashboard-availability";

export function AvailableAnalysesCard({
  propertyId,
  inventory,
}: {
  propertyId: string;
  inventory: DashboardInventory;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Available analyses</CardTitle>
        <p className="text-muted text-xs">
          Module shells are navigable; analysis engines plug in later.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {inventory.analyses.map((item) => (
          <Link
            key={item.id}
            href={`/property/${propertyId}${item.hrefSuffix}`}
            className="border-border hover:border-primary/40 focus-visible:ring-primary flex flex-col gap-1 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge tone={availabilityTone(item.state)}>{availabilityLabel(item.state)}</Badge>
            </div>
            <p className="text-muted text-xs">{item.detail}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
