import { AvailableAnalysesCard } from "@/features/properties/components/available-analyses-card";
import { AvailableDatasetsCard } from "@/features/properties/components/available-datasets-card";
import { DashboardIdentityCard } from "@/features/properties/components/dashboard-identity-card";
import { DataAvailabilityCard } from "@/features/properties/components/data-availability-card";
import { ModuleQuickNav } from "@/features/properties/components/module-quick-nav";
import { OverviewSummaryCard } from "@/features/properties/components/overview-summary-card";
import { ParcelSummaryCard } from "@/features/properties/components/parcel-summary-card";
import { PropertyTimeline } from "@/features/properties/components/property-timeline";
import { RecommendationCard } from "@/features/properties/components/recommendation-card";
import { buildDashboardInventory } from "@/features/properties/lib/dashboard-availability";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

/**
 * Central Property Dashboard (FM-0014) — Overview landing composition.
 * Identity, location, availability, datasets/analyses, summaries, timeline,
 * recommendation placeholder, and module quick-nav. Real services only.
 */
export function PropertyDashboard({ view }: { view: WorkspaceView }) {
  const inventory = buildDashboardInventory(view);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardIdentityCard view={view} />
        <DataAvailabilityCard inventory={inventory} />
        <AvailableDatasetsCard inventory={inventory} />
        <AvailableAnalysesCard propertyId={view.property.id} inventory={inventory} />
        <ParcelSummaryCard view={view} />
        <OverviewSummaryCard view={view} />
        <PropertyTimeline view={view} />
        <RecommendationCard />
        <ModuleQuickNav propertyId={view.property.id} />
      </div>
    </div>
  );
}
