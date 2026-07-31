import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ActivityEntry,
  Decision,
  DashboardData,
  Milestone,
  ProjectStatus,
  Release,
  Ticket,
} from "@/features/project-dashboard/types";

/**
 * Server-only. Reads management/data/*.json directly off disk, at request
 * time — deliberately not bundled via a static `import`, so an edit to
 * these files (per management/data/README.md's update rule) is visible on
 * the next page load without a rebuild. Never import this from a Client
 * Component; `node:fs` is not available in the browser.
 */
async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), "management", "data", filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Loads the full, raw dashboard dataset. Does not validate — see
 * validate-dashboard-data.ts. Callers must validate before rendering.
 */
export async function loadDashboardData(): Promise<DashboardData> {
  const [projectStatus, milestones, tickets, decisions, activity, releases] = await Promise.all([
    readJson<ProjectStatus>("project-status.json"),
    readJson<Milestone[]>("milestones.json"),
    readJson<Ticket[]>("tickets.json"),
    readJson<Decision[]>("decisions.json"),
    readJson<ActivityEntry[]>("activity.json"),
    readJson<Release[]>("releases.json"),
  ]);

  return { projectStatus, milestones, tickets, decisions, activity, releases };
}
