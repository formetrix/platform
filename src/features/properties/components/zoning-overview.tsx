import { formatDateTime } from "@/features/properties/lib/format";
import { FactRow } from "@/features/properties/components/fact-row";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDensity,
  formatFar,
  formatHeightFt,
  formatLotCoveragePct,
  formatMunicipality,
  formatOverlays,
  formatParking,
  formatSetbacksSummary,
  formatUseList,
  formatZoningCode,
  formatZoningMissing,
  type ParcelZoningOverview,
} from "@/lib/zoning";

/**
 * Full Zoning Overview — live ParcelZoningOverview only.
 * Missing fields stay "Not available"; never invents classifications.
 */
export function ZoningOverview({
  overview,
  parcelApn,
  emptyReason,
}: {
  overview: ParcelZoningOverview | null;
  parcelApn?: string | null;
  emptyReason?: string;
}) {
  if (!overview) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Zoning Overview</CardTitle>
          <CardDescription>
            Factual zoning classification for the primary parcel. Formetrix does not invent zoning.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted flex flex-col gap-2 text-sm">
          <p>{emptyReason ?? "No zoning classification is stored for this property yet."}</p>
          <p className="text-xs">
            Zoning is linked per parcel via provider ingestion. Until a provider writes a record,
            every field below remains unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dim = overview.dimensional;

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Zoning Overview
            </p>
            <CardTitle className="mt-1">{formatZoningCode(overview)}</CardTitle>
            <CardDescription className="mt-1">
              {formatMunicipality(overview)}
              {parcelApn ? ` · APN ${parcelApn}` : ""}
            </CardDescription>
          </div>
          <Badge tone="info">{overview.provenance.provider}</Badge>
        </CardHeader>
        <CardContent>
          <dl>
            <FactRow label="Zoning district" value={formatZoningCode(overview)} mono />
            <FactRow label="Municipality" value={formatMunicipality(overview)} />
            <FactRow label="Overlays" value={formatOverlays(overview)} />
            <FactRow
              label="District description"
              value={overview.district.description?.trim() || formatZoningMissing()}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Permitted uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatUseList(overview.permittedUses)}</p>
            {overview.conditionalUses.length > 0 ? (
              <p className="text-muted mt-3 text-xs">
                Conditional: {formatUseList(overview.conditionalUses)}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Prohibited uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatUseList(overview.prohibitedUses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Dimensional regulations</CardTitle>
          <CardDescription>
            Units are explicit (FAR, ft, %, units/acre). Null source values show as not available —
            not zero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <FactRow
              label="Density / FAR"
              value={
                dim?.maxFar != null || dim?.maxDensityUnitsPerAcre != null
                  ? [
                      dim.maxFar != null ? formatFar(dim.maxFar) : null,
                      dim.maxDensityUnitsPerAcre != null
                        ? formatDensity(dim.maxDensityUnitsPerAcre)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : formatZoningMissing()
              }
              mono
            />
            <FactRow label="Setbacks" value={formatSetbacksSummary(dim)} mono />
            <FactRow label="Maximum height" value={formatHeightFt(dim?.maxHeightFt ?? null)} mono />
            <FactRow
              label="Lot coverage"
              value={formatLotCoveragePct(dim?.maxLotCoveragePct ?? null)}
              mono
            />
            <FactRow label="Parking requirements" value={formatParking(dim)} />
          </dl>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Provenance</CardTitle>
          <CardDescription>
            Source provider and retrieval dates for this classification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <FactRow label="Provider" value={overview.provenance.provider} mono />
            <FactRow label="Provider record" value={overview.provenance.providerRecordId} mono />
            <FactRow
              label="Source retrieved"
              value={formatDateTime(overview.provenance.sourceRetrievedAt)}
            />
            <FactRow
              label="Source updated"
              value={formatDateTime(overview.provenance.sourceUpdatedAt)}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
