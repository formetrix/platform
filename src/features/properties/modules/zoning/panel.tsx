import { ZoningOverview } from "@/features/properties/components/zoning-overview";
import { loadPropertyWorkspace } from "@/features/properties/lib/load-workspace";
import { getPropertyZoning } from "@/lib/zoning";

/**
 * Zoning module panel (FM-0016) — live Zoning Overview for the primary parcel.
 */
export default async function ZoningModulePanel({ propertyId }: { propertyId: string }) {
  const workspace = await loadPropertyWorkspace(propertyId);
  const zoning = await getPropertyZoning(propertyId);

  if (workspace.status !== "ok") {
    return (
      <ZoningOverview overview={null} emptyReason="Unable to load property workspace for zoning." />
    );
  }

  if (zoning.status !== "ok") {
    return (
      <ZoningOverview
        overview={null}
        parcelApn={workspace.view.primaryParcel?.apn}
        emptyReason="Zoning data could not be loaded right now. No classifications were invented."
      />
    );
  }

  let emptyReason: string | undefined;
  if (!zoning.parcelId) {
    emptyReason =
      "No parcel is linked to this property yet. Link or import a parcel before zoning can be stored.";
  } else if (!zoning.primary) {
    emptyReason =
      "No zoning classification is stored for the primary parcel. Formetrix does not invent zoning districts.";
  }

  return (
    <ZoningOverview
      overview={zoning.primary}
      parcelApn={workspace.view.primaryParcel?.apn}
      emptyReason={emptyReason}
    />
  );
}
