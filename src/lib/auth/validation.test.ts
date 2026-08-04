import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validateOrganizationName,
  validatePasswordConfirmation,
  validateSubmittedPassword,
  validateTermsAccepted,
} from "@/lib/auth/validation";

describe("email validation", () => {
  it("normalizes to trimmed lowercase", () => {
    const result = validateEmail("  Founder@Formetrix.AI  ");
    assert.deepEqual(result, { ok: true, value: "founder@formetrix.ai" });
  });

  it("accepts addresses with subdomains and plus tags", () => {
    assert.equal(validateEmail("jordan+deals@sub.example.co.uk").ok, true);
  });

  it("rejects missing, malformed, and overlong addresses", () => {
    for (const bad of ["", "   ", "founder", "founder@", "@formetrix.ai", "a b@c.com", "no@tld"]) {
      assert.equal(validateEmail(bad).ok, false, bad);
    }
    assert.equal(validateEmail(`${"a".repeat(250)}@example.com`).ok, false);
  });
});

describe("new password validation", () => {
  it("accepts a passphrase meeting length and composition rules", () => {
    assert.deepEqual(validateNewPassword("parcel-zoning-2026"), {
      ok: true,
      value: "parcel-zoning-2026",
    });
  });

  it("rejects passwords below the minimum length", () => {
    const result = validateNewPassword("short1a");
    assert.equal(result.ok, false);
    assert.ok(result.ok === false && result.message.includes(String(PASSWORD_MIN_LENGTH)));
  });

  it("rejects passwords past the bcrypt truncation boundary", () => {
    const result = validateNewPassword(`${"a1".repeat(PASSWORD_MAX_LENGTH)}`);
    assert.equal(result.ok, false);
  });

  it("requires both a letter and a number", () => {
    assert.equal(validateNewPassword("allletterspassword").ok, false);
    assert.equal(validateNewPassword("1234567890123456").ok, false);
  });
});

describe("submitted password validation", () => {
  it("checks presence only, so an older password can still sign in", () => {
    assert.equal(validateSubmittedPassword("short").ok, true);
    assert.equal(validateSubmittedPassword("").ok, false);
  });
});

describe("password confirmation", () => {
  it("requires an exact match", () => {
    assert.equal(validatePasswordConfirmation("parcel-zoning-2026", "parcel-zoning-2026").ok, true);
    assert.equal(
      validatePasswordConfirmation("parcel-zoning-2026", "parcel-zoning-2027").ok,
      false,
    );
    assert.equal(validatePasswordConfirmation("parcel-zoning-2026", "").ok, false);
  });
});

describe("name validation", () => {
  it("collapses internal whitespace and trims", () => {
    assert.deepEqual(validateFullName("  Jordan   Ellis "), { ok: true, value: "Jordan Ellis" });
  });

  it("rejects empty and overlong names", () => {
    assert.equal(validateFullName("   ").ok, false);
    assert.equal(validateFullName("a".repeat(121)).ok, false);
  });

  it("applies the organization name bounds", () => {
    assert.equal(validateOrganizationName("E").ok, false);
    assert.equal(validateOrganizationName("Ellis Development Partners").ok, true);
    assert.equal(validateOrganizationName("a".repeat(81)).ok, false);
  });
});

describe("terms acceptance", () => {
  it("treats an absent checkbox as not accepted", () => {
    assert.equal(validateTermsAccepted(null).ok, false);
    assert.equal(validateTermsAccepted("").ok, false);
    assert.equal(validateTermsAccepted("accepted").ok, true);
  });
});
