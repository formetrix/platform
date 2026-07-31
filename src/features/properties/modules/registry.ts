import type { WorkspaceModuleId, WorkspaceModulePanel } from "@/features/properties/modules/types";

/**
 * Dynamic import map for future analysis modules.
 * Pages call these loaders so webpack can code-split each section.
 */
export const WORKSPACE_MODULE_LOADERS = {
  parcel: () => import("@/features/properties/modules/parcel/panel"),
  zoning: () => import("@/features/properties/modules/zoning/panel"),
  constraints: () => import("@/features/properties/modules/constraints/panel"),
  assumptions: () => import("@/features/properties/modules/assumptions/panel"),
  financial: () => import("@/features/properties/modules/financial/panel"),
  recommendation: () => import("@/features/properties/modules/recommendation/panel"),
  documents: () => import("@/features/properties/modules/documents/panel"),
  activity: () => import("@/features/properties/modules/activity/panel"),
} as const satisfies Record<WorkspaceModuleId, () => Promise<{ default: WorkspaceModulePanel }>>;
