import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeOrganizationSlug,
  suggestOrganizationSlug,
  validateOrganizationSlug,
} from "@/lib/organizations/slug";

describe("organization slug validation", () => {
  it("accepts valid slugs", () => {
    assert.deepEqual(validateOrganizationSlug("acme-dev"), {
      ok: true,
      slug: "acme-dev",
    });
    assert.deepEqual(validateOrganizationSlug("  Acme Dev  "), {
      ok: true,
      slug: "acme-dev",
    });
  });

  it("rejects invalid slugs", () => {
    assert.equal(validateOrganizationSlug("a").ok, false);
    assert.equal(validateOrganizationSlug("").ok, false);
    assert.equal(validateOrganizationSlug("---").ok, false);
    assert.equal(validateOrganizationSlug("x".repeat(49)).ok, false);
  });

  it("normalizes and suggests from names", () => {
    assert.equal(normalizeOrganizationSlug("Hello World!"), "hello-world");
    assert.equal(suggestOrganizationSlug("Formetrix LLC"), "formetrix-llc");
  });
});
