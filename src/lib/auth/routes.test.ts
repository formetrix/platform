import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyRoute,
  INTERNAL_DASHBOARD_REQUIRES_AUTH,
  isAuthRoute,
  isProtectedRoute,
  isPublicRoute,
} from "@/lib/auth/routes";

describe("route policy", () => {
  it("treats home as public", () => {
    assert.equal(isPublicRoute("/"), true);
    assert.equal(isProtectedRoute("/"), false);
    assert.equal(classifyRoute("/"), "public");
  });

  it("classifies auth placeholders", () => {
    assert.equal(isAuthRoute("/auth/sign-in"), true);
    assert.equal(isAuthRoute("/auth/sign-up"), true);
    assert.equal(isAuthRoute("/auth/sign-in/extra"), true);
    assert.equal(isProtectedRoute("/auth/sign-in"), false);
    assert.equal(classifyRoute("/auth/sign-in"), "auth");
  });

  it("protects application workspace prefixes", () => {
    for (const path of [
      "/properties",
      "/properties/",
      "/property/demo",
      "/property/demo/zoning",
      "/settings",
      "/settings/account",
      "/organization",
      "/organization/members",
    ]) {
      assert.equal(isProtectedRoute(path), true, path);
      assert.equal(isPublicRoute(path), false, path);
      assert.equal(classifyRoute(path), "protected", path);
    }
  });

  it("keeps Mission Control public under ADR-0031", () => {
    assert.equal(INTERNAL_DASHBOARD_REQUIRES_AUTH, false);
    assert.equal(isPublicRoute("/internal/project-dashboard"), true);
    assert.equal(isProtectedRoute("/internal/project-dashboard"), false);
    assert.equal(classifyRoute("/internal/project-dashboard"), "internal");
  });

  it("does not treat unrelated paths as protected", () => {
    assert.equal(isProtectedRoute("/favicon.ico"), false);
    assert.equal(isProtectedRoute("/about"), false);
  });
});
