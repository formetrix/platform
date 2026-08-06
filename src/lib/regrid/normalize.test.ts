import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractParcelFeatures,
  normalizeRegridFeature,
  normalizeRegridSearchResponse,
} from "@/lib/regrid/normalize";

/**
 * Regrid response normalization (FM-0030B).
 *
 * The live v2 API returns candidate groups keyed by record type and nests every
 * parcel attribute under `properties.fields`. The original parser (FM-0012) read
 * `collection.features` and `properties.<attr>`, so live address search returned
 * zero candidates and the few that resolved lost their APN, address, and
 * location fields.
 *
 * Fixtures below are trimmed from real responses. The address used is a public
 * landmark, and owner/mailing details are omitted — no private address or
 * personal detail is committed.
 */

/** Live v2 shape: attributes under `properties.fields`, groups at the top level. */
const liveParcelFeature = {
  type: "Feature" as const,
  id: 933228,
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [-96.7757, 32.7591],
        [-96.7749, 32.7591],
        [-96.7749, 32.7596],
        [-96.7757, 32.7596],
        [-96.7757, 32.7591],
      ],
    ],
  },
  properties: {
    headline: "1600 Pennsylvania Ave",
    path: "/us/tx/dallas/northeast-dallas/933228",
    ll_uuid: "a6c56bd2-5128-46a2-87ef-6a67a36cf8cb",
    score: 92,
    context: { headline: "Northeast Dallas, TX", name: "Northeast Dallas, TX" },
    fields: {
      ogc_fid: 933228,
      parcelnumb: "99240118800000000",
      parcelnumb_no_formatting: "99240118800000000",
      ll_uuid: "a6c56bd2-5128-46a2-87ef-6a67a36cf8cb",
      ll_stable_id: "parcelnumb",
      ll_gisacre: 4.4943,
      address: "1600 PENNSYLVANIA AVE",
      saddno: "1600",
      saddstr: "PENNSYLVANIA",
      saddsttyp: "AVE",
      // Live v2: `city` is a URL slug, `scity` is the real situs city.
      city: "northeast-dallas",
      scity: "DALLAS",
      county: "dallas",
      state2: "TX",
      szip: "75215-3239",
      lat: "32.759308",
      lon: "-96.775323",
      ll_updated_at: "2026-07-25 13:22:27 -0400",
      path: "/us/tx/dallas/northeast-dallas/933228",
    },
  },
};

const liveGroupedResponse = {
  parcels: { type: "FeatureCollection" as const, features: [liveParcelFeature] },
  buildings: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        id: 55,
        geometry: null,
        properties: { ll_uuid: "building-uuid-should-never-be-a-parcel" },
      },
    ],
  },
  zoning: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        id: 77,
        geometry: null,
        properties: { ll_uuid: "zoning-uuid-should-never-be-a-parcel" },
      },
    ],
  },
};

/** Legacy shape the original client was written against, still supported. */
const legacyCollection = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {
        ll_uuid: "11111111-1111-1111-1111-111111111111",
        parcelnumb: "123-456",
        state_abbr: "TX",
        county: "Travis",
        city: "Austin",
        ll_address: "100 Congress Ave",
        ll_gisacre: 1.25,
        ll_updated_at: "2026-01-15T00:00:00Z",
      },
      geometry: null,
    },
  ],
};

describe("extractParcelFeatures", () => {
  it("reads the parcels group from the live grouped response", () => {
    const features = extractParcelFeatures(liveGroupedResponse);
    assert.equal(features.length, 1);
    assert.equal(features[0]?.id, 933228);
  });

  it("never promotes buildings or zoning into parcel candidates", () => {
    const parcelsMissing = {
      buildings: liveGroupedResponse.buildings,
      zoning: liveGroupedResponse.zoning,
    };
    assert.deepEqual(extractParcelFeatures(parcelsMissing), []);

    // `parcels` present but empty is an authoritative "no parcels", even though
    // the other groups have records.
    const emptyParcels = {
      ...liveGroupedResponse,
      parcels: { type: "FeatureCollection", features: [] },
    };
    assert.deepEqual(extractParcelFeatures(emptyParcels), []);
  });

  it("still reads a legacy bare FeatureCollection", () => {
    assert.equal(extractParcelFeatures(legacyCollection).length, 1);
  });

  it("accepts a parcels group given as a bare array", () => {
    assert.equal(extractParcelFeatures({ parcels: [liveParcelFeature] }).length, 1);
  });

  it("returns empty for missing, null, malformed, and non-object payloads", () => {
    for (const payload of [
      null,
      undefined,
      {},
      [],
      "not json",
      42,
      { parcels: null },
      { parcels: {} },
      { parcels: { features: null } },
      { features: "nope" },
    ]) {
      assert.deepEqual(extractParcelFeatures(payload), [], JSON.stringify(payload) ?? "undefined");
    }
  });

  it("drops malformed entries inside an otherwise valid features array", () => {
    const features = extractParcelFeatures({
      parcels: { features: [null, "junk", 7, liveParcelFeature, []] },
    });
    assert.equal(features.length, 1);
    assert.equal(features[0]?.id, 933228);
  });
});

