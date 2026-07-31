import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSignInRedirectUrl,
  isSafeReturnPath,
  sanitizeReturnPath,
} from "@/lib/auth/return-path";
import { DEFAULT_AUTHENTICATED_LANDING } from "@/lib/auth/routes";

describe("return path safety", () => {
  it("accepts same-origin relative paths", () => {
    assert.equal(isSafeReturnPath("/properties"), true);
    assert.equal(isSafeReturnPath("/property/demo?tab=overview"), true);
    assert.equal(sanitizeReturnPath("/settings/account"), "/settings/account");
  });

  it("rejects open redirects and protocol-relative URLs", () => {
    for (const bad of [
      "https://evil.example",
      "http://evil.example/phish",
      "//evil.example",
      "///evil.example",
      "properties",
      "",
      null,
      undefined,
      "/\\evil",
      "javascript:alert(1)",
    ]) {
      assert.equal(isSafeReturnPath(bad as string | null | undefined), false, String(bad));
      assert.equal(
        sanitizeReturnPath(bad as string | null | undefined),
        DEFAULT_AUTHENTICATED_LANDING,
      );
    }
  });

  it("rejects auth routes to avoid redirect loops", () => {
    assert.equal(isSafeReturnPath("/auth/sign-in"), false);
    assert.equal(isSafeReturnPath("/auth/sign-up"), false);
    assert.equal(sanitizeReturnPath("/auth/sign-in"), DEFAULT_AUTHENTICATED_LANDING);
  });

  it("builds a sign-in URL with a sanitized next param", () => {
    assert.equal(buildSignInRedirectUrl("/property/demo"), "/auth/sign-in?next=%2Fproperty%2Fdemo");
    assert.equal(
      buildSignInRedirectUrl("https://evil.example"),
      `/auth/sign-in?next=${encodeURIComponent(DEFAULT_AUTHENTICATED_LANDING)}`,
    );
  });
});
