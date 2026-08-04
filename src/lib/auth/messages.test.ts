import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  describeConfirmationError,
  describePasswordUpdateError,
  describeSignInError,
  describeSignUpError,
  INVALID_CREDENTIALS_MESSAGE,
} from "@/lib/auth/messages";

describe("sign-in error messages", () => {
  it("gives the same answer for a wrong password and an unknown account", () => {
    const wrongPassword = describeSignInError({ message: "Invalid login credentials" });
    const unknownAccount = describeSignInError({
      message: "Invalid login credentials",
      code: "invalid_credentials",
    });
    assert.equal(wrongPassword, INVALID_CREDENTIALS_MESSAGE);
    assert.equal(unknownAccount, INVALID_CREDENTIALS_MESSAGE);
  });

  it("distinguishes an unconfirmed email, which the user can act on", () => {
    const message = describeSignInError({
      code: "email_not_confirmed",
      message: "Email not confirmed",
    });
    assert.match(message, /confirm your email/i);
  });

  it("surfaces rate limiting instead of looking like a bad password", () => {
    assert.match(describeSignInError({ status: 429, message: "rate limit exceeded" }), /too many/i);
  });

  it("never echoes a raw provider string", () => {
    const leaky = "pg: duplicate key value violates unique constraint users_pkey";
    assert.ok(!describeSignInError({ message: leaky }).includes("users_pkey"));
  });
});

describe("sign-up error messages", () => {
  it("explains a disabled signup policy", () => {
    assert.match(
      describeSignUpError({ message: "Signups not allowed for this instance" }),
      /not being accepted/i,
    );
  });

  it("reports a weak password as actionable guidance", () => {
    assert.match(
      describeSignUpError({
        code: "weak_password",
        message: "Password should be at least 6 characters",
      }),
      /stronger password/i,
    );
  });
});

describe("password update error messages", () => {
  it("treats a dead session as an expired link", () => {
    assert.match(describePasswordUpdateError({ message: "Auth session missing!" }), /expired/i);
  });
});

describe("emailed link failures", () => {
  it("names expiry when the provider reports it", () => {
    assert.match(
      describeConfirmationError("otp_expired", "Email link is invalid or has expired"),
      /expired/i,
    );
  });

  it("has a readable fallback for an unrecognized code", () => {
    const message = describeConfirmationError("something_new", null);
    assert.ok(message.length > 0);
    assert.ok(!message.includes("something_new"));
  });
});
