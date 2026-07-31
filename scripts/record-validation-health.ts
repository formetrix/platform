/**
 * Validation-health recorder (FM-0028)
 * ====================================
 * Runs the real validation commands and records their pass/fail into
 * management/data/project-status.json's `health` block. This is the ONLY
 * writer of the command-derived health signals (lint, typecheck, formatting,
 * build) — the intelligence script owns dataIntegrity/deployment/supabase and
 * preserves whatever this script records.
 *
 * It records evidence, never invents it: a command that is not run stays at
 * its previous value; a command that fails is recorded as "failing".
 *
 * Usage: npm run dashboard:health
 */

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { format, resolveConfig } from "prettier";

import type { HealthState, ProjectHealth, ProjectStatus } from "@/features/project-dashboard/types";

const STATUS_PATH = path.join(process.cwd(), "management", "data", "project-status.json");

const CHECKS: { key: keyof ProjectHealth; command: string; label: string }[] = [
  { key: "lint", command: "npm run lint", label: "Lint" },
  { key: "typecheck", command: "npm run typecheck", label: "Typecheck" },
  { key: "formatting", command: "npm run format:check", label: "Formatting" },
  { key: "build", command: "npm run build", label: "Build" },
];

function runCheck(command: string): HealthState {
  try {
    execSync(command, { stdio: "inherit" });
    return "passing";
  } catch {
    return "failing";
  }
}

async function main() {
  const results: Partial<Record<keyof ProjectHealth, HealthState>> = {};
  for (const check of CHECKS) {
    console.log(`\n▶ Recording ${check.label} health: ${check.command}`);
    results[check.key] = runCheck(check.command);
  }

  const raw = await readFile(STATUS_PATH, "utf-8");
  const status = JSON.parse(raw) as ProjectStatus;

  const existing: ProjectHealth = status.health ?? {
    dataIntegrity: "unknown",
    lint: "unknown",
    typecheck: "unknown",
    formatting: "unknown",
    build: "unknown",
    gitSync: "unknown",
    deployment: "unknown",
    supabase: "unknown",
  };

  status.health = { ...existing, ...results };

  const config = await resolveConfig(STATUS_PATH);
  const formatted = await format(JSON.stringify(status), {
    ...config,
    filepath: STATUS_PATH,
    parser: "json",
  });

  const changed = formatted !== raw;
  if (changed) await writeFile(STATUS_PATH, formatted, "utf-8");

  console.log("\nRecorded validation health:");
  for (const check of CHECKS) {
    console.log(`  ${check.label.padEnd(11)}: ${results[check.key]}`);
  }
  console.log(changed ? "  (project-status.json updated)" : "  (no change)");

  const anyFailing = Object.values(results).some((state) => state === "failing");
  process.exit(anyFailing ? 1 : 0);
}

main().catch((error) => {
  console.error("Health recording failed:", error);
  process.exit(1);
});
