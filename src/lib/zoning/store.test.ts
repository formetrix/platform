import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryZoningStore } from "@/lib/zoning/store";

describe("memory zoning store (multi-provider ready)", () => {
  it("upserts a parcel classification without inventing missing dimensional values", async () => {
    const store = createMemoryZoningStore();
    const result = await store.upsertParcelZoning({
      parcelId: "parcel-1",
      provider: "Zoneomics",
      providerRecordId: "z-100",
      municipalityName: "Austin",
      municipalityProviderId: "austin",
      districtCode: "SF-3",
      districtProviderId: "sf-3",
      stateRegion: "TX",
      permittedUses: ["Single-family dwelling"],
      prohibitedUses: ["Heavy manufacturing"],
      maxHeightFt: 35,
      // FAR intentionally omitted — must stay null
    });

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.overview.district.code, "SF-3");
    assert.equal(result.overview.municipality.name, "Austin");
    assert.equal(result.overview.dimensional?.maxHeightFt, 35);
    assert.equal(result.overview.dimensional?.maxFar, null);
    assert.equal(result.overview.permittedUses.length, 1);
    assert.equal(result.overview.prohibitedUses[0]?.useLabel, "Heavy manufacturing");
    assert.equal(result.overview.provenance.provider, "zoneomics");
  });

  it("demotes prior primary when a new primary classification is upserted", async () => {
    const store = createMemoryZoningStore();
    await store.upsertParcelZoning({
      parcelId: "parcel-1",
      provider: "a",
      providerRecordId: "1",
      municipalityName: "City",
      municipalityProviderId: "c",
      districtCode: "A",
      districtProviderId: "a",
      isPrimary: true,
    });
    await store.upsertParcelZoning({
      parcelId: "parcel-1",
      provider: "b",
      providerRecordId: "2",
      municipalityName: "City",
      municipalityProviderId: "c",
      districtCode: "B",
      districtProviderId: "b",
      isPrimary: true,
    });

    const listed = store.listByParcel("parcel-1");
    assert.equal(listed.length, 2);
    assert.equal(listed.filter((z) => z.isPrimary).length, 1);
    assert.equal(listed.find((z) => z.isPrimary)?.district.code, "B");
  });
});
