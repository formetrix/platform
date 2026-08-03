import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertActiveMembershipForOrganization,
  selectActiveOrganizationId,
} from "@/lib/organizations/active-organization";
import type { OrganizationMembership } from "@/lib/organizations/types";

function membership(
  organizationId: string,
  status: OrganizationMembership["status"],
): Pick<OrganizationMembership, "organizationId" | "status"> {
  return { organizationId, status };
}

describe("active organization selection", () => {
  it("prefers a verified preferred organization", () => {
    const id = selectActiveOrganizationId({
      preferredOrganizationId: "org-b",
      memberships: [membership("org-a", "active"), membership("org-b", "active")],
    });
    assert.equal(id, "org-b");
  });

  it("ignores preferred org when membership is not active", () => {
    const id = selectActiveOrganizationId({
      preferredOrganizationId: "org-b",
      memberships: [membership("org-a", "active"), membership("org-b", "suspended")],
    });
    assert.equal(id, "org-a");
  });

  it("returns null when no active membership exists", () => {
    assert.equal(
      selectActiveOrganizationId({
        preferredOrganizationId: "org-a",
        memberships: [membership("org-a", "invited")],
      }),
      null,
    );
  });

  it("rejects unauthorized organization access", () => {
    const memberships = [membership("org-a", "active")];
    assert.equal(assertActiveMembershipForOrganization("org-a", memberships), true);
    assert.equal(assertActiveMembershipForOrganization("org-b", memberships), false);
    assert.equal(
      assertActiveMembershipForOrganization("org-a", [membership("org-a", "removed")]),
      false,
    );
  });
});
