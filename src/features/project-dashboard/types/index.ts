/**
 * Types for management/data/*.json, per docs/PROJECT_DASHBOARD_ARCHITECTURE.md.
 *
 * `progressPercent` fields are persisted for schema completeness and future
 * non-dashboard consumers (Excel/PDF exports), but this dashboard never
 * trusts the stored value — see lib/compute-dashboard-metrics.ts. Storing a
 * number and also independently computing it would be exactly the kind of
 * two-sources-of-truth-for-one-fact problem ADR-0017 exists to prevent.
 */

export type TicketStatus = "backlog" | "planned" | "in_progress" | "blocked" | "completed";
export type TicketPriority = "high" | "medium" | "low";
export type TicketType = "feature" | "infrastructure" | "documentation" | "bug" | "chore";

export interface TicketDependency {
  ticketId: string;
  note?: string;
}

export interface AcceptanceCriterion {
  text: string;
  met: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  milestoneId: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  owner: string | null;
  dependencies: TicketDependency[];
  acceptanceCriteria: AcceptanceCriterion[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  blockedReason: string | null;
  commitSha: string | null;
  pullRequest: string | null;
  release: string | null;
  progressPercent: number;
  lastUpdatedAt: string;
}

export type MilestoneStatus = "not_started" | "in_progress" | "blocked" | "complete";

export interface MilestoneBlocker {
  description: string;
  ticketId?: string;
  sinceDate: string;
}

export interface Milestone {
  id: string;
  name: string;
  objective: string;
  status: MilestoneStatus;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  ticketIds: string[];
  progressPercent: number;
  deliverables: string[];
  blockers: MilestoneBlocker[];
  lastUpdatedAt: string;
}

export type DecisionStatus = "proposed" | "approved" | "superseded" | "deprecated";

interface DecisionBase {
  id: string;
  date: string;
  status: DecisionStatus;
  decision: string;
  rationale: string;
  supersedes?: string | null;
  supersededBy?: string | null;
  relatedTicketIds?: string[];
  lastUpdatedAt: string;
}

export interface ArchitectureDecision extends DecisionBase {
  kind: "architecture";
  alternativesConsidered: string[];
  impact: string;
}

export interface FounderDecision extends DecisionBase {
  kind: "founder";
  productImpact: string;
  deferredImplications: string;
}

export type Decision = ArchitectureDecision | FounderDecision;

export type ActivityType =
  | "ticket_created"
  | "ticket_status_changed"
  | "ticket_completed"
  | "milestone_updated"
  | "decision_recorded"
  | "founder_decision_approved"
  | "commit_created"
  | "release_published"
  | "management_doc_edited";

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: ActivityType;
  actor: string;
  summary: string;
  relatedTicketId?: string | null;
  relatedDecisionId?: string | null;
  relatedMilestoneId?: string | null;
  /** References Release.version. Added for FM-0026's activity detail panel. */
  relatedRelease?: string | null;
  commitSha?: string | null;
  /** Populated only for *_status_changed-type events, when known. */
  previousValue?: string | null;
  newValue?: string | null;
}

export type ReleaseStatus = "unreleased" | "released" | "yanked";

export interface ReleaseNoteEntry {
  summary: string;
  ticketId?: string;
  decisionId?: string;
}

export interface Release {
  version: string;
  status: ReleaseStatus;
  workStartedDate?: string | null;
  releaseDate?: string | null;
  note?: string | null;
  added: ReleaseNoteEntry[];
  changed: ReleaseNoteEntry[];
  fixed: ReleaseNoteEntry[];
  /**
   * Git tag for this release, e.g. "v0.1.0". null means not yet tagged —
   * added for FM-0026's release detail panel. Never inferred; only set
   * when a real tag exists. "Committed" and "pushed" status for a release
   * are derived live from its referenced tickets' commitSha and
   * ProjectStatus.repositoryState instead of being duplicated here.
   */
  tag?: string | null;
}

export interface MilestoneSummary {
  id: string;
  name: string;
  status: MilestoneStatus;
  progressPercent: number;
}

export interface RepositoryState {
  localCommit: string;
  remoteCommit: string;
  ahead: number;
  pushed: boolean;
}

export interface TicketCounts {
  backlog: number;
  planned: number;
  inProgress: number;
  /** Tickets in the "review" active status. Reserved status; 0 until used. */
  review?: number;
  blocked: number;
  completed: number;
  total: number;
}

/**
 * Local project-health signal states (FM-0028). Deliberately distinguishes
 * "not_configured"/"unknown"/"pending" from real "passing"/"healthy" —
 * an unverified integration is never reported as healthy (FORMETRIX.md §7).
 */
export type HealthState =
  "passing" | "healthy" | "warning" | "failing" | "pending" | "not_configured" | "unknown";

export interface ProjectHealth {
  /** Computed by the intelligence script from data-integrity checks. */
  dataIntegrity: HealthState;
  /** Recorded by scripts/record-validation-health.ts from real command runs. */
  lint: HealthState;
  typecheck: HealthState;
  formatting: HealthState;
  build: HealthState;
  /** Derived conservatively; never claims healthy without live evidence. */
  gitSync: HealthState;
  deployment: HealthState;
  supabase: HealthState;
}

/** A structured integrity finding recorded by the intelligence script (FM-0028). */
export interface IntegrityWarning {
  severity: "error" | "warning";
  message: string;
}

export interface ProjectStatus {
  generatedAt: string;
  currentMilestoneId: string;
  /**
   * The single active engineering ticket the team is currently working on.
   * Must resolve to a ticket in tickets.json whose milestoneId equals
   * currentMilestoneId and whose status is an active one (in_progress or
   * blocked). null when no ticket is currently active — never guessed
   * (FM-0027). Consumed by lib/current-work.ts.
   */
  currentTicketId?: string | null;
  /** Human-readable product area/workstream the current work belongs to (FM-0027). */
  currentWorkstream?: string | null;
  /** One- or two-sentence summary of the current focus (FM-0027). */
  currentFocusSummary?: string | null;
  /** The clear next action for the current work (FM-0027). */
  currentNextAction?: string | null;
  /** When scripts/update-dashboard-intelligence.ts last recomputed this snapshot (FM-0028). */
  lastIntelligenceUpdate?: string | null;
  /** Count of tickets in an active status (in_progress/review/blocked) (FM-0028). */
  activeTicketCount?: number;
  /** Local project-health signals (FM-0028). */
  health?: ProjectHealth;
  /** Structured integrity findings from the last intelligence run (FM-0028). */
  integrityWarnings?: IntegrityWarning[];
  overallProgressPercent: number;
  milestonesSummary: MilestoneSummary[];
  ticketCounts: TicketCounts;
  blockedTicketIds: string[];
  repositoryState: RepositoryState;
  dataIntegrityWarningCount: number;
  recentActivityIds: string[];
}

/** The full set of loaded, raw (not yet validated) dashboard data. */
export interface DashboardData {
  projectStatus: ProjectStatus;
  milestones: Milestone[];
  tickets: Ticket[];
  decisions: Decision[];
  activity: ActivityEntry[];
  releases: Release[];
}
