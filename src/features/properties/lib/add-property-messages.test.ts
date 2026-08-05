import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  describeImportOutcome,
  describeSearchOutcome,
  summarizeCandidate,
} from "@/features/properties/lib/add-property-messages";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";

/**
 * Add Property user-facing copy (FM-0031).
 *
 * Two properties matter beyond wording: a failed import must always tell the
 * user nothing was saved, and no message may leak a provider string, HTTP
 * status, or environment-variable name to someone who cannot act on it.
 */

function candidate(overrides: Partial<NormalizedParcelCandidate> = {}): NormalizedParcelCandidate {
  return {
    provider: "regrid",
    providerParcelId: "uuid-1",
    apn: "992401188",
    normalizedApn: "992401188",
    county: "dallas",
    stateRegion: "TX",
    countryCode: "US",
    situsAddress: "1600 PENNSYLVANIA AVE",
    city: "DALLAS",
    postalCode: "75215",
    acreage: 4.4943,
    latitude: 32.759308,
    longitude: -96.775323,
    matchScore: 92,
    geometryGeoJson: null,
    geometrySource: "regrid",
    sourceUpdatedAt: null,
    geometryQuality: "unknown",
    rawFeature: {},
    ...overrides,
  };
}

const SEARCH_FAILURES = [
  "empty_query",
  "invalid_apn",
  "no_results",
  "unconfigured",
  "provider_unconfigured",
  "unauthenticated",
  "organization_missing",
  "rate_limited",
  "provider_unavailable",
  "error",
] as const;

const IMPORT_FAILURES = [
  "invalid_selection",
  "unconfigured",
  "service_role_unconfigured",
  "unauthenticated",
  "organization_missing",
  "insufficient_role",
  "rate_limited",
  "provider_unavailable",
  "error",
] as const;

describe("search failure messages", () => {
  it("gives every failure a distinct, non-empty title and detail", () => {
    const titles = new Set<string>();
    for (const status of SEARCH_FAILURES) {
      const message = describeSearchOutcome({ status } as never, "address");
      assert.ok(message.title.length > 0, status);
      assert.ok(message.detail.length > 0, status);
      titles.add(message.title);
    }
    assert.equal(titles.size, SEARCH_FAILURES.length, "each failure needs its own title");
  });

  it("tailors no-result and empty-query guidance to the search mode", () => {
    // APN mode points at the county's numbering; address mode points at the street.
    assert.match(describeSearchOutcome({ status: "no_results" }, "apn").detail, /county/i);
    assert.match(describeSearchOutcome({ status: "no_results" }, "address").detail, /street/i);
    assert.match(describeSearchOutcome({ status: "empty_query" }, "apn").title, /APN/);
    assert.match(describeSearchOutcome({ status: "empty_query" }, "address").title, /address/i);
  });

  it("turns a retry delay into human wording", () => {
    assert.match(
      describeSearchOutcome({ status: "rate_limited", retryAfterMs: 5000 }, "address").detail,
      /about 5 seconds/,
    );
    assert.match(
      describeSearchOutcome({ status: "rate_limited", retryAfterMs: 120000 }, "address").detail,
      /about 2 minutes/,
    );
    assert.match(
      describeSearchOutcome({ status: "rate_limited" }, "address").detail,
      /wait a moment/i,
    );
  });

  it("marks configuration problems as not worth retrying", () => {
    assert.equal(
      describeSearchOutcome({ status: "provider_unconfigured" }, "address").retryable,
      false,
    );
    assert.equal(describeSearchOutcome({ status: "unauthenticated" }, "address").retryable, false);
    assert.equal(
      describeSearchOutcome({ status: "provider_unavailable" }, "address").retryable,
      true,
    );
  });
});

describe("import failure messages", () => {
  it("gives every failure a distinct, non-empty title and detail", () => {
    const titles = new Set<string>();
    for (const status of IMPORT_FAILURES) {
      const message = describeImportOutcome({ status } as never);
      assert.ok(message.title.length > 0, status);
      assert.ok(message.detail.length > 0, status);
      titles.add(message.title);
    }
    assert.equal(titles.size, IMPORT_FAILURES.length, "each failure needs its own title");
  });

  it("states that nothing was saved whenever a write could have been attempted", () => {
    for (const status of [
      "unconfigured",
      "service_role_unconfigured",
      "unauthenticated",
      "provider_unavailable",
      "error",
    ] as const) {
      assert.match(
        describeImportOutcome({ status } as never).detail,
        /nothing was saved/i,
        `${status} must reassure the user no partial record exists`,
      );
    }
  });

  it("never leaks provider internals or environment variable names", () => {
    for (const status of IMPORT_FAILURES) {
      const message = describeImportOutcome({ status } as never);
      const text = `${message.title} ${message.detail}`;
      assert.ok(!/SUPABASE|REGRID|service_role|RLS|HTTP \d/.test(text), `${status}: ${text}`);
    }
  });
});

describe("candidate summary", () => {
  it("builds the display lines from provider values", () => {
    const summary = summarizeCandidate(candidate());
    assert.equal(summary.primaryLine, "1600 PENNSYLVANIA AVE");
    assert.equal(summary.locationLine, "DALLAS · dallas · TX");
    assert.equal(summary.apnLabel, "992401188");
    assert.match(summary.sizeLabel, /4\.4943 ac/);
    assert.equal(summary.providerLabel, "regrid");
    assert.equal(summary.scoreLabel, "Match 92");
  });

  it("marks missing values instead of inventing them", () => {
    const summary = summarizeCandidate(
      candidate({
        situsAddress: null,
        apn: null,
        acreage: null,
        city: null,
        county: null,
        stateRegion: null,
        matchScore: null,
      }),
    );
    assert.equal(summary.primaryLine, "Address not provided");
    assert.equal(summary.locationLine, "Location not provided");
    assert.equal(summary.apnLabel, "—");
    assert.equal(summary.sizeLabel, "—");
    assert.equal(summary.scoreLabel, null, "no score means no badge, not a zero");
  });

  it("keeps a partial location rather than dropping it", () => {
    assert.equal(summarizeCandidate(candidate({ city: null, county: null })).locationLine, "TX");
  });
});
