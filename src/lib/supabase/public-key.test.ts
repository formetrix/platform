import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  missingSupabasePublicKeyMessage,
  resolveSupabasePublicKey,
  SUPABASE_ANON_KEY_ENV,
  SUPABASE_PUBLISHABLE_KEY_ENV,
} from "@/lib/supabase/public-key";
import {
  getPublicSupabaseEnvNames,
  getSupabaseConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const KEY_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  SUPABASE_PUBLISHABLE_KEY_ENV,
  SUPABASE_ANON_KEY_ENV,
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const saved: Partial<Record<(typeof KEY_VARS)[number], string | undefined>> = {};

function snapshotEnv() {
  for (const name of KEY_VARS) {
    saved[name] = process.env[name];
  }
}

function restoreEnv() {
  for (const name of KEY_VARS) {
    const value = saved[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

function clearSupabaseEnv() {
  for (const name of KEY_VARS) {
    delete process.env[name];
  }
}

describe("resolveSupabasePublicKey", () => {
  beforeEach(() => {
    snapshotEnv();
    clearSupabaseEnv();
  });
  afterEach(() => {
    restoreEnv();
  });

  it("prefers publishable over anon when both are set", () => {
    process.env[SUPABASE_PUBLISHABLE_KEY_ENV] = "pk_publishable";
    process.env[SUPABASE_ANON_KEY_ENV] = "pk_anon";
    const resolved = resolveSupabasePublicKey();
    assert.deepEqual(resolved, {
      key: "pk_publishable",
      source: "publishable",
      envName: SUPABASE_PUBLISHABLE_KEY_ENV,
    });
  });

  it("falls back to anon when publishable is unset", () => {
    process.env[SUPABASE_ANON_KEY_ENV] = "pk_anon_only";
    const resolved = resolveSupabasePublicKey();
    assert.equal(resolved?.source, "anon");
    assert.equal(resolved?.key, "pk_anon_only");
  });

  it("treats blank strings as missing", () => {
    process.env[SUPABASE_PUBLISHABLE_KEY_ENV] = "   ";
    process.env[SUPABASE_ANON_KEY_ENV] = "";
    assert.equal(resolveSupabasePublicKey(), undefined);
  });
});

describe("getSupabaseConfig / isSupabaseConfigured", () => {
  beforeEach(() => {
    snapshotEnv();
    clearSupabaseEnv();
  });
  afterEach(() => {
    restoreEnv();
  });

  it("is configured with url + publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env[SUPABASE_PUBLISHABLE_KEY_ENV] = "pk_test";
    assert.equal(isSupabaseConfigured(), true);
    const config = getSupabaseConfig();
    assert.equal(config.url, "https://example.supabase.co");
    assert.equal(config.anonKey, "pk_test");
    assert.equal(config.publicKeySource, "publishable");
  });

  it("is configured with url + legacy anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env[SUPABASE_ANON_KEY_ENV] = "anon_test";
    assert.equal(isSupabaseConfigured(), true);
    assert.equal(getSupabaseConfig().publicKeySource, "anon");
  });

  it("throws aggregated missing names without leaking service role", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-service-role";
    assert.equal(isSupabaseConfigured(), false);
    assert.throws(
      () => getSupabaseConfig(),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes("NEXT_PUBLIC_SUPABASE_URL"));
        assert.ok(error.message.includes(missingSupabasePublicKeyMessage()));
        assert.ok(!error.message.includes("super-secret-service-role"));
        assert.ok(!error.message.includes("SUPABASE_SERVICE_ROLE_KEY"));
        return true;
      },
    );
  });

  it("public env name list never includes service role", () => {
    const names = getPublicSupabaseEnvNames();
    assert.ok(names.includes("NEXT_PUBLIC_SUPABASE_URL"));
    assert.ok(names.includes(SUPABASE_PUBLISHABLE_KEY_ENV));
    assert.ok(!names.some((n) => n.includes("SERVICE_ROLE")));
  });
});
