import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  availabilityLabel,
  buildDashboardInventory,
} from "@/features/properties/lib/dashboard-availability";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";
import type { Parcel, Property } from "@/lib/properties/types";

function baseView(overrides: Partial<WorkspaceView> = {}): WorkspaceView {
  const property: Property = {
    id: "prop-1",
    organizationId: "org-1",
    name: "Sample Site",
    status: "discovered",
    addressLine1: "100 Main St",
    addressLine2: null,
    city: "Austin",
    stateRegion: "TX",
    postalCode: "78701",
    countryCode: "US",
    latitude: 30.27,
    longitude: -97.74,
    createdBy: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    archivedAt: null,
  };

  return {
    property,
    organizationName: "Acme Dev",
    organizationId: "org-1",
    primaryParcel: null,
    parcels: [],
    links: [],
    regridConfigured: false,
    ...overrides,
  };
}

const parcel: Parcel = {
  id: "parcel-1",
  apn: "1-2-3",
  normalizedApn: "123",
  county: "Travis",
  stateRegion: "TX",
  countryCode: "US",
  situsAddress: "100 Main St",
  acreage: 1.5,
  provenance: {
    provider: "regrid",
    providerParcelId: "uuid-1",
    geometrySource: "regrid",
    sourceRetrievedAt: "2026-07-15T00:00:00Z",
    sourceUpdatedAt: null,
    rawSourceMetadata: {},
    geometryQuality: "high",
  },
  geometry: {
    srid: 4326,
    geometryWkt: "MULTIPOLYGON(...)",
    centroidWkt: null,
    hasGeometry: true,
  },
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-15T00:00:00Z",
};

describe("buildDashboardInventory", () => {
  it("marks identity and location available from property fields", () => {
    const inventory = buildDashboardInventory(baseView());
    const identity = inventory.availability.find((i) => i.id === "identity");
    const location = inventory.availability.find((i) => i.id === "location");
    assert.equal(identity?.state, "available");
    assert.equal(location?.state, "available");
  });

  it("marks parcel missing when none linked and does not invent zoning data", () => {
    const inventory = buildDashboardInventory(baseView());
    const parcelItem = inventory.availability.find((i) => i.id === "parcel");
    const zoning = inventory.datasets.find((i) => i.id === "zoning-dataset");
    const financial = inventory.datasets.find((i) => i.id === "financial-dataset");
    assert.equal(parcelItem?.state, "missing");
    assert.equal(zoning?.state, "not_built");
    assert.equal(financial?.state, "not_built");
    assert.equal(availabilityLabel("not_built"), "Not built");
  });

  it("marks parcel and geometry available when a primary parcel is linked", () => {
    const inventory = buildDashboardInventory(
      baseView({
        primaryParcel: parcel,
        parcels: [parcel],
        regridConfigured: true,
      }),
    );
    assert.equal(inventory.availability.find((i) => i.id === "parcel")?.state, "available");
    assert.equal(inventory.datasets.find((i) => i.id === "parcel-geometry")?.state, "available");
    assert.equal(inventory.availability.find((i) => i.id === "regrid")?.state, "available");
  });

  it("lists analysis modules without claiming zoning/financial engines exist", () => {
    const inventory = buildDashboardInventory(baseView());
    const zoning = inventory.analyses.find((i) => i.id === "zoning");
    const financial = inventory.analyses.find((i) => i.id === "financial");
    assert.equal(zoning?.state, "not_built");
    assert.equal(financial?.state, "not_built");
    assert.ok(inventory.analyses.length >= 6);
  });
});
