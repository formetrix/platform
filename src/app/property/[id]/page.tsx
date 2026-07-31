import { notFound } from "next/navigation";

import { PropertyDashboard } from "@/features/properties/components/property-dashboard";
import { loadPropertyWorkspace } from "@/features/properties/lib/load-workspace";

/**
 * Property Dashboard — primary Overview landing (FM-0014).
 * Shows what the property is, where it is, and what data is available.
 * Reads live Property + Parcel services; no mock records.
 */
export default async function PropertyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadPropertyWorkspace(id);

  if (result.status === "not_found") {
    notFound();
  }
  if (result.status !== "ok") {
    return null;
  }

  return <PropertyDashboard view={result.view} />;
}
