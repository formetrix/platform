import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthConfirmUrl, LOCAL_SITE_URL, resolveSiteBaseUrl } from "@/lib/auth/redirect-urls";

describe("site base URL resolution", () => {
  it("prefers the explicitly configured site URL", () => {
    assert.equal(
      resolveSiteBaseUrl({
        NEXT_PUBLIC_SITE_URL: "https://platform.formetrix.ai",
        VERCEL_URL: "platform-abc123.vercel.app",
      }),
      "https://platform.formetrix.ai",
    );
  });

  it("prefers the production domain over a preview deployment URL", () => {
    assert.equal(
      resolveSiteBaseUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "platform-pi-olive-13.vercel.app",
        VERCEL_URL: "platform-git-branch.vercel.app",
      }),
      "https://platform-pi-olive-13.vercel.app",
    );
  });

  it("adds https to a bare Vercel host and strips a trailing slash", () => {
    assert.equal(
      resolveSiteBaseUrl({ VERCEL_URL: "example.vercel.app/" }),
      "https://example.vercel.app",
    );
  });

  it("keeps an explicit http origin for local development", () => {
    assert.equal(
      resolveSiteBaseUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
      "http://localhost:3000",
    );
  });

  it("falls back to localhost when nothing is configured", () => {
    assert.equal(resolveSiteBaseUrl({}), LOCAL_SITE_URL);
    assert.equal(resolveSiteBaseUrl({ NEXT_PUBLIC_SITE_URL: "   " }), LOCAL_SITE_URL);
  });
});

describe("emailed confirmation URL", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://platform.formetrix.ai" };

  it("is absolute and points at the confirm handler", () => {
    assert.equal(buildAuthConfirmUrl({}, env), "https://platform.formetrix.ai/auth/confirm");
  });

  it("carries the return path for verification links", () => {
    assert.equal(
      buildAuthConfirmUrl({ next: "/property/demo" }, env),
      "https://platform.formetrix.ai/auth/confirm?next=%2Fproperty%2Fdemo",
    );
  });

  it("marks recovery links by type rather than by return path", () => {
    assert.equal(
      buildAuthConfirmUrl({ type: "recovery" }, env),
      "https://platform.formetrix.ai/auth/confirm?type=recovery",
    );
  });
});
