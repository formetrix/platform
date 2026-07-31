import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  availabilityLabel,
  availabilityTone,
  type DashboardInventory,
} from "@/features/properties/lib/dashboard-availability";

export function AvailableDatasetsCard({ inventory }: { inventory: DashboardInventory }) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Available datasets</CardTitle>
        <p className="text-muted text-xs">
          Real stored data only — future datasets stay marked Not built.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {inventory.datasets.map((item) => (
          <div
            key={item.id}
            className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge tone={availabilityTone(item.state)}>{availabilityLabel(item.state)}</Badge>
            </div>
            <p className="text-muted text-xs">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
