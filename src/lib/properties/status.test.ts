import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canTransitionPropertyStatus,
  isPropertyStatus,
  validatePropertyStatusTransition,
} from "@/lib/properties/status";

describe("property status transitions", () => {
  it("accepts known V1 statuses", () => {
    assert.equal(isPropertyStatus("discovered"), true);
    assert.equal(isPropertyStatus("planning"), false);
  });

  it("allows the early acquisition path", () => {
    assert.equal(canTransitionPropertyStatus("discovered", "evaluating"), true);
    assert.equal(canTransitionPropertyStatus("evaluating", "under_contract"), true);
    assert.equal(canTransitionPropertyStatus("under_contract", "acquired"), true);
  });

  it("allows archiving from active statuses", () => {
    for (const from of ["discovered", "evaluating", "under_contract", "acquired"] as const) {
      assert.equal(canTransitionPropertyStatus(from, "archived"), true);
    }
  });

  it("rejects skips that jump the lifecycle", () => {
    assert.equal(canTransitionPropertyStatus("discovered", "acquired"), false);
    assert.equal(validatePropertyStatusTransition("discovered", "under_contract").ok, false);
  });
});
