import type { WorkspaceView } from "@/features/properties/lib/load-workspace";
import type { WorkspaceSection } from "@/features/properties/types";
import { WORKSPACE_SECTION_LABELS } from "@/features/properties/types";

export type AvailabilityState = "available" | "partial" | "missing" | "not_built";

export type DataAvailabilityItem = {
  id: string;
  label: string;
  state: AvailabilityState;
  detail: string;
};

export type DatasetInventoryItem = {
  id: string;
  label: string;
  state: AvailabilityState;
  detail: string;
};

export type AnalysisInventoryItem = {
  id: string;
  section: Exclude<WorkspaceSection, "overview">;
  label: string;
  state: AvailabilityState;
  detail: string;
  hrefSuffix: string;
};

export type DashboardInventory = {
  availability: DataAvailabilityItem[];
  datasets: DatasetInventoryItem[];
  analyses: AnalysisInventoryItem[];
  availableCount: number;
  missingCount: number;
  notBuiltCount: number;
};

function countByState(items: { state: AvailabilityState }[], state: AvailabilityState): number {
  return items.filter((item) => item.state === state).length;
}

/**
 * Derive data-availability and module inventory from a live WorkspaceView.
 * Never invents zoning/financial values — future modules report not_built.
 */
export function buildDashboardInventory(view: WorkspaceView): DashboardInventory {
  const hasParcel = Boolean(view.primaryParcel);
  const hasGeometry = Boolean(view.primaryParcel?.geometry.hasGeometry);
  const hasApn = Boolean(view.primaryParcel?.apn);
  const hasAddress = Boolean(view.property.addressLine1 || view.primaryParcel?.situsAddress);
  const hasCoords = view.property.latitude != null && view.property.longitude != null;
  const hasProvenance = Boolean(view.primaryParcel?.provenance.sourceRetrievedAt);

  const availability: DataAvailabilityItem[] = [
    {
      id: "identity",
      label: "Property identity",
      state: view.property.name ? "available" : "missing",
      detail: view.property.name || "Name not set",
    },
    {
      id: "location",
      label: "Location",
      state:
        hasAddress || hasCoords ? (hasAddress && hasCoords ? "available" : "partial") : "missing",
      detail: hasAddress
        ? hasCoords
          ? "Address and display pin present"
          : "Address present; display pin not set"
        : hasCoords
          ? "Display pin present; address not set"
          : "No address or coordinates",
    },
    {
      id: "parcel",
      label: "Primary parcel",
      state: hasParcel ? (hasApn && hasGeometry ? "available" : "partial") : "missing",
      detail: hasParcel
        ? [
            hasApn ? "APN" : "No APN",
            hasGeometry ? "geometry" : "no geometry",
            view.primaryParcel?.provenance.provider ?? "unknown provider",
          ].join(" · ")
        : "No parcel linked",
    },
    {
      id: "provenance",
      label: "Parcel provenance",
      state: hasProvenance ? "available" : hasParcel ? "partial" : "missing",
      detail: hasProvenance
        ? "Source retrieval timestamp recorded"
        : hasParcel
          ? "Parcel linked without retrieval timestamp"
          : "Import a parcel to capture provenance",
    },
    {
      id: "regrid",
      label: "Regrid ingestion",
      state: view.regridConfigured ? "available" : "missing",
      detail: view.regridConfigured
        ? "REGRID_API_TOKEN configured (server)"
        : "Regrid token not configured — parcel import unavailable",
    },
  ];

  const datasets: DatasetInventoryItem[] = [
    {
      id: "property-record",
      label: "Property record",
      state: "available",
      detail: "Organization-owned Property row",
    },
    {
      id: "parcel-geometry",
      label: "Parcel geometry",
      state: hasGeometry ? "available" : "missing",
      detail: hasGeometry ? "Source boundary (EPSG:4326 MultiPolygon)" : "No boundary stored",
    },
    {
      id: "parcel-attributes",
      label: "Parcel attributes",
      state: hasParcel ? (hasApn ? "available" : "partial") : "missing",
      detail: hasParcel ? "APN / county / acreage from linked parcel" : "Awaiting parcel import",
    },
    {
      id: "zoning-dataset",
      label: "Zoning classification",
      state: "not_built",
      detail: "Future — FM-0016 Zoning data model",
    },
    {
      id: "constraints-dataset",
      label: "Development constraints",
      state: "not_built",
      detail: "Future — FM-0017 Constraints analysis",
    },
    {
      id: "financial-dataset",
      label: "Financial inputs",
      state: "not_built",
      detail: "Future — FM-0018 / FM-0019",
    },
  ];

  const analyses: AnalysisInventoryItem[] = (
    [
      "parcel",
      "zoning",
      "constraints",
      "assumptions",
      "financial",
      "recommendation",
      "documents",
      "activity",
    ] as const
  ).map((section) => {
    if (section === "parcel") {
      return {
        id: section,
        section,
        label: WORKSPACE_SECTION_LABELS[section],
        state: hasParcel ? ("partial" as const) : ("missing" as const),
        detail: hasParcel
          ? "Parcel facts on Overview; dedicated Parcel module still Coming Soon"
          : "No parcel data yet",
        hrefSuffix: "/parcel",
      };
    }
    if (section === "activity") {
      return {
        id: section,
        section,
        label: WORKSPACE_SECTION_LABELS[section],
        state: "partial" as const,
        detail: "Timeline on Overview; full Activity module Coming Soon",
        hrefSuffix: "/activity",
      };
    }
    if (section === "recommendation") {
      return {
        id: section,
        section,
        label: WORKSPACE_SECTION_LABELS[section],
        state: "not_built" as const,
        detail: "Placeholder only — AI recommendation is FM-0020",
        hrefSuffix: "/recommendation",
      };
    }
    return {
      id: section,
      section,
      label: WORKSPACE_SECTION_LABELS[section],
      state: "not_built" as const,
      detail: "Module shell ready; analysis not implemented",
      hrefSuffix: `/${section}`,
    };
  });

  const all = [...availability, ...datasets, ...analyses];

  return {
    availability,
    datasets,
    analyses,
    availableCount: countByState(all, "available") + countByState(all, "partial"),
    missingCount: countByState(all, "missing"),
    notBuiltCount: countByState(all, "not_built"),
  };
}

export function availabilityTone(
  state: AvailabilityState,
): "success" | "info" | "warning" | "muted" {
  switch (state) {
    case "available":
      return "success";
    case "partial":
      return "info";
    case "missing":
      return "warning";
    case "not_built":
      return "muted";
  }
}

export function availabilityLabel(state: AvailabilityState): string {
  switch (state) {
    case "available":
      return "Available";
    case "partial":
      return "Partial";
    case "missing":
      return "Missing";
    case "not_built":
      return "Not built";
  }
}