describe("normalizeRegridFeature — live v2 nested fields", () => {
  const candidate = normalizeRegridFeature(liveParcelFeature);

  it("resolves the provider parcel id", () => {
    assert.equal(candidate?.providerParcelId, "a6c56bd2-5128-46a2-87ef-6a67a36cf8cb");
    assert.equal(candidate?.provider, "regrid");
  });

  it("maps the APN from the nested fields", () => {
    assert.equal(candidate?.apn, "99240118800000000");
    assert.equal(candidate?.normalizedApn, "99240118800000000");
  });

  it("maps address, city, county, state, and postal code", () => {
    assert.equal(candidate?.situsAddress, "1600 PENNSYLVANIA AVE");
    // Not the "northeast-dallas" URL slug.
    assert.equal(candidate?.city, "DALLAS");
    assert.equal(candidate?.county, "dallas");
    assert.equal(candidate?.stateRegion, "TX");
    assert.equal(candidate?.postalCode, "75215-3239");
  });

  it("maps acreage and coordinates, parsing the string lat/lon", () => {
    assert.equal(candidate?.acreage, 4.4943);
    assert.equal(candidate?.latitude, 32.759308);
    assert.equal(candidate?.longitude, -96.775323);
  });

  it("preserves geometry and provenance", () => {
    assert.equal(candidate?.geometryGeoJson?.type, "Polygon");
    assert.equal(candidate?.geometryQuality, "high");
    assert.equal(candidate?.geometrySource, "regrid");
    assert.equal(candidate?.sourceUpdatedAt, "2026-07-25 13:22:27 -0400");
    assert.equal(candidate?.rawFeature, liveParcelFeature);
  });
});

describe("normalizeRegridFeature — legacy flat properties", () => {
  const candidate = normalizeRegridFeature(legacyCollection.features[0]);

  it("still maps the pre-`fields` shape", () => {
    assert.equal(candidate?.providerParcelId, "11111111-1111-1111-1111-111111111111");
    assert.equal(candidate?.apn, "123-456");
    assert.equal(candidate?.normalizedApn, "123456");
    assert.equal(candidate?.situsAddress, "100 Congress Ave");
    assert.equal(candidate?.stateRegion, "TX");
    assert.equal(candidate?.city, "Austin");
    assert.equal(candidate?.acreage, 1.25);
  });

  it("reports unknown geometry quality when geometry is absent", () => {
    assert.equal(candidate?.geometryGeoJson, null);
    assert.equal(candidate?.geometryQuality, "unknown");
  });

  it("leaves absent coordinates null rather than inventing them", () => {
    assert.equal(candidate?.latitude, null);
    assert.equal(candidate?.longitude, null);
  });
});

describe("normalizeRegridFeature — malformed input", () => {
  it("returns null rather than fabricating a candidate", () => {
    for (const bad of [null, undefined, {}, { properties: null }, { properties: {} }, "x", 5]) {
      assert.equal(
        normalizeRegridFeature(bad as never),
        null,
        `expected null for ${JSON.stringify(bad)}`,
      );
    }
  });

  it("falls back to the numeric feature id when no uuid is present", () => {
    const candidate = normalizeRegridFeature({
      id: 4321,
      properties: { fields: { parcelnumb: "9" } },
    });
    assert.equal(candidate?.providerParcelId, "4321");
    assert.equal(candidate?.apn, "9");
  });
});

describe("normalizeRegridSearchResponse", () => {
  it("returns candidates from the live grouped response", () => {
    const candidates = normalizeRegridSearchResponse(liveGroupedResponse);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.apn, "99240118800000000");
  });

  it("returns candidates from the legacy collection", () => {
    assert.equal(normalizeRegridSearchResponse(legacyCollection).length, 1);
  });

  it("returns an empty list for a genuinely empty provider response", () => {
    const empty = {
      parcels: { type: "FeatureCollection", features: [] },
      buildings: { type: "FeatureCollection", features: [] },
      zoning: { type: "FeatureCollection", features: [] },
    };
    assert.deepEqual(normalizeRegridSearchResponse(empty), []);
  });

  it("normalizes every parcel when several are returned", () => {
    const second = {
      ...liveParcelFeature,
      id: 933229,
      properties: {
        ...liveParcelFeature.properties,
        ll_uuid: "bbbbbbbb-0000-0000-0000-000000000000",
        fields: { ...liveParcelFeature.properties.fields, parcelnumb: "00000000000000001" },
      },
    };
    const candidates = normalizeRegridSearchResponse({
      parcels: { features: [liveParcelFeature, second] },
    });
    assert.equal(candidates.length, 2);
    assert.deepEqual(
      candidates.map((candidate) => candidate.apn),
      ["99240118800000000", "00000000000000001"],
    );
  });

  it("skips candidates with no stable provider id instead of dropping the batch", () => {
    const candidates = normalizeRegridSearchResponse({
      parcels: {
        features: [{ properties: { fields: { parcelnumb: "no-id" } } }, liveParcelFeature],
      },
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.providerParcelId, "a6c56bd2-5128-46a2-87ef-6a67a36cf8cb");
  });
});
