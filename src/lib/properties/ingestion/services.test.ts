import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPropertyFromParcel,
  createTestIngestionDeps,
  importParcel,
  refreshParcel,
  searchParcels,
} from "@/lib/properties/ingestion/services";
import { createMemoryParcelStore } from "@/lib/properties/ingestion/parcel-store";
import { createRegridClient } from "@/lib/regrid/client";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";
import type { Parcel, Property, PropertyParcel } from "@/lib/properties/types";

const candidate: NormalizedParcelCandidate = {
  provider: "regrid",
  providerParcelId: "22222222-2222-2222-2222-222222222222",
  apn: "10-20-30",
  normalizedApn: "102030",
  county: "Travis",
  stateRegion: "TX",
  countryCode: "US",
  situsAddress: "200 Main St",
  city: "Austin",
  postalCode: "78701",
  acreage: 2.5,
  geometryGeoJson: {
    type: "Polygon",
    coordinates: [
      [
        [-97.74, 30.27],
        [-97.73, 30.27],
        [-97.73, 30.28],
        [-97.74, 30.28],
        [-97.74, 30.27],
      ],
    ],
  },
  geometrySource: "regrid",
  sourceUpdatedAt: "2026-02-01T00:00:00Z",
  geometryQuality: "high",
  rawFeature: {
    type: "Feature",
    properties: { ll_uuid: "22222222-2222-2222-2222-222222222222", parcelnumb: "10-20-30" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-97.74, 30.27],
          [-97.73, 30.27],
          [-97.73, 30.28],
          [-97.74, 30.28],
          [-97.74, 30.27],
        ],
      ],
    },
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("searchParcels", () => {
  it("returns invalid_apn for empty/invalid APN", async () => {
    const deps = createTestIngestionDeps({
      regridClient: createRegridClient({
        config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
        fetchImpl: async () => jsonResponse({ features: [] }),
      }),
    });
    const result = await searchParcels({ mode: "apn", apn: "!!!" }, deps);
    assert.equal(result.status, "invalid_apn");
  });

  it("maps rate limits to a typed result", async () => {
    const deps = createTestIngestionDeps({
      regridClient: createRegridClient({
        config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
        maxAttempts: 1,
        fetchImpl: async () =>
          new Response("{}", {
            status: 429,
            headers: { "retry-after": "2", "content-type": "application/json" },
          }),
      }),
    });
    const result = await searchParcels({ mode: "address", query: "x" }, deps);
    assert.equal(result.status, "rate_limited");
    if (result.status === "rate_limited") {
      assert.equal(result.retryAfterMs, 2000);
    }
  });

  it("maps API failures", async () => {
    const deps = createTestIngestionDeps({
      regridClient: createRegridClient({
        config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
        maxAttempts: 1,
        fetchImpl: async () => jsonResponse({ error: "nope" }, 503),
      }),
    });
    const result = await searchParcels({ mode: "address", query: "x" }, deps);
    assert.equal(result.status, "api_error");
  });
});

describe("importParcel / duplicate strategy", () => {
  it("creates a parcel and preserves provenance", async () => {
    const store = createMemoryParcelStore();
    const retrievedAt = "2026-07-31T20:00:00.000Z";
    const result = await importParcel(
      { candidate },
      {
        parcelStore: store,
        now: () => new Date(retrievedAt),
        regridClient: createRegridClient({
          config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
          fetchImpl: async () => jsonResponse({ features: [] }),
        }),
      },
    );

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.created, true);
    assert.equal(result.parcel.provenance.provider, "regrid");
    assert.equal(result.parcel.provenance.providerParcelId, candidate.providerParcelId);
    assert.equal(result.parcel.provenance.sourceRetrievedAt, retrievedAt);
    assert.equal(result.parcel.provenance.sourceUpdatedAt, "2026-02-01T00:00:00Z");
    assert.equal(result.parcel.provenance.rawSourceMetadata.provider, "regrid");
    assert.ok(result.parcel.provenance.rawSourceMetadata.feature);
  });

  it("reuses an existing parcel for the same provider identity (no duplicate)", async () => {
    const store = createMemoryParcelStore();
    const deps = {
      parcelStore: store,
      now: () => new Date("2026-07-31T21:00:00.000Z"),
      regridClient: createRegridClient({
        config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
        fetchImpl: async () => jsonResponse({ features: [] }),
      }),
    };

    const first = await importParcel({ candidate }, deps);
    assert.equal(first.status, "ok");
    if (first.status !== "ok") return;

    const second = await importParcel({ candidate }, deps);
    assert.equal(second.status, "ok");
    if (second.status !== "ok") return;

    assert.equal(second.created, false);
    assert.equal(second.parcel.id, first.parcel.id);
    assert.equal(second.parcel.provenance.sourceRetrievedAt, "2026-07-31T21:00:00.000Z");
  });
});

