/**
 * Dashboard Intelligence (FM-0028)
 * ================================
 * Deterministic, local recomputation of the Mission Control snapshot from
 * repository-controlled data. It reads management/data/*.json, recomputes
 * every *calculated* field (progress, counts, current work, integrity,
 * data-integrity health), and writes the results back — leaving every
 * hand-authored *narrative* field untouched.
 *
 * Two modes:
 *   - default            : write calculated fields (npm run dashboard:update)
 *   - --check / --dry-run: validate only, never write; exit non-zero on any
 *                          hard error or if the on-disk calculated fields are
 *                          stale (drift). (npm run dashboard:check)
 *
 * Determinism: output JSON is formatted with the repo's Prettier config, keys
 * are emitted in a fixed order, and files are only rewritten when their bytes
 * actually change. Timestamps (generatedAt / lastIntelligenceUpdate) are bumped
 * only when some *other* calculated field changed — so running update twice
 * with no source change produces no file changes at all.
 *
 * Reuses the exact same logic the dashboard renders with
 * (src/features/project-dashboard/lib), so the script and the UI can never
 * disagree about a number.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { format, resolveConfig } from "prettier";

import {
  computeMilestoneProgress,
  computeOverallProgress,
  computeTicketProgress,
} from "@/features/project-dashboard/lib/compute-dashboard-metrics";
import { isActiveStatus } from "@/features/project-dashboard/lib/current-work";
import { validateDashboardData } from "@/features/project-dashboard/lib/validate-dashboard-data";
import type {
  ActivityEntry,
  DashboardData,
  Decision,
  HealthState,
  IntegrityWarning,
  Milestone,
  ProjectHealth,
  ProjectStatus,
  Release,
  Ticket,
  TicketCounts,
} from "@/features/project-dashboard/types";

const DATA_DIR = path.join(process.cwd(), "management", "data");
const MANAGEMENT_DIR = path.join(process.cwd(), "management");
const RECENT_ACTIVITY_LIMIT = 5;

const isCheck = process.argv.includes("--check") || process.argv.includes("--dry-run");

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

async function formatJson(filePath: string, value: unknown): Promise<string> {
  const config = await resolveConfig(filePath);
  return format(JSON.stringify(value), { ...config, filepath: filePath, parser: "json" });
}

/** Writes only when the formatted content actually differs. Returns whether it changed. */
async function writeIfChanged(filePath: string, formatted: string): Promise<boolean> {
  let current: string | null = null;
  try {
    current = await readFile(filePath, "utf-8");
  } catch {
    current = null;
  }
  if (current === formatted) return false;
  if (!isCheck) await writeFile(filePath, formatted, "utf-8");
  return true;
}

// ---------------------------------------------------------------------------
// Current-ticket selection (FM-0028 §2): explicit status is the authority.
// ---------------------------------------------------------------------------
function deriveCurrentTicket(
  tickets: Ticket[],
  existingCurrentId: string | null,
): { currentTicketId: string | null; warnings: IntegrityWarning[] } {
  const active = tickets.filter((t) => isActiveStatus(t.status));
  const warnings: IntegrityWarning[] = [];

  if (active.length === 0) return { currentTicketId: null, warnings };
  if (active.length === 1) return { currentTicketId: active[0].id, warnings };

  // Multiple active: preserve an explicitly selected, still-valid primary.
  if (existingCurrentId && active.some((t) => t.id === existingCurrentId)) {
    return { currentTicketId: existingCurrentId, warnings };
  }
  warnings.push({
    severity: "warning",
    message: `${active.length} tickets are active (${active
      .map((t) => t.id)
      .join(
        ", ",
      )}) but no valid primary currentTicketId is selected — choosing none rather than guessing. Set a primary and re-run.`,
  });
  return { currentTicketId: null, warnings };
}

function deriveCurrentMilestone(
  currentTicketId: string | null,
  tickets: Ticket[],
  milestones: Milestone[],
): string {
  if (currentTicketId) {
    const ticket = tickets.find((t) => t.id === currentTicketId);
    if (ticket) return ticket.milestoneId;
  }
  const firstIncomplete = milestones.find((m) => m.status !== "complete");
  return (firstIncomplete ?? milestones[0])?.id ?? "";
}

