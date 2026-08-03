import type { ReactNode } from "react";

/**
 * Lazy-load-ready workspace module contract (FM-0013).
 * Future analysis modules implement this shape so pages can
 * `next/dynamic` / `import()` them without changing the shell.
 */
export type WorkspaceModuleId =
  | "parcel"
  | "zoning"
  | "constraints"
  | "assumptions"
  | "financial"
  | "recommendation"
  | "documents"
  | "activity";

export type WorkspaceModulePanelProps = {
  propertyId: string;
};

export type WorkspaceModulePanel = (props: WorkspaceModulePanelProps) => ReactNode;
