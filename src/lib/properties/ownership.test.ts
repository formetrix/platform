import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertPropertyOrganizationAccess,
  propertyBelongsToOrganization,
} from "@/lib/properties/ownership";

describe("organization ownership checks", () => {
  it("requires matching organization ids", () => {
    assert.equal(propertyBelongsToOrganization("org-a", "org-a"), true);
    assert.equal(propertyBelongsToOrganization("org-a", "org-b"), false);
  });

  it("rejects access without active membership even if ids match", () => {
    assert.equal(
      assertPropertyOrganizationAccess({
        propertyOrganizationId: "org-a",
        activeOrganizationId: "org-a",
        isActiveMember: false,
      }),
      false,
    );
    assert.equal(
      assertPropertyOrganizationAccess({
        propertyOrganizationId: "org-a",
        activeOrganizationId: "org-a",
        isActiveMember: true,
      }),
      true,
    );
  });
});
