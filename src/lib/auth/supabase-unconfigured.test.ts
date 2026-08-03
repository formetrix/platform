import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSupabaseUnconfiguredError,
  REQUIRED_SUPABASE_AUTH_ENV_VARS,
  SUPABASE_AUTH_ENV_FALLBACK_NOTE,
  SUPABASE_UNCONFIGURED_ERROR,
} from "@/lib/auth/supabase-unconfigured";
import { SUPABASE_ANON_KEY_ENV, SUPABASE_PUBLISHABLE_KEY_ENV } from "@/lib/supabase/public-key";

describe("supabase unconfigured auth state", () => {
  it("recognizes the known query error code", () => {
    assert.equal(isSupabaseUnconfiguredError(SUPABASE_UNCONFIGURED_ERROR), true);
    assert.equal(isSupabaseUnconfiguredError("other"), false);
    assert.equal(isSupabaseUnconfiguredError(undefined), false);
  });

  it("lists preferred Auth env vars without secret values", () => {
    assert.deepEqual(
      [...REQUIRED_SUPABASE_AUTH_ENV_VARS],
      ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_PUBLISHABLE_KEY_ENV],
    );
    assert.ok(SUPABASE_AUTH_ENV_FALLBACK_NOTE.includes(SUPABASE_ANON_KEY_ENV));
    assert.ok(!SUPABASE_AUTH_ENV_FALLBACK_NOTE.includes("eyJ"));
  });
});