describe("createPropertyFromParcel", () => {
  it("creates property, reuses parcel, and attaches primary link", async () => {
    const existing: Parcel = {
      id: "parcel-existing",
      apn: candidate.apn,
      normalizedApn: candidate.normalizedApn,
      county: candidate.county,
      stateRegion: candidate.stateRegion,
      countryCode: candidate.countryCode,
      situsAddress: candidate.situsAddress,
      acreage: candidate.acreage,
      provenance: {
        provider: "regrid",
        providerParcelId: candidate.providerParcelId,
        geometrySource: "regrid",
        sourceRetrievedAt: "2026-01-01T00:00:00.000Z",
        sourceUpdatedAt: "2026-02-01T00:00:00Z",
        rawSourceMetadata: { provider: "regrid" },
        geometryQuality: "high",
      },
      geometry: {
        srid: 4326,
        geometryWkt: null,
        centroidWkt: null,
        hasGeometry: true,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const property: Property = {
      id: "prop-1",
      organizationId: "org-1",
      name: "200 Main St",
      status: "discovered",
      addressLine1: "200 Main St",
      addressLine2: null,
      city: "Austin",
      stateRegion: "TX",
      postalCode: "78701",
      countryCode: "US",
      latitude: null,
      longitude: null,
      createdBy: "user-1",
      createdAt: "2026-07-31T22:00:00.000Z",
      updatedAt: "2026-07-31T22:00:00.000Z",
      archivedAt: null,
    };

    const link: PropertyParcel = {
      id: "link-1",
      propertyId: property.id,
      parcelId: existing.id,
      relationshipType: "primary_site",
      isPrimary: true,
      createdAt: "2026-07-31T22:00:00.000Z",
    };

    let attachCalls = 0;
    const deps = createTestIngestionDeps({
      parcels: [existing],
      createPropertyFn: async () => ({ status: "ok", property }),
      attachParcelFn: async (options) => {
        attachCalls += 1;
        assert.equal(options.parcelId, existing.id);
        assert.equal(options.isPrimary, true);
        return { status: "ok", link };
      },
      now: () => new Date("2026-07-31T22:00:00.000Z"),
    });

    const result = await createPropertyFromParcel({ organizationId: "org-1", candidate }, deps);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.parcelCreated, false);
    assert.equal(result.parcel.id, existing.id);
    assert.equal(result.property.id, property.id);
    assert.equal(result.link.isPrimary, true);
    assert.equal(attachCalls, 1);
  });

  it("surfaces duplicate_relationship when the link already exists", async () => {
    const deps = createTestIngestionDeps({
      createPropertyFn: async () => ({
        status: "ok",
        property: {
          id: "prop-2",
          organizationId: "org-1",
          name: "X",
          status: "discovered",
          addressLine1: null,
          addressLine2: null,
          city: null,
          stateRegion: null,
          postalCode: null,
          countryCode: null,
          latitude: null,
          longitude: null,
          createdBy: null,
          createdAt: "2026-07-31T22:00:00.000Z",
          updatedAt: "2026-07-31T22:00:00.000Z",
          archivedAt: null,
        },
      }),
      attachParcelFn: async () => ({ status: "duplicate_relationship" }),
      now: () => new Date("2026-07-31T22:00:00.000Z"),
    });

    const result = await createPropertyFromParcel({ organizationId: "org-1", candidate }, deps);
    assert.equal(result.status, "duplicate_relationship");
  });
});

describe("refreshParcel", () => {
  it("updates provenance timestamps while keeping identity", async () => {
    const store = createMemoryParcelStore();
    const first = await importParcel(
      { candidate },
      {
        parcelStore: store,
        now: () => new Date("2026-07-31T10:00:00.000Z"),
        regridClient: createRegridClient({
          config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
          fetchImpl: async () => jsonResponse({ features: [] }),
        }),
      },
    );
    assert.equal(first.status, "ok");
    if (first.status !== "ok") return;

    const refreshedFeature = {
      ...candidate.rawFeature,
      properties: {
        ...candidate.rawFeature.properties,
        ll_address: "200 Main Street",
        ll_updated_at: "2026-07-30T00:00:00Z",
      },
    };

    const result = await refreshParcel(first.parcel.id, {
      parcelStore: store,
      now: () => new Date("2026-07-31T12:00:00.000Z"),
      regridClient: createRegridClient({
        config: { apiToken: "t", baseUrl: "https://app.regrid.com" },
        fetchImpl: async () => jsonResponse(refreshedFeature),
      }),
    });

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.parcel.id, first.parcel.id);
    assert.equal(result.parcel.provenance.providerParcelId, candidate.providerParcelId);
    assert.equal(result.parcel.provenance.sourceRetrievedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(result.parcel.situsAddress, "200 Main Street");
  });
});
