import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRegridClient } from "@/lib/regrid/client";
import { RegridClientError } from "@/lib/regrid/errors";
import { getRegridConfig, isRegridConfigured } from "@/lib/regrid/config";

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

const sampleFeature = {
  type: "Feature",
  properties: {
    ll_uuid: "11111111-1111-1111-1111-111111111111",
    parcelnumb: "123-456",
    state_abbr: "TX",
    county: "Travis",
    ll_address: "100 Congress Ave",
    ll_gisacre: 1.25,
    ll_updated_at: "2026-01-15T00:00:00Z",
  },
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
};

describe("Regrid config", () => {
  it("reports unconfigured when token is missing", () => {
    const previous = process.env.REGRID_API_TOKEN;
    delete process.env.REGRID_API_TOKEN;
    try {
      assert.equal(isRegridConfigured(), false);
      assert.throws(() => getRegridConfig(), /REGRID_API_TOKEN/);
    } finally {
      if (previous === undefined) delete process.env.REGRID_API_TOKEN;
      else process.env.REGRID_API_TOKEN = previous;
    }
  });
});

describe("RegridClient", () => {
  it("searches by address and normalizes candidates with provenance fields", async () => {
    const client = createRegridClient({
      config: { apiToken: "test-token", baseUrl: "https://app.regrid.com" },
      fetchImpl: async (input) => {
        const url = String(input);
        assert.match(url, /\/api\/v2\/parcels\/address/);
        assert.match(url, /token=test-token/);
        assert.match(url, /query=100\+Congress/);
        return jsonResponse({ type: "FeatureCollection", features: [sampleFeature] });
      },
      sleep: async () => undefined,
    });

    const results = await client.search({ mode: "address", query: "100 Congress" });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.provider, "regrid");
    assert.equal(results[0]?.providerParcelId, "11111111-1111-1111-1111-111111111111");
    assert.equal(results[0]?.apn, "123-456");
    assert.equal(results[0]?.normalizedApn, "123456");
    assert.equal(results[0]?.geometrySource, "regrid");
    assert.equal(results[0]?.sourceUpdatedAt, "2026-01-15T00:00:00Z");
    assert.ok(results[0]?.rawFeature);
  });

  it("rejects invalid APN before calling the network", async () => {
    let called = false;
    const client = createRegridClient({
      config: { apiToken: "test-token", baseUrl: "https://app.regrid.com" },
      fetchImpl: async () => {
        called = true;
        return jsonResponse({ features: [] });
      },
    });

    await assert.rejects(
      () => client.search({ mode: "apn", apn: "---" }),
      (error: unknown) => error instanceof RegridClientError && error.code === "invalid_apn",
    );
    assert.equal(called, false);
  });

  it("retries on rate limit then surfaces rate_limited", async () => {
    let attempts = 0;
    const sleeps: number[] = [];
    const client = createRegridClient({
      config: { apiToken: "test-token", baseUrl: "https://app.regrid.com" },
      maxAttempts: 3,
      baseDelayMs: 10,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      fetchImpl: async () => {
        attempts += 1;
        return jsonResponse(
          { error: "slow down" },
          { status: 429, headers: { "retry-after": "1" } },
        );
      },
    });

    await assert.rejects(
      () => client.search({ mode: "address", query: "x" }),
      (error: unknown) =>
        error instanceof RegridClientError &&
        error.code === "rate_limited" &&
        error.retryAfterMs === 1000,
    );
    assert.equal(attempts, 3);
    assert.equal(sleeps.length, 2);
    assert.ok(sleeps.every((ms) => ms === 1000));
  });

  it("surfaces API failures without inventing success", async () => {
    const client = createRegridClient({
      config: { apiToken: "test-token", baseUrl: "https://app.regrid.com" },
      maxAttempts: 1,
      fetchImpl: async () => jsonResponse({ error: "boom" }, { status: 500 }),
    });

    await assert.rejects(
      () => client.search({ mode: "coordinates", latitude: 30.27, longitude: -97.74 }),
      (error: unknown) => error instanceof RegridClientError && error.code === "api_error",
    );
  });
});
