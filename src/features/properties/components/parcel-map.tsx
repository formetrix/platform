"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  boundsFromParcelGeometry,
  getMapboxAccessToken,
  geometryPrecisionCaption,
  mapboxStyleUrl,
  markerFromPropertyOrCentroid,
  toMapFeatureCollection,
  type MapboxBasemapStyle,
  type ParcelMapGeometry,
} from "@/lib/mapbox";
import type { GeometryQuality } from "@/lib/properties/types";

import "mapbox-gl/dist/mapbox-gl.css";

const SOURCE_ID = "parcel-boundary";
const FILL_LAYER_ID = "parcel-boundary-fill";
const LINE_LAYER_ID = "parcel-boundary-line";

export type ParcelMapProps = {
  geometry: ParcelMapGeometry;
  latitude: number | null;
  longitude: number | null;
  centroidGeoJson: unknown;
  geometryQuality: GeometryQuality | null;
  className?: string;
};

function addParcelLayers(map: mapboxgl.Map, geometry: ParcelMapGeometry): void {
  if (map.getSource(SOURCE_ID)) {
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    source.setData(toMapFeatureCollection(geometry));
    return;
  }

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: toMapFeatureCollection(geometry),
  });

  map.addLayer({
    id: FILL_LAYER_ID,
    type: "fill",
    source: SOURCE_ID,
    paint: {
      "fill-color": "#00D4FF",
      "fill-opacity": 0.22,
    },
  });

  map.addLayer({
    id: LINE_LAYER_ID,
    type: "line",
    source: SOURCE_ID,
    paint: {
      "line-color": "#0A2540",
      "line-width": 2,
      "line-opacity": 0.9,
    },
  });
}

function fitToParcel(map: mapboxgl.Map, geometry: ParcelMapGeometry): void {
  const bounds = boundsFromParcelGeometry(geometry);
  if (!bounds) return;
  map.fitBounds(bounds, { padding: 48, maxZoom: 18, duration: 0 });
}

/**
 * Interactive Mapbox parcel map — client-only (WebGL).
 * Renders live GeoJSON boundary, fits bounds, property marker, street/satellite.
 */
export function ParcelMap({
  geometry,
  latitude,
  longitude,
  centroidGeoJson,
  geometryQuality,
  className,
}: ParcelMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [style, setStyle] = useState<MapboxBasemapStyle>("street");
  const [loadError, setLoadError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    const token = getMapboxAccessToken();
    const container = containerRef.current;
    if (!token || !container) {
      setLoadError("Mapbox access token is not configured.");
      return;
    }

    mapboxgl.accessToken = token;
    let cancelled = false;
    setLoadError(null);

    const map = new mapboxgl.Map({
      container,
      style: mapboxStyleUrl(style),
      attributionControl: true,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    const onLoad = () => {
      if (cancelled) return;
      addParcelLayers(map, geometry);
      fitToParcel(map, geometry);

      const markerLngLat = markerFromPropertyOrCentroid({
        latitude,
        longitude,
        centroid: centroidGeoJson,
      });
      if (markerLngLat) {
        markerRef.current?.remove();
        markerRef.current = new mapboxgl.Marker({ color: "#0E7490" })
          .setLngLat(markerLngLat)
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setText(
              latitude != null && longitude != null ? "Property display pin" : "Parcel centroid",
            ),
          )
          .addTo(map);
      }
    };

    map.on("load", onLoad);
    map.on("error", () => {
      if (!cancelled) setLoadError("Unable to load the map basemap.");
    });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Recreate map when basemap style changes (Mapbox requires a new style load).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geometry/marker updates handled below
  }, [style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    addParcelLayers(map, geometry);
    fitToParcel(map, geometry);

    const markerLngLat = markerFromPropertyOrCentroid({
      latitude,
      longitude,
      centroid: centroidGeoJson,
    });
    markerRef.current?.remove();
    markerRef.current = null;
    if (markerLngLat) {
      markerRef.current = new mapboxgl.Marker({ color: "#0E7490" })
        .setLngLat(markerLngLat)
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setText(
            latitude != null && longitude != null ? "Property display pin" : "Parcel centroid",
          ),
        )
        .addTo(map);
    }
  }, [geometry, latitude, longitude, centroidGeoJson]);

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p id={titleId} className="text-muted text-xs">
          {geometryPrecisionCaption(geometryQuality)}
        </p>
        <div className="flex gap-1" role="group" aria-label="Map style">
          <Button
            type="button"
            size="sm"
            variant={style === "street" ? "primary" : "secondary"}
            aria-pressed={style === "street"}
            onClick={() => setStyle("street")}
          >
            Street
          </Button>
          <Button
            type="button"
            size="sm"
            variant={style === "satellite" ? "primary" : "secondary"}
            aria-pressed={style === "satellite"}
            onClick={() => setStyle("satellite")}
          >
            Satellite
          </Button>
        </div>
      </div>
      {loadError ? (
        <div
          role="status"
          className="border-border bg-background/60 text-muted flex h-72 items-center justify-center rounded-lg border border-dashed p-4 text-sm"
        >
          {loadError}
        </div>
      ) : (
        <div
          ref={containerRef}
          role="img"
          aria-labelledby={titleId}
          className="border-border h-72 w-full overflow-hidden rounded-lg border sm:h-96"
        />
      )}
    </div>
  );
}
