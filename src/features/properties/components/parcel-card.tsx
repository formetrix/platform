"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FactRow } from "@/features/properties/components/fact-row";
import { formatAcreage, formatDateTime, truncateId } from "@/features/properties/lib/format";
import type { Parcel } from "@/lib/properties/types";

export function ParcelCard({
  parcel,
  regridConfigured,
}: {
  parcel: Parcel | null;
  regridConfigured: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!parcel) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Parcel</CardTitle>
        </CardHeader>
        <CardContent className="text-muted flex flex-col gap-2">
          <p>No parcel is linked to this property yet.</p>
          <p className="text-xs">
            {regridConfigured
              ? "Import a parcel via the Regrid ingestion services to populate this card."
              : "Regrid is not configured (REGRID_API_TOKEN). Parcel search/import is unavailable until a server token is set."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const metadataSummary = [
    parcel.county ? `County: ${parcel.county}` : null,
    parcel.stateRegion ? `State: ${parcel.stateRegion}` : null,
    parcel.acreage != null ? formatAcreage(parcel.acreage) : null,
    parcel.provenance.geometryQuality ? `Quality: ${parcel.provenance.geometryQuality}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rawJson = JSON.stringify(parcel.provenance.rawSourceMetadata, null, 2);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>Parcel</CardTitle>
        <Badge tone="info">{parcel.provenance.provider}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl>
          <FactRow label="Provider" value={parcel.provenance.provider} mono />
          <FactRow label="Provider ID" value={parcel.provenance.providerParcelId} mono />
          <FactRow
            label="Geometry"
            value={parcel.geometry.hasGeometry ? "MultiPolygon (EPSG:4326)" : "Absent"}
          />
          <FactRow
            label="Centroid"
            value={
              parcel.geometry.centroidGeoJson || parcel.geometry.centroidWkt
                ? "Present"
                : "Not available"
            }
          />
          <FactRow
            label="Boundary"
            value={
              parcel.geometry.geometryWkt
                ? "Stored (source boundary)"
                : parcel.geometry.hasGeometry
                  ? "Present"
                  : "Not available"
            }
          />
          <FactRow label="Metadata summary" value={metadataSummary || "No summary fields"} />
          <FactRow label="Retrieved" value={formatDateTime(parcel.provenance.sourceRetrievedAt)} />
          <FactRow
            label="Provider updated"
            value={formatDateTime(parcel.provenance.sourceUpdatedAt)}
          />
          <FactRow label="Parcel id" value={truncateId(parcel.id)} mono />
        </dl>

        <div className="border-border rounded-lg border">
          <button
            type="button"
            className="text-muted hover:text-foreground focus-visible:ring-primary flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium tracking-wide uppercase focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            Raw metadata
            <span className="font-metric">{expanded ? "−" : "+"}</span>
          </button>
          {expanded ? (
            <pre className="border-border bg-background/50 max-h-64 overflow-auto border-t p-3 text-xs break-all whitespace-pre-wrap">
              {rawJson}
            </pre>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
