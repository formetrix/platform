import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  expectedParcelSrid,
  looksLikeParcelGeoJson,
  validateLatLngPair,
} from "@/lib/properties/geometry";

describe("geometry metadata validation", () => {
  it("uses EPSG:4326", () => {
    assert.equal(expectedParcelSrid(), 4326);
  });

  it("validates optional lat/lng pairs", () => {
    assert.equal(validateLatLngPair(null, null).ok, true);
    assert.equal(validateLatLngPair(30, null).ok, false);
    assert.equal(validateLatLngPair(30.1, -97.7).ok, true);
    assert.equal(validateLatLngPair(100, 0).ok, false);
  });

  it("accepts Polygon and MultiPolygon GeoJSON shapes", () => {
    assert.equal(
      looksLikeParcelGeoJson({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-97, 30],
              [-97, 31],
              [-96, 31],
              [-97, 30],
            ],
          ],
        ],
      }),
      true,
    );
    assert.equal(looksLikeParcelGeoJson({ type: "Point", coordinates: [0, 0] }), false);
  });
});