function countTickets(tickets: Ticket[]): TicketCounts {
  const counts: TicketCounts = {
    backlog: 0,
    planned: 0,
    inProgress: 0,
    review: 0,
    blocked: 0,
    completed: 0,
    total: tickets.length,
  };
  for (const ticket of tickets) {
    // Cast to string: "ready"/"review" are reserved statuses the model accepts
    // but the TicketStatus union does not yet enumerate (docs/DESIGN_SYSTEM.md §15).
    switch (ticket.status as string) {
      case "backlog":
        counts.backlog += 1;
        break;
      case "planned":
      case "ready":
        // "ready" is grouped with planned (no ticket uses it; see MISSION_CONTROL.md).
        counts.planned += 1;
        break;
      case "in_progress":
        counts.inProgress += 1;
        break;
      case "review":
        counts.review = (counts.review ?? 0) + 1;
        break;
      case "blocked":
        counts.blocked += 1;
        break;
      case "completed":
        counts.completed += 1;
        break;
    }
  }
  return counts;
}

function computeHealth(
  existing: ProjectHealth | undefined,
  tickets: Ticket[],
  issues: IntegrityWarning[],
): ProjectHealth {
  const hasError = issues.some((i) => i.severity === "error");
  const hasWarning = issues.some((i) => i.severity === "warning");
  const dataIntegrity: HealthState = hasError ? "failing" : hasWarning ? "warning" : "passing";

  const statusOf = (id: string) => tickets.find((t) => t.id === id)?.status;
  // Not-yet-provisioned → not_configured. Once FM-0005 is completed, preserve an
  // independently-verified health value already recorded on disk (e.g. "passing"
  // from a real connection check) rather than discarding it; fall back to "unknown"
  // when the connection was never verified. Never fabricates "passing".
  const supabaseCompleted: HealthState =
    existing?.supabase && existing.supabase !== "not_configured" ? existing.supabase : "unknown";
  const supabase: HealthState =
    statusOf("FM-0005") === "completed" ? supabaseCompleted : "not_configured";
  // Same pattern as supabase: once FM-0006 completes, preserve a verified
  // deployment health already recorded on disk; never fabricate "passing".
  const deploymentCompleted: HealthState =
    existing?.deployment && existing.deployment !== "not_configured"
      ? existing.deployment
      : "unknown";
  const deployment: HealthState =
    statusOf("FM-0006") === "completed" ? deploymentCompleted : "not_configured";

  return {
    dataIntegrity,
    lint: existing?.lint ?? "unknown",
    typecheck: existing?.typecheck ?? "unknown",
    formatting: existing?.formatting ?? "unknown",
    build: existing?.build ?? "unknown",
    // git sync is not queried live here; a git-aware recorder can set it later.
    gitSync: existing?.gitSync ?? "unknown",
    deployment,
    supabase,
  };
}

