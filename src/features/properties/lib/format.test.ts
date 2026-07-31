import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatAcreage,
  formatPropertyAddress,
  geometryStatusLabel,
} from "@/features/properties/lib/format";
import type { Parcel, Property } from "@/lib/properties/types";

const baseProperty: Property = {
  id: "p1",
  organizationId: "o1",
  name: "Test",
  status: "discovered",
  addressLine1: "100 Main",
  addressLine2: null,
  city: "Austin",
  stateRegion: "TX",
  postalCode: "78701",
  countryCode: "US",
  latitude: null,
  longitude: null,
  createdBy: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  archivedAt: null,
};

describe("property format helpers", () => {
  it("formats address lines", () => {
    assert.equal(formatPropertyAddress(baseProperty), "100 Main, Austin, TX 78701");
    assert.equal(
      formatPropertyAddress({ ...baseProperty, addressLine1: null, city: null, postalCode: null }),
      "TX",
    );
  });

  it("formats acreage and geometry status", () => {
    assert.equal(formatAcreage(1.25), "1.25 ac");
    assert.equal(formatAcreage(null), "—");
    assert.equal(geometryStatusLabel(null), "No parcel");
    const parcel = {
      geometry: { hasGeometry: true },
    } as Parcel;
    assert.equal(geometryStatusLabel(parcel), "Boundary present");
  });
});
