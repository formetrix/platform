import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { apnsMatch, normalizeApn } from "@/lib/properties/apn";

describe("normalized APN handling", () => {
  it("strips punctuation and uppercases", () => {
    assert.equal(normalizeApn("12-345-678"), "12345678");
    assert.equal(normalizeApn(" ab 99 "), "AB99");
    assert.equal(normalizeApn(""), null);
  });

  it("matches APNs that differ only by formatting", () => {
    assert.equal(apnsMatch("12-345", "12345"), true);
    assert.equal(apnsMatch("12-345", "99"), false);
  });
});
