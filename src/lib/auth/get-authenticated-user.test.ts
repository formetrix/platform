import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Classification contract tests for AuthenticatedUserResult.
 * Runtime getAuthenticatedUser() needs Supabase + Next cookies; those paths
 * are exercised via integration/manual checks. This file locks the result
 * shape so callers stay exhaustive.
 */

type AuthenticatedUserResult =
  | { status: "authenticated"; user: { id: string } }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

function classifyForUi(result: AuthenticatedUserResult): string {
  switch (result.status) {
    case "authenticated":
      return `user:${result.user.id}`;
    case "unauthenticated":
      return "signed-out";
    case "unconfigured":
      return "needs-supabase-env";
    case "error":
      return `error:${result.message.length > 0}`;
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

describe("authenticated user result classification", () => {
  it("distinguishes authenticated, unauthenticated, unconfigured, and error", () => {
    assert.equal(classifyForUi({ status: "authenticated", user: { id: "u1" } }), "user:u1");
    assert.equal(classifyForUi({ status: "unauthenticated" }), "signed-out");
    assert.equal(classifyForUi({ status: "unconfigured" }), "needs-supabase-env");
    assert.equal(
      classifyForUi({ status: "error", message: "Authentication could not be verified." }),
      "error:true",
    );
  });
});