/** Markdown/JSON record-count comparison, only where a reliable one exists. */
async function recordCountIssues(
  tickets: Ticket[],
  milestones: Milestone[],
): Promise<IntegrityWarning[]> {
  const warnings: IntegrityWarning[] = [];
  const compare = async (file: string, regex: RegExp, jsonCount: number, label: string) => {
    let text: string;
    try {
      text = await readFile(path.join(MANAGEMENT_DIR, file), "utf-8");
    } catch {
      return; // No reliable comparison if the file is absent.
    }
    const mdCount = (text.match(regex) ?? []).length;
    if (mdCount !== jsonCount) {
      warnings.push({
        severity: "warning",
        message: `${label}: ${file} lists ${mdCount} but JSON has ${jsonCount}.`,
      });
    }
  };
  await compare("TICKETS.md", /^### FM-\d/gm, tickets.length, "Ticket count mismatch");
  await compare(
    "MILESTONES.md",
    /^## Milestone \d/gm,
    milestones.length,
    "Milestone count mismatch",
  );
  return warnings;
}

interface MilestoneSummaryEntry {
  id: string;
  name: string;
  status: Milestone["status"];
  progressPercent: number;
}

/** Builds project-status.json with keys in a fixed order for stable output. */
function buildProjectStatus(params: {
  previous: ProjectStatus;
  generatedAt: string;
  lastIntelligenceUpdate: string;
  currentMilestoneId: string;
  currentTicketId: string | null;
  overallProgressPercent: number;
  activeTicketCount: number;
  milestonesSummary: MilestoneSummaryEntry[];
  ticketCounts: TicketCounts;
  blockedTicketIds: string[];
  health: ProjectHealth;
  integrityWarnings: IntegrityWarning[];
  recentActivityIds: string[];
}): ProjectStatus {
  const p = params;
  return {
    generatedAt: p.generatedAt,
    lastIntelligenceUpdate: p.lastIntelligenceUpdate,
    currentMilestoneId: p.currentMilestoneId,
    currentTicketId: p.currentTicketId,
    currentWorkstream: p.previous.currentWorkstream ?? null,
    currentFocusSummary: p.previous.currentFocusSummary ?? null,
    currentNextAction: p.previous.currentNextAction ?? null,
    overallProgressPercent: p.overallProgressPercent,
    activeTicketCount: p.activeTicketCount,
    milestonesSummary: p.milestonesSummary,
    ticketCounts: p.ticketCounts,
    blockedTicketIds: p.blockedTicketIds,
    repositoryState: p.previous.repositoryState,
    health: p.health,
    dataIntegrityWarningCount: p.integrityWarnings.length,
    integrityWarnings: p.integrityWarnings,
    recentActivityIds: p.recentActivityIds,
  };
}

async function main() {
  const [projectStatus, milestonesRaw, ticketsRaw, decisions, activity, releases] =
    await Promise.all([
      readJson<ProjectStatus>("project-status.json"),
      readJson<Milestone[]>("milestones.json"),
      readJson<Ticket[]>("tickets.json"),
      readJson<Decision[]>("decisions.json"),
      readJson<ActivityEntry[]>("activity.json"),
      readJson<Release[]>("releases.json"),
    ]);

  // 1. Recompute per-ticket progress (calculated field).
  const tickets: Ticket[] = ticketsRaw.map((t) => ({
    ...t,
    progressPercent: computeTicketProgress(t),
  }));

  // 2. Recompute milestone rollups: ticketIds (derived) + progressPercent.
  const milestones: Milestone[] = milestonesRaw.map((m) => ({
    ...m,
    ticketIds: tickets.filter((t) => t.milestoneId === m.id).map((t) => t.id),
    progressPercent: computeMilestoneProgress(m, tickets),
  }));

  const newData: DashboardData = {
    projectStatus,
    milestones,
    tickets,
    decisions,
    activity,
    releases,
  };

  // 3. Integrity: reuse the dashboard validator, then add script-only checks.
  const validation = validateDashboardData(newData);
  const { currentTicketId, warnings: currentTicketWarnings } = deriveCurrentTicket(
    tickets,
    projectStatus.currentTicketId ?? null,
  );
  const currentMilestoneId = deriveCurrentMilestone(currentTicketId, tickets, milestones);
  const countWarnings = await recordCountIssues(tickets, milestones);

  const integrityWarnings: IntegrityWarning[] = [
    ...validation.issues.map((i) => ({ severity: i.severity, message: i.message })),
    ...currentTicketWarnings,
    ...countWarnings,
  ];

  // 4. Remaining calculated fields.
  const ticketCounts = countTickets(tickets);
  const overallProgressPercent = computeOverallProgress(milestones, tickets);
  const activeTickets = tickets.filter((t) => isActiveStatus(t.status));
  const blockedTicketIds = tickets.filter((t) => t.status === "blocked").map((t) => t.id);
  const health = computeHealth(projectStatus.health, tickets, integrityWarnings);
  const milestonesSummary: MilestoneSummaryEntry[] = milestones.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status,
    progressPercent: computeMilestoneProgress(m, tickets),
  }));
  const recentActivityIds = activity
    .slice(-RECENT_ACTIVITY_LIMIT)
    .reverse()
    .map((a) => a.id);

  // 5. Assemble project-status with carried-over timestamps, decide if bumped.
  const base = {
    previous: projectStatus,
    currentMilestoneId,
    currentTicketId,
    overallProgressPercent,
    activeTicketCount: activeTickets.length,
    milestonesSummary,
    ticketCounts,
    blockedTicketIds,
    health,
    integrityWarnings,
    recentActivityIds,
  };
  const withOldTimestamps = buildProjectStatus({
    ...base,
    generatedAt: projectStatus.generatedAt,
    lastIntelligenceUpdate: projectStatus.lastIntelligenceUpdate ?? projectStatus.generatedAt,
  });

  const statusPath = path.join(DATA_DIR, "project-status.json");
  const ticketsPath = path.join(DATA_DIR, "tickets.json");
  const milestonesPath = path.join(DATA_DIR, "milestones.json");

  const [statusOldStr, currentStatusOnDisk] = await Promise.all([
    formatJson(statusPath, withOldTimestamps),
    readFile(statusPath, "utf-8"),
  ]);

  const statusSubstantiveChange = statusOldStr !== currentStatusOnDisk;
  const now = nowIso();
  const finalStatus = statusSubstantiveChange
    ? buildProjectStatus({ ...base, generatedAt: now, lastIntelligenceUpdate: now })
    : withOldTimestamps;

  const [statusStr, ticketsStr, milestonesStr] = await Promise.all([
    formatJson(statusPath, finalStatus),
    formatJson(ticketsPath, tickets),
    formatJson(milestonesPath, milestones),
  ]);

  const changed: string[] = [];
  if (await writeIfChanged(statusPath, statusStr)) changed.push("project-status.json");
  if (await writeIfChanged(ticketsPath, ticketsStr)) changed.push("tickets.json");
  if (await writeIfChanged(milestonesPath, milestonesStr)) changed.push("milestones.json");

  report({
    integrityWarnings,
    currentTicketId,
    currentMilestoneId,
    overallProgressPercent,
    changed,
  });

  const hasError = integrityWarnings.some((i) => i.severity === "error");
  if (isCheck) {
    if (changed.length > 0) {
      console.error(
        `\n✗ dashboard:check failed — calculated fields are stale in: ${changed.join(", ")}. Run "npm run dashboard:update".`,
      );
    }
    if (hasError) console.error("✗ dashboard:check failed — hard integrity errors present.");
    process.exit(changed.length > 0 || hasError ? 1 : 0);
  } else {
    if (hasError) {
      console.error("✗ dashboard:update wrote data, but hard integrity errors remain.");
      process.exit(1);
    }
    process.exit(0);
  }
}

