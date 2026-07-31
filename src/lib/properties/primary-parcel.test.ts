import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasAtMostOnePrimary, planAttachParcel } from "@/lib/properties/primary-parcel";

describe("primary parcel rules", () => {
  it("allows at most one primary", () => {
    assert.equal(hasAtMostOnePrimary([{ isPrimary: true }, { isPrimary: false }]), true);
    assert.equal(hasAtMostOnePrimary([{ isPrimary: true }, { isPrimary: true }]), false);
  });

  it("rejects duplicate links and demotes prior primaries when attaching primary", () => {
    const dup = planAttachParcel({
      existing: [{ parcelId: "p1", isPrimary: true }],
      parcelId: "p1",
      isPrimary: false,
    });
    assert.equal(dup.ok, false);

    const next = planAttachParcel({
      existing: [{ parcelId: "p1", isPrimary: true }],
      parcelId: "p2",
      isPrimary: true,
    });
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.nextLinks.filter((l) => l.isPrimary).length, 1);
      assert.equal(next.nextLinks.find((l) => l.parcelId === "p2")?.isPrimary, true);
      assert.equal(next.nextLinks.find((l) => l.parcelId === "p1")?.isPrimary, false);
    }
  });
});
