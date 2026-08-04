import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Guards the trusted-ingestion boundary (FM-0030).
 *
 * `upsert_parcel_from_provider` and `upsert_parcel_zoning_from_provider` are
 * SECURITY DEFINER and bypass RLS — they are the only write path into
 * `public.parcels`, which grants `authenticated` no INSERT/UPDATE policy at all.
 * If either becomes executable by `anon` or `authenticated`, any holder of the
 * publishable key can write shared parcel and zoning reference data.
 *
 * That is not hypothetical: both original migrations ended with
 * `revoke all ... from public`, which does not remove Supabase's default grants
 * to the named `anon`/`authenticated` roles, and an audit found both functions
 * anon-executable on the hosted project.
 *
 * The static checks below run everywhere, including offline CI. The live check
 * is opt-in — see LIVE_CHECK_FLAG.
 */

const INGESTION_FUNCTIONS = [
  "upsert_parcel_from_provider",
  "upsert_parcel_zoning_from_provider",
] as const;

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

function migrationSources(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"),
    }));
}

/** Strips `--` line comments so prose about grants cannot satisfy or trip a check. */
function withoutComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

describe("ingestion RPC privileges (FM-0030)", () => {
  it("never grants execute on an ingestion RPC to anon or authenticated", () => {
    for (const { file, sql } of migrationSources()) {
      const statements = withoutComments(sql)
        .split(";")
        .map((statement) => statement.replace(/\s+/g, " ").trim().toLowerCase())
        .filter((statement) => statement.startsWith("grant"));

      for (const statement of statements) {
        const target = INGESTION_FUNCTIONS.find((name) => statement.includes(name));
        if (!target) continue;

        const grantee = statement.slice(statement.lastIndexOf(" to ") + 4);
        assert.ok(
          !/\banon\b/.test(grantee) && !/\bauthenticated\b/.test(grantee),
          `${file} grants execute on ${target} to an untrusted role: "${statement}"`,
        );
        assert.ok(
          /\bservice_role\b/.test(grantee),
          `${file} grants execute on ${target} to something other than service_role: "${statement}"`,
        );
      }
    }
  });

  it("revokes execute from public, anon, and authenticated for every ingestion RPC", () => {
    // The FM-0030 migration revokes inside a DO block that formats the signature
    // at run time, so match on the revoke targets rather than on a fixed
    // signature — a later overload must stay covered without editing this test.
    const allSql = migrationSources()
      .map(({ sql }) => withoutComments(sql))
      .join("\n")
      .toLowerCase();

    for (const role of ["public", "anon", "authenticated"]) {
      assert.match(
        allSql,
        new RegExp(`revoke\\s+all\\s+on\\s+function\\s+%s\\s+from\\s+${role}`),
        `no migration revokes execute from ${role} across every ingestion RPC overload`,
      );
    }

    assert.match(
      allSql,
      /grant\s+execute\s+on\s+function\s+%s\s+to\s+service_role/,
      "no migration re-grants execute to service_role after the revokes",
    );
  });

  it("keeps the ingestion functions server-only in application code", () => {
    // A browser client must never be able to name these functions: the only
    // caller is the service-role parcel store.
    const storeSource = readFileSync(
      path.join(process.cwd(), "src", "lib", "properties", "ingestion", "parcel-store.ts"),
      "utf-8",
    );
    assert.match(storeSource, /createServiceRoleClient\(\)/);
    assert.ok(
      !storeSource.includes("@/lib/supabase/client"),
      "the parcel store must not import the browser Supabase client",
    );
  });
});

/**
 * Opt-in live check against the configured Supabase project. Skipped by default
 * so `npm run test` stays offline and deterministic; run it with:
 *
 *   FORMETRIX_LIVE_RPC_CHECK=1 npm run test
 *
 * with NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key exported.
 */
const LIVE_CHECK_FLAG = process.env.FORMETRIX_LIVE_RPC_CHECK === "1";
const liveUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const liveKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const liveReady = LIVE_CHECK_FLAG && Boolean(liveUrl) && Boolean(liveKey);

describe("ingestion RPC privileges — live project", { skip: !liveReady }, () => {
  const PERMISSION_DENIED = "42501";

  it("denies an anonymous publishable-key caller", async () => {
    const response = await fetch(`${liveUrl}/rest/v1/rpc/upsert_parcel_from_provider`, {
      method: "POST",
      headers: { apikey: liveKey!, "Content-Type": "application/json" },
      // Values that would fail the function's own validation, so a regression
      // that restored access still cannot write a row from this test.
      body: JSON.stringify({ p_provider: "", p_provider_parcel_id: "" }),
    });
    const payload = (await response.json()) as { code?: string; message?: string };

    assert.equal(
      payload.code,
      PERMISSION_DENIED,
      `expected permission denied, got ${response.status} ${JSON.stringify(payload)}`,
    );
  });

  it("denies an anonymous caller on the zoning RPC", async () => {
    const response = await fetch(`${liveUrl}/rest/v1/rpc/upsert_parcel_zoning_from_provider`, {
      method: "POST",
      headers: { apikey: liveKey!, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_parcel_id: "00000000-0000-0000-0000-000000000000",
        p_provider: "regression",
        p_provider_record_id: "regression",
        p_municipality_name: "regression",
        p_municipality_provider_id: "regression",
        p_district_code: "regression",
        p_district_provider_id: "regression",
      }),
    });
    const payload = (await response.json()) as { code?: string; message?: string };

    assert.equal(
      payload.code,
      PERMISSION_DENIED,
      `expected permission denied, got ${response.status} ${JSON.stringify(payload)}`,
    );
  });
});
