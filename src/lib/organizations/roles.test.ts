import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canAssignRole,
  canManageMemberships,
  canWriteOrganizationData,
  isMembershipUsable,
  isReadOnlyRole,
  isSelfRoleChangeAttempt,
  roleSatisfies,
} from "@/lib/organizations/roles";

describe("organization role hierarchy", () => {
  it("orders owner > admin > member > viewer", () => {
    assert.equal(roleSatisfies("owner", "viewer"), true);
    assert.equal(roleSatisfies("admin", "member"), true);
    assert.equal(roleSatisfies("member", "admin"), false);
    assert.equal(roleSatisfies("viewer", "member"), false);
  });

  it("treats viewers as read-only writers as writable", () => {
    assert.equal(isReadOnlyRole("viewer"), true);
    assert.equal(canWriteOrganizationData("viewer"), false);
    assert.equal(canWriteOrganizationData("member"), true);
    assert.equal(canManageMemberships("admin"), true);
    assert.equal(canManageMemberships("member"), false);
  });

  it("prevents non-owners from assigning owner and blocks upward grants", () => {
    assert.equal(canAssignRole("admin", "owner"), false);
    assert.equal(canAssignRole("owner", "owner"), true);
    assert.equal(canAssignRole("admin", "member"), true);
    assert.equal(canAssignRole("member", "viewer"), false);
  });

  it("detects self role-change attempts (self-elevation path)", () => {
    assert.equal(
      isSelfRoleChangeAttempt({
        actorUserId: "u1",
        membershipUserId: "u1",
        previousRole: "member",
        nextRole: "admin",
      }),
      true,
    );
    assert.equal(
      isSelfRoleChangeAttempt({
        actorUserId: "u1",
        membershipUserId: "u2",
        previousRole: "member",
        nextRole: "admin",
      }),
      false,
    );
  });

  it("only active memberships are usable for access", () => {
    assert.equal(isMembershipUsable("active"), true);
    assert.equal(isMembershipUsable("invited"), false);
    assert.equal(isMembershipUsable("suspended"), false);
    assert.equal(isMembershipUsable("removed"), false);
  });
});
