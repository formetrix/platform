import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  boundsFromParcelGeometry,
  geometryPrecisionCaption,
  markerFromPropertyOrCentroid,
  parseParcelGeoJson,
  parsePointGeoJson,
} from "@/lib/mapbox/geojson";

const samplePolygon = {
  type: "Polygon" as const,
  coordinates: [
    [
      [-122.42, 37.78],
      [-122.4, 37.78],
      [-122.4, 37.8],
      [-122.42, 37.8],
      [-122.42, 37.78],
    ],
  ],
};

describe("mapbox geojson helpers", () => {
  it("parses Polygon objects and JSON strings", () => {
    assert.equal(parseParcelGeoJson(samplePolygon)?.type, "Polygon");
    assert.equal(parseParcelGeoJson(JSON.stringify(samplePolygon))?.type, "Polygon");
  });

  it("rejects EWKB-like hex and invalid payloads", () => {
    assert.equal(parseParcelGeoJson("0103000020E6100000"), null);
    assert.equal(parseParcelGeoJson(null), null);
    assert.equal(parseParcelGeoJson({ type: "Point", coordinates: [1, 2] }), null);
  });

  it("computes bounds from polygon rings", () => {
    const bounds = boundsFromParcelGeometry(samplePolygon);
    assert.deepEqual(bounds, [-122.42, 37.78, -122.4, 37.8]);
  });

  it("parses centroid points and prefers property lat/lng for markers", () => {
    assert.deepEqual(
      parsePointGeoJson({ type: "Point", coordinates: [-122.41, 37.79] }),
      [-122.41, 37.79],
    );
    assert.deepEqual(
      markerFromPropertyOrCentroid({
        latitude: 37.75,
        longitude: -122.45,
        centroid: { type: "Point", coordinates: [-122.41, 37.79] },
      }),
      [-122.45, 37.75],
    );
    assert.deepEqual(
      markerFromPropertyOrCentroid({
        latitude: null,
        longitude: null,
        centroid: { type: "Point", coordinates: [-122.41, 37.79] },
      }),
      [-122.41, 37.79],
    );
  });

  it("does not oversell geometry precision", () => {
    assert.match(geometryPrecisionCaption("high"), /not a survey/i);
    assert.match(geometryPrecisionCaption("low"), /Low confidence/);
    assert.match(geometryPrecisionCaption(null), /Not a certified survey/);
  });
});