function report(args: {
  integrityWarnings: IntegrityWarning[];
  currentTicketId: string | null;
  currentMilestoneId: string;
  overallProgressPercent: number;
  changed: string[];
}) {
  const mode = isCheck ? "check" : "update";
  console.log(`Dashboard Intelligence (${mode})`);
  console.log(`  Current milestone : ${args.currentMilestoneId || "none"}`);
  console.log(`  Current ticket    : ${args.currentTicketId ?? "none"}`);
  console.log(`  Overall progress  : ${args.overallProgressPercent}%`);
  const errors = args.integrityWarnings.filter((i) => i.severity === "error");
  const warnings = args.integrityWarnings.filter((i) => i.severity === "warning");
  console.log(`  Integrity         : ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const issue of args.integrityWarnings) {
    console.log(`    [${issue.severity}] ${issue.message}`);
  }
  if (isCheck) {
    console.log(
      args.changed.length > 0
        ? `  Would update      : ${args.changed.join(", ")}`
        : "  Up to date        : no changes needed",
    );
  } else {
    console.log(
      args.changed.length > 0
        ? `  Wrote             : ${args.changed.join(", ")}`
        : "  No changes needed",
    );
  }
}

main().catch((error) => {
  console.error("Dashboard intelligence failed:", error);
  process.exit(1);
});
