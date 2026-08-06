"use client";

import dynamic from "next/dynamic";

import { FactRow } from "@/features/properties/components/fact-row";
import { formatAcreage, formatLatLng } from "@/features/properties/lib/format";
import { isMapboxConfigured, parseParcelGeoJson } from "@/lib/mapbox";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";

/** Absent provider values render as "—" rather than being filled in. */
function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "—";
}

function coordinateLabel(candidate: NormalizedParcelCandidate): string {
  if (candidate.latitude == null || candidate.longitude == null) return "—";
  return `${formatLatLng(candidate.latitude)}, ${formatLatLng(candidate.longitude)}`;
}

const ParcelMap = dynamic(
  () =>
    import("@/features/properties/components/parcel-map").then((mod) => ({
      default: mod.ParcelMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="border-border bg-background/60 text-muted flex h-56 items-center justify-center rounded-lg border border-dashed text-sm"
      >
        Loading map…
      </div>
    ),
  },
);

/**
 * What the user is about to import, before anything is written.
 *
 * Reuses the same `ParcelMap` the Property Workspace renders, so the boundary
 * shown here is the one that will be stored — not a separate preview rendering
 * that could drift from it.
 */
export function ParcelCandidatePreview({ candidate }: { candidate: NormalizedParcelCandidate }) {
  const geometry = parseParcelGeoJson(candidate.geometryGeoJson);
  const mapboxReady = isMapboxConfigured();

  return (
    <div className="flex flex-col gap-4">
      {mapboxReady && geometry ? (
        <ParcelMap
          geometry={geometry}
          latitude={candidate.latitude}
          longitude={candidate.longitude}
          centroidGeoJson={null}
          geometryQuality={candidate.geometryQuality}
        />
      ) : (
        <div
          role="status"
          className="border-border bg-background/60 text-muted flex h-40 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm"
        >
          {!mapboxReady
            ? "Map preview unavailable — Mapbox is not configured for this deployment."
            : "This parcel has no boundary geometry from the provider. It can still be imported; the map stays empty rather than showing an invented outline."}
        </div>
      )}

      <dl className="border-border rounded-lg border px-4">
        <FactRow label="Address" value={orDash(candidate.situsAddress)} />
        <FactRow label="APN" value={orDash(candidate.apn)} mono />
        <FactRow label="City" value={orDash(candidate.city)} />
        <FactRow label="County" value={orDash(candidate.county)} />
        <FactRow label="State" value={orDash(candidate.stateRegion)} />
        <FactRow label="ZIP" value={orDash(candidate.postalCode)} />
        <FactRow label="Parcel size" value={formatAcreage(candidate.acreage)} mono />
        <FactRow label="Coordinates" value={coordinateLabel(candidate)} mono />
        <FactRow label="Source" value={candidate.provider} />
      </dl>
    </div>
  );
}
