import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatFar,
  formatMunicipality,
  formatSetbacksSummary,
  formatUseList,
  formatZoningCode,
  formatZoningMissing,
  hasAnyDimensional,
  pickPrimaryZoning,
} from "@/lib/zoning/format";
import type { ParcelZoningOverview } from "@/lib/zoning/types";

function sampleOverview(overrides: Partial<ParcelZoningOverview> = {}): ParcelZoningOverview {
  return {
    id: "pz-1",
    parcelId: "parcel-1",
    isPrimary: true,
    municipality: {
      id: "m-1",
      name: "Austin",
      stateRegion: "TX",
      countryCode: "US",
      provider: "manual",
      providerMunicipalityId: "austin-tx",
    },
    district: {
      id: "d-1",
      municipalityId: "m-1",
      code: "SF-3",
      name: "Family Residence",
      description: null,
      provider: "manual",
      providerDistrictId: "austin-sf-3",
    },
    overlays: [],
    permittedUses: [
      {
        id: "u1",
        districtId: "d-1",
        useLabel: "Single-family",
        permission: "permitted",
        notes: null,
      },
    ],
    prohibitedUses: [
      {
        id: "u2",
        districtId: "d-1",
        useLabel: "Heavy industry",
        permission: "prohibited",
        notes: null,
      },
    ],
    conditionalUses: [],
    dimensional: {
      id: "dim-1",
      districtId: "d-1",
      maxFar: 0.4,
      maxDensityUnitsPerAcre: null,
      maxHeightFt: 35,
      maxLotCoveragePct: 40,
      setbackFrontFt: 25,
      setbackSideFt: 5,
      setbackRearFt: 10,
      parkingRequirementText: "2 spaces per dwelling",
      notes: null,
    },
    provenance: {
      provider: "manual",
      providerRecordId: "rec-1",
      sourceRetrievedAt: "2026-08-01T00:00:00Z",
      sourceUpdatedAt: null,
      rawSourceMetadata: {},
    },
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("zoning format helpers", () => {
  it("never fabricates missing values as zero", () => {
    assert.equal(formatZoningMissing(), "Not available");
    assert.equal(formatFar(null), "Not available");
    assert.equal(formatZoningCode(null), "Not available");
    assert.equal(formatMunicipality(null), "Not available");
  });

  it("formats district, municipality, uses, and setbacks from live overview", () => {
    const overview = sampleOverview();
    assert.equal(formatZoningCode(overview), "SF-3 — Family Residence");
    assert.equal(formatMunicipality(overview), "Austin, TX, US");
    assert.equal(formatUseList(overview.permittedUses), "Single-family");
    assert.match(formatSetbacksSummary(overview.dimensional), /Front 25 ft/);
    assert.equal(hasAnyDimensional(overview.dimensional), true);
  });

  it("picks primary zoning when multiple classifications exist", () => {
    const secondary = sampleOverview({ id: "pz-2", isPrimary: false });
    const primary = sampleOverview({ id: "pz-1", isPrimary: true });
    assert.equal(pickPrimaryZoning([secondary, primary])?.id, "pz-1");
    assert.equal(pickPrimaryZoning([]), null);
  });
});
