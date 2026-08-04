import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTH_CONFIRM_PATH,
  FORGOT_PASSWORD_PATH,
  isAuthRoute,
  isProtectedRoute,
  ORGANIZATION_SETUP_PATH,
  redirectsAuthenticatedAway,
  RESET_PASSWORD_PATH,
} from "@/lib/auth/routes";
import { isSafeReturnPath } from "@/lib/auth/return-path";

/**
 * Route policy added for the production auth UI (FM-0006A). The pre-existing
 * cases live in routes.test.ts; this file covers the new surfaces.
 */
describe("authentication route policy", () => {
  it("classifies every /auth surface as an auth route", () => {
    for (const path of [FORGOT_PASSWORD_PATH, RESET_PASSWORD_PATH, AUTH_CONFIRM_PATH]) {
      assert.equal(isAuthRoute(path), true, path);
      assert.equal(isProtectedRoute(path), false, path);
    }
  });

  it("bounces signed-in visitors off sign-in, sign-up, and forgot-password", () => {
    assert.equal(redirectsAuthenticatedAway("/auth/sign-in"), true);
    assert.equal(redirectsAuthenticatedAway("/auth/sign-up"), true);
    assert.equal(redirectsAuthenticatedAway(FORGOT_PASSWORD_PATH), true);
  });

  it("leaves recovery and confirm reachable while signed in", () => {
    // A recovery link establishes a session; redirecting authenticated visitors
    // away would make password reset unusable for the people entitled to it.
    assert.equal(redirectsAuthenticatedAway(RESET_PASSWORD_PATH), false);
    assert.equal(redirectsAuthenticatedAway(AUTH_CONFIRM_PATH), false);
  });

  it("protects organization setup", () => {
    assert.equal(isProtectedRoute(ORGANIZATION_SETUP_PATH), true);
    assert.equal(isProtectedRoute("/onboarding"), true);
  });

  it("refuses any /auth path as a post-sign-in return path", () => {
    for (const path of [
      "/auth/sign-in",
      "/auth/sign-up",
      FORGOT_PASSWORD_PATH,
      RESET_PASSWORD_PATH,
      AUTH_CONFIRM_PATH,
      "/auth/confirm?code=abc",
    ]) {
      assert.equal(isSafeReturnPath(path), false, path);
    }
  });

  it("accepts organization setup as a return path", () => {
    assert.equal(isSafeReturnPath(ORGANIZATION_SETUP_PATH), true);
  });
});
