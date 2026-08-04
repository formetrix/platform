"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";
import { isMapboxConfigured, parseParcelGeoJson } from "@/lib/mapbox";

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
        className="border-border bg-background/60 text-muted flex h-72 items-center justify-center rounded-lg border border-dashed text-sm sm:h-96"
      >
        Loading map…
      </div>
    ),
  },
);

/**
 * Property Dashboard map panel (FM-0015).
 * Live parcel GeoJSON only — never mock boundaries.
 */
export function ParcelMapCard({ view }: { view: WorkspaceView }) {
  const parcel = view.primaryParcel;
  const mapboxReady = isMapboxConfigured();
  const geometry = parseParcelGeoJson(
    parcel?.geometry.geometryGeoJson ?? parcel?.geometry.geometryWkt ?? null,
  );

  let body: React.ReactNode;
  if (!mapboxReady) {
    body = (
      <p className="text-muted text-sm">
        Mapbox is not configured. Set{" "}
        <code className="font-metric">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
        <code className="font-metric">.env.local</code> (and restart the dev server) to display the
        parcel map.
      </p>
    );
  } else if (!parcel) {
    body = (
      <p className="text-muted text-sm">
        No parcel is linked to this property yet. Import a parcel with boundary geometry to
        visualize it here.
      </p>
    );
  } else if (!parcel.geometry.hasGeometry || !geometry) {
    body = (
      <p className="text-muted text-sm">
        Parcel boundary geometry is not available for this property. The map stays empty until live
        PostGIS geometry is stored — Formetrix does not invent parcel outlines.
      </p>
    );
  } else {
    body = (
      <ParcelMap
        geometry={geometry}
        latitude={view.property.latitude}
        longitude={view.property.longitude}
        centroidGeoJson={parcel.geometry.centroidGeoJson ?? parcel.geometry.centroidWkt}
        geometryQuality={parcel.provenance.geometryQuality}
      />
    );
  }

  return (
    <Card className="shadow-soft xl:col-span-2">
      <CardHeader>
        <CardTitle>Parcel map</CardTitle>
        <CardDescription>
          Live source boundary from PostGIS (EPSG:4326). Street and satellite basemaps via Mapbox.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
