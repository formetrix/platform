import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSameParcelIdentity,
  normalizeParcelIdentity,
  parcelIdentityKey,
} from "@/lib/properties/parcel-identity";

describe("parcel identity uniqueness", () => {
  it("normalizes provider keys", () => {
    assert.deepEqual(normalizeParcelIdentity({ provider: " Regrid ", providerParcelId: " abc " }), {
      provider: "regrid",
      providerParcelId: "abc",
    });
  });

  it("treats identity as provider + provider parcel id", () => {
    const a = { provider: "regrid", providerParcelId: "1" };
    const b = { provider: "regrid", providerParcelId: "1" };
    const c = { provider: "other", providerParcelId: "1" };
    assert.equal(isSameParcelIdentity(a, b), true);
    assert.equal(isSameParcelIdentity(a, c), false);
    assert.equal(parcelIdentityKey(a), "regrid::1");
  });
});
