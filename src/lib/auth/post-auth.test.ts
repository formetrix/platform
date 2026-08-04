import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { choosePostAuthDestination } from "@/lib/auth/post-auth";
import { DEFAULT_AUTHENTICATED_LANDING, ORGANIZATION_SETUP_PATH } from "@/lib/auth/routes";

describe("post-authentication destination", () => {
  it("sends a first-time user with no organization to setup", () => {
    assert.equal(
      choosePostAuthDestination({ organization: "absent", next: "/property/demo" }),
      ORGANIZATION_SETUP_PATH,
    );
  });

  it("honors a safe return path once an organization exists", () => {
    assert.equal(
      choosePostAuthDestination({ organization: "present", next: "/property/demo/zoning" }),
      "/property/demo/zoning",
    );
  });

  it("falls back to the default landing when no return path was given", () => {
    assert.equal(
      choosePostAuthDestination({ organization: "present", next: null }),
      DEFAULT_AUTHENTICATED_LANDING,
    );
  });

  it("never forwards an off-site return path", () => {
    for (const hostile of ["https://evil.example", "//evil.example", "/\\evil"]) {
      assert.equal(
        choosePostAuthDestination({ organization: "present", next: hostile }),
        DEFAULT_AUTHENTICATED_LANDING,
        hostile,
      );
    }
  });

  it("continues to the requested page when the organization lookup failed", () => {
    // "unknown" must not be treated as "absent" — routing a user who already has
    // an organization into setup invites a duplicate one.
    assert.equal(
      choosePostAuthDestination({ organization: "unknown", next: "/properties" }),
      "/properties",
    );
  });
});
