import { WORKSPACE_MODULE_LOADERS } from "@/features/properties/modules/registry";
import type { WorkspaceModuleId } from "@/features/properties/modules/types";

/**
 * Server entry for a lazy-load-ready workspace module route.
 * Loads the panel via the registry import map (code-split ready).
 */
export async function WorkspaceModulePage({
  propertyId,
  moduleId,
}: {
  propertyId: string;
  moduleId: WorkspaceModuleId;
}) {
  const mod = await WORKSPACE_MODULE_LOADERS[moduleId]();
  const Panel = mod.default;
  return <Panel propertyId={propertyId} />;
}
