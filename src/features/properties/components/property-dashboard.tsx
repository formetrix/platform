import { AvailableAnalysesCard } from "@/features/properties/components/available-analyses-card";
import { AvailableDatasetsCard } from "@/features/properties/components/available-datasets-card";
import { DashboardIdentityCard } from "@/features/properties/components/dashboard-identity-card";
import { DataAvailabilityCard } from "@/features/properties/components/data-availability-card";
import { ModuleQuickNav } from "@/features/properties/components/module-quick-nav";
import { OverviewSummaryCard } from "@/features/properties/components/overview-summary-card";
import { ParcelMapCard } from "@/features/properties/components/parcel-map-card";
import { ParcelSummaryCard } from "@/features/properties/components/parcel-summary-card";
import { PropertyTimeline } from "@/features/properties/components/property-timeline";
import { RecommendationCard } from "@/features/properties/components/recommendation-card";
import { ZoningOverview } from "@/features/properties/components/zoning-overview";
import { buildDashboardInventory } from "@/features/properties/lib/dashboard-availability";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

/**
 * Central Property Dashboard (FM-0014 / FM-0015 / FM-0016).
 * Includes the complete Zoning Overview (live data only; never fabricated).
 */
export function PropertyDashboard({ view }: { view: WorkspaceView }) {
  const inventory = buildDashboardInventory(view);

  let zoningEmptyReason: string | undefined;
  if (!view.primaryParcel) {
    zoningEmptyReason =
      "No parcel is linked to this property yet. Link or import a parcel before zoning can be stored.";
  } else if (!view.zoning) {
    zoningEmptyReason =
      "No zoning classification is stored for the primary parcel. Formetrix does not invent zoning districts.";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardIdentityCard view={view} />
        <ParcelMapCard view={view} />
        <div className="xl:col-span-2">
          <ZoningOverview
            overview={view.zoning}
            parcelApn={view.primaryParcel?.apn}
            emptyReason={zoningEmptyReason}
          />
        </div>
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
