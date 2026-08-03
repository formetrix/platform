import { WorkspaceModulePage } from "@/features/properties/components/workspace-module-page";

export default async function PropertyZoningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceModulePage propertyId={id} moduleId="zoning" />;
}
