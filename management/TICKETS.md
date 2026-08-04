# Tickets

## About This Document

### Purpose

TICKETS.md is the engineering backlog for Formetrix. It tracks every unit of implementation work — from repository setup through product features — as a discrete, traceable ticket with an explicit priority, status, dependency chain, and definition of done. It exists so that anyone, human or AI agent, can see what work exists, what state it is in, what it depends on, and what "done" means for it, without relying on memory or informal conversation.

### How to Maintain This Document

- Both human engineers and AI engineering agents update this document. Any contributor who creates, starts, blocks, or completes a ticket is responsible for reflecting that change here.
- Update a ticket's Status the moment its state actually changes, not retroactively and not in a later batch. A ticket should never sit at a stale status after the real-world work has moved on.
- New work is added as a new ticket with the next sequential ID (`FM-XXXX`) — do not reuse or renumber IDs, and do not delete tickets. If a ticket is abandoned, mark its Status accordingly rather than removing the entry, to preserve the historical record.
- Tickets are grouped under their milestone (`## Milestone N: [Name]`, matching the milestone names in MILESTONES.md exactly) and listed in ID order within each milestone. When a ticket's milestone changes, move the entry to the correct milestone group.
- Dependencies must always reference other ticket IDs already present in this document. Before setting a ticket to `Planned` or `In Progress`, confirm its listed dependencies are `Completed`, or add a short note in the Dependencies field explaining why the ticket is proceeding ahead of it (e.g. it can be scaffolded independently and only needs the dependency merged before it can be marked Completed).
- Every field must reflect verified fact, consistent with FORMETRIX.md's requirement for traceability and its prohibition on fabrication — do not mark a ticket `Completed` unless the acceptance criteria were actually met, and do not describe scope that was not actually agreed.
- Use the Template block below to add a new entry; fill in every field before committing the ticket.

### Structure

Each ticket is a heading of the form `### [ID] — [Title]`, grouped under a milestone heading (`## Milestone N: [Milestone Name]`), followed by these fields in order:

- **Priority:** High / Medium / Low
- **Status:** Backlog / Planned / In Progress / Blocked / Completed
- **Description:** 1-2 sentences stating what the ticket delivers.
- **Dependencies:** ticket ID(s) this ticket requires to be completed first, or `None`.
- **Acceptance Criteria:** a short bulleted list of concrete, verifiable conditions that must hold for the ticket to be called done.

**Template**

```markdown
### [FM-XXXX] — [Title]

- **Priority:** [High / Medium / Low]
- **Status:** [Backlog / Planned / In Progress / Blocked / Completed]
- **Description:** [describe what this ticket delivers, in 1-2 sentences]
- **Dependencies:** [FM-XXXX, FM-XXXX, or None]
- **Acceptance Criteria:**
  - [condition]
  - [condition]
```

---

## Milestone 0: Repository Foundation

### FM-0001 — Create the Formetrix Project Management System

- **Priority:** High
- **Status:** Completed
- **Description:** Establish a `management/` directory containing MILESTONES.md, TICKETS.md, DECISIONS.md, MEETINGS.md, and CHANGELOG.md as the permanent engineering record for the project, maintained going forward by both human contributors and AI engineering agents.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `management/` contains five files: MILESTONES.md, TICKETS.md, DECISIONS.md, MEETINGS.md, and CHANGELOG.md.
  - Each of the five files opens with an "About This Document" section covering Purpose, How to Maintain This Document, and Structure.
  - Each file's Structure section defines the exact field schema for its entries and includes a blank template block for adding new entries.
  - Each file is populated with real content following its defined structure, serving as the working example of that schema in use.

### FM-0002 — Import Founder Pack governing docs into the platform repository

- **Priority:** High
- **Status:** Completed
- **Description:** Copy the Founder Pack's governing docs — `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI.md`, and `.cursor/rules/formetrix.mdc` — into this repository so they are version-controlled next to the code that implements them, instead of living only in a separate reference directory. Per the Founder's Repository Root Rule (2026-07-30, see ADR-0016), `platform/` is now the sole canonical repository — this ticket is what makes that true for the documents that previously lived only in the Founder Pack.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/UI.md` exist in the platform repository. — Met, content verified to match the source exactly.
  - `.cursor/rules/formetrix.mdc` exists in the platform repository. — Met.
  - The imported files are committed to version control in this repository. — Met; committed in `92d0b03` ("FM-0001: Establish Formetrix engineering foundation"), pushed to `origin/main`.

### FM-0003 — Commit and push the Next.js application foundation

- **Priority:** High
- **Status:** Completed
- **Description:** Commit and push the scaffolded App Router foundation — layout, theming, error boundaries, and Supabase/Mapbox integration points — which has been verified locally (lint, typecheck, build, and dev smoke test all pass).
- **Dependencies:** None
- **Acceptance Criteria:**
  - The App Router foundation (layout, theming, error boundaries, Supabase/Mapbox integration points) is committed to git. — Met (`7e0db87`, then `92d0b03`).
  - The commit is pushed to GitHub. — Met; `origin/main` matches local `main` at `92d0b03`.
  - `npm run lint`, `npm run typecheck`, and `npm run build` pass on the pushed state. — Met, verified against the current working tree built on top of `92d0b03`.

### FM-0004 — Set up continuous integration

- **Priority:** Medium
- **Status:** Planned
- **Description:** Add a GitHub Actions workflow that runs `npm run lint`, `npm run typecheck`, and `npm run build` on every pull request, per FORMETRIX.md engineering standards.
- **Dependencies:** FM-0003 — Completed (`92d0b03`, pushed to `origin/main`); the foundation this workflow would run against now exists on GitHub.
- **Acceptance Criteria:**
  - A GitHub Actions workflow file exists that triggers on pull requests.
  - The workflow runs `npm run lint`, `npm run typecheck`, and `npm run build`.
  - A pull request with a failing lint, typecheck, or build step is reported as failing by the workflow.

### FM-0005 — Provision the Supabase project and wire environment variables

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Connect Formetrix to the Founder's hosted Supabase project: env contract (publishable/anon compatibility), local `.env.local` wiring, CLI link, migration review/dry-run/push with Founder approval, connection health, and readable `supabase_unconfigured` auth screen. No sign-in forms.
- **Dependencies:** FM-0003 — Completed.
- **Acceptance Criteria:**
  - Local env contract documents `NEXT_PUBLIC_SUPABASE_URL` + `PUBLISHABLE_KEY` (anon fallback) and `.env.local` is git-ignored. (met)
  - Hosted Supabase project is linked via CLI (ref `pdzokayrbvihjavkrcze`); connection health verified (GoTrue `/auth/v1/health` 200 via publishable key). (met)
  - Migrations reviewed; dry-run shown; all 6 migrations applied with Founder approval — `migration list` confirms local == remote. (met)
  - Unconfigured auth screen is branded (not global error); no sign-in forms; no secrets committed. (met)
- **Notes:** Service-role key remains server-only and was not required (left unset locally). PostGIS enabled before spatial tables; org tables/RLS before property RLS; no seeds or dev users applied. Post-push schema verification (2026-08-03): hosted tables `user_profiles`, `organizations`, `organization_memberships`, `properties`, `parcels`, `property_parcels` with RLS; PostGIS 3.3.7; functions `set_updated_at`, `can_access_property`, `upsert_parcel_from_provider`.

### FM-0006 — Connect Vercel deployment for the platform repository

- **Priority:** Medium
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Deploy Formetrix to Vercel and verify the hosted environment works with the connected Supabase project. Production branch `main`; no custom domain unless Founder requests.
- **Dependencies:** FM-0003 — Completed; the foundation is on GitHub, so a Vercel project can now be connected and deploy from it.
- **Acceptance Criteria:**
  - GitHub repository `formetrix/platform` is connected to one Vercel project; `main` deploys successfully. (met)
  - Hosted env vars configured (URL + publishable key; service-role only if required); production URL reachable. (met)
  - Public home and Mission Control load; protected routes follow expected auth behavior; Supabase Auth URLs documented. (met)
  - Mission Control deployment health verified; no secrets committed; validation suite passes. (met)
- **Notes:** Production URL https://platform-pi-olive-13.vercel.app. Framework Preset corrected Other→Next.js. `/properties` redirects to sign-in placeholder (not `supabase_unconfigured`). No custom domain.

### FM-0021 — Configure the Supabase application foundation

- **Priority:** High
- **Status:** Completed
- **Description:** Build out `src/lib/supabase/` with a browser client, server client, a dormant session-refresh middleware utility, centralized config validation, and a manually-invoked health-check utility — preparing the codebase for future authentication, database access, and storage without connecting to a live project or implementing any business logic.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `src/lib/supabase/` contains `client.ts`, `server.ts`, `middleware.ts`, `config.ts`, and `health-check.ts`.
  - `getSupabaseConfig()` throws one aggregated, clear error naming every missing required Supabase environment variable.
  - `checkSupabaseHealth()` is exported but not invoked automatically anywhere in the codebase.
  - `.env.example` documents `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with no real credentials.
  - No tables, migrations, Row Level Security policies, or authentication UI were created; `npm run lint`, `npm run typecheck`, and `npm run build` all pass.

> **Note on this ticket's ID:** the request that produced this ticket self-labeled it "FM-0002." That ID was already assigned (see FM-0002 above — Founder Pack doc import — filed when FM-0001 was completed and still Planned). Per this document's own rule against reusing or renumbering IDs, this work was filed as FM-0021, the next unused ID, instead. FM-0002 was left untouched.

### FM-0022 — Define the Formetrix Core Domain Model

- **Priority:** High
- **Status:** Completed
- **Description:** Author `docs/DOMAIN_MODEL.md`, defining the implementation-independent business vocabulary (Organization, User, Membership, Property, Parcel, Scenario, Assumption, Analysis, Constraint, Result, Recommendation, Report, Data Source) that future schema, API, and UI work should draw from, with explicit Version 1 boundary recommendations and unresolved questions flagged for founder review rather than silently resolved.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `docs/DOMAIN_MODEL.md` exists with all 15 required sections present.
  - All required core concepts are evaluated, each stating what it is, what it is not, and its relationships.
  - Every concept in the Version 1 Boundary table carries an explicit Required/Likely/Deferred/Requires-founder-decision label with reasoning.
  - Open Questions are listed and split into blocking vs. non-blocking.
  - A conceptual (not physical-schema) relationship diagram is included and labeled as such.
  - The fact/assumption/calculation/interpretation/recommendation distinction is addressed as its own section.
  - No application code, database schema, or migrations were added or changed; `npm run lint`, `npm run typecheck`, and `npm run build` remain unaffected.

### FM-0023 — Resolve Founder Domain Decisions and Finalize the Version 1 Domain Boundary

- **Priority:** High
- **Status:** Completed
- **Description:** Incorporate Founder Decisions FD-0001 through FD-0009 into `docs/DOMAIN_MODEL.md` — resolving all five previously-blocking Open Questions and two non-blocking ones, adding Property's lifecycle/status concept, and finalizing the Version 1 domain boundary — and record the decisions themselves in a new `management/FOUNDER_DECISIONS.md`.
- **Dependencies:** FM-0022
- **Acceptance Criteria:**
  - `docs/DOMAIN_MODEL.md` reflects all nine approved founder decisions with no concept still labeled "Requires founder decision."
  - All five previously-blocking Open Questions are resolved and moved out of §13's blocking section into the relevant entity's clarifications, not deleted.
  - Property is documented as a long-lived workspace with a lifecycle status, without expanding Version 1 feature scope.
  - `management/FOUNDER_DECISIONS.md` exists with FD-0001–FD-0009, each carrying date, status, decision, rationale, product impact, and deferred implications.
  - `management/DECISIONS.md` references the founder decisions' architectural consequences without duplicating their text.
  - No application code, database schema, or migrations were added or changed; `npm run lint`, `npm run typecheck`, and `npm run build` remain unaffected.

### FM-0024 — Design the Formetrix Project Control Dashboard

- **Priority:** High
- **Status:** Completed
- **Description:** Author `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` — the architecture for a single-source-of-truth project-control system: structured `management/data/*.json` schemas, dashboard information architecture, progress-calculation rules, an update/validation/audit workflow, and an automation design — without building any of it.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` exists covering source-of-truth rules, all six `management/data/*.json` schemas with examples, nine dashboard views, progress-calculation formulas, validation rules, audit trail, and automation design.
  - The source-of-truth recommendation is validated, not accepted uncritically, with risks identified.
  - No dashboard UI, populated production JSON, active Claude Code hook, Excel workbook, or PDF template was created.
  - `management/DECISIONS.md` records the genuine engineering-level data-modeling decisions made (ADR-0017–ADR-0019); product/process questions are left as founder decisions in the architecture doc itself, not prematurely recorded as settled.

### FM-0025 — Build the Formetrix Project Control Dashboard MVP

- **Priority:** High
- **Status:** Completed
- **Description:** Build a working internal browser dashboard at `/internal/project-dashboard`, populated from real `management/data/*.json` (not examples), showing milestones, tickets, decisions, releases, activity, and risks — per the architecture in `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` (FM-0024).
- **Dependencies:** FM-0024
- **Acceptance Criteria:**
  - The route exists, loads successfully, and shows current milestones, tickets (kanban-organized), decisions, releases, activity, and blockers.
  - `management/data/{project-status,milestones,tickets,decisions,activity,releases}.json` exist, populated from the actual current project state — no invented statuses or completed work; uncertain timestamps are explicitly documented as approximate in `management/data/README.md`.
  - JSON is typed (`src/features/project-dashboard/types/`) and validated (`lib/validate-dashboard-data.ts`) before rendering; invalid data renders a clear error instead of failing silently.
  - Progress percentages are computed live from ticket/acceptance-criteria data (`lib/compute-dashboard-metrics.ts`), never trusted from a stored field — this is what surfaced Milestone 0's real progress as 73% (computed) rather than a hand-set number.
  - Dark and light themes both work (inherited from the existing root `ThemeProvider`, verified, not reimplemented).
  - No Excel, PDF, authentication, Claude Code hooks, or GitHub Issues integration exists.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass; the route was confirmed to return HTTP 200 with real data rendered via a local dev-server request, not just a successful build.

### FM-0026 — Apply Formetrix branding and interactive dashboard details

- **Priority:** High
- **Status:** Completed
- **Description:** Apply the Founder-approved Formetrix brand system (Deep Navy/Charcoal/Electric Cyan/Light Gray/White, Inter + Space Grotesk) to `/internal/project-dashboard`, and build a reusable detail-drawer system so every dashboard item — tickets, milestones, roadmap entries, decisions, activity, releases, and summary cards — is clickable and shows its full available information.
- **Dependencies:** FM-0025
- **Acceptance Criteria:**
  - The official color palette is applied in both themes; a deliberate, documented accessibility adjustment darkens Electric Cyan for light-mode text/UI use (raw `#00D4FF` on white fails WCAG contrast at ~1.8:1) while keeping the literal brand hex for dark mode and low-opacity fills.
  - Inter (weights 500/600/700) is the primary UI font; Space Grotesk is used for metric/data emphasis — both loaded via the existing `next/font/google` mechanism, no new dependency.
  - `docs/DESIGN_SYSTEM.md` exists covering all 15 required sections; `docs/UI.md` references it as authoritative.
  - One reusable `DetailDrawer` + `DashboardDetailProvider` (not a bespoke modal per section) powers detail panels for tickets, milestones, decisions, activity, releases, filtered ticket lists, and a progress-formula explanation; cross-references (dependencies, included tickets, related decisions) open other panels in place.
  - Panels are keyboard accessible: hand-rolled focus trap, Escape-to-close, focus moves in on open and restores to the trigger on close, `role="dialog"`/`aria-modal`/`aria-label`, semantic `<button>` triggers throughout (never a clickable `<div>`).
  - The Kanban board deliberately keeps the project's real five ticket statuses rather than the ticket's suggested six — "Ready" and "Review" aren't tracked anywhere in `management/data/tickets.json`, and inventing them would violate this ticket's own "do not invent" instruction; documented in `docs/DESIGN_SYSTEM.md` §15.
  - No data was fabricated — genuinely absent fields (e.g. `owner`, `commitSha`, `pullRequest`) are hidden, not shown empty; two schema extensions (`ActivityEntry.relatedRelease`/`previousValue`/`newValue`, `Release.tag`) were added and populated only from existing data, per the ticket's explicit extension rule.
  - No drag-and-drop, authentication, Excel, PDF, active hooks, or GitHub Issues integration were added.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass; verified against a running dev server (HTTP 200, interactive markup present).

### FM-0026A — Fix DashboardDetailProvider runtime error and verify dashboard stability

- **Priority:** High
- **Status:** Completed
- **Description:** Fix a reported runtime error (`useDashboardDetail must be used within a DashboardDetailProvider`, thrown from `executive-summary.tsx`) by consolidating the dashboard's nine independent server→client boundary crossings into a single client shell component (`ProjectDashboardShell`), per the ticket's specified structure. A bug-fix patch to FM-0026, not new feature work.
- **Dependencies:** FM-0026
- **Acceptance Criteria:**
  - `page.tsx` (Server Component) only loads and validates data, then renders one client component; it no longer independently authors JSX for section components that get threaded through another client component's `children`.
  - `ProjectDashboardShell` (new, "use client") renders `DashboardDetailProvider` and every section component from within its own module — the sole client boundary for the page.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass, including a clean build from a wiped `.next/` directory.
  - Verified via both `next start` (production, no HMR involved at all) and three consecutive fresh `next dev` requests — HTTP 200 each time, no provider error or data-integrity error in any response, clean server logs.
  - **Caveat, stated explicitly rather than overclaimed:** this environment has no browser-automation tool available, so the original client-side/hydration error could not be directly reproduced or re-triggered in a real browser. The fix is verified by (a) confirming the original SSR output was already correct — meaning the bug was not a fundamental structural flaw — and (b) restructuring to eliminate the entire class of multi-boundary Fast-Refresh fragility the symptom matches, not by watching the original error disappear firsthand.

### FM-0027 — Add Current Work Focus and Project Code Legend

- **Priority:** Medium
- **Status:** Completed
- **Description:** Add a prominent Current Work section to the top of `/internal/project-dashboard` (after the header, before the executive summary) that answers immediately which milestone and engineering ticket are active, what product workstream is being built, and the clear next action — plus a Project Codes / Naming Key legend explaining what identifiers like M0, FM-0027, ADR-0022, FD-0009, and v0.1.0 mean. Current work is resolved from typed structured data (`management/data/project-status.json`), never guessed; the active milestone and ticket are highlighted throughout the dashboard.
- **Dependencies:** FM-0026A — Completed. Reuses the existing reusable detail-drawer system (FM-0026) and single client-shell structure (FM-0026A).
- **Acceptance Criteria:**
  - `management/data/project-status.json` is extended with `currentTicketId`, `currentWorkstream`, `currentFocusSummary`, and `currentNextAction` (`currentMilestoneId` already existed); the active milestone and ticket resolve to real records.
  - A prominent Current Work section renders after the dashboard header and before the executive summary, showing the active milestone, active ticket, status, priority, computed progress, workstream, short description, dependencies, blocker (when present), last-updated time, and a clear next action.
  - Current Work is resolved from typed structured sources; if the current-work pointers are inconsistent (missing record, wrong milestone, non-active status, out-of-range progress) a visible integrity warning is shown instead of invented values.
  - The Current Work card opens the existing reusable detail drawer with the full active-ticket details; the milestone identifier inside the drawer opens the milestone panel.
  - The active milestone is highlighted in the milestone progress list and roadmap, and the active ticket is highlighted with a "Current" badge in its Kanban column.
  - A "Project Codes" trigger opens the existing drawer and explains M, FM, ADR, FD, v, PR, and commit SHA — including numbering and where each record is stored — sourced from a typed config file (`src/features/project-dashboard/config/project-codes.ts`).
  - Accessibility: the Current Work card and Project Codes trigger are real buttons with visible keyboard focus; the drawer supports Escape-to-close and restores focus; status is never conveyed by color alone; reduced motion is respected.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass.
  - Verified at `http://localhost:3000/internal/project-dashboard` via dev/production server requests (HTTP 200) and rendered-markup assertions; a full interactive browser session was not available in this environment (same caveat as FM-0026A). Closed out during FM-0028.

### FM-0028 — Add Dashboard Intelligence Automation MVP

- **Priority:** High
- **Status:** Completed
- **Description:** Add a deterministic, local dashboard-intelligence system — `scripts/update-dashboard-intelligence.ts` (with `npm run dashboard:update` / `npm run dashboard:check`) and a validation-health recorder (`npm run dashboard:health`) — that recomputes the Mission Control snapshot from repository-controlled data (progress, counts, current work, integrity, and local project health), reducing manually maintained values, and record a Definition of Done that requires running it before any ticket is marked Completed.
- **Dependencies:** FM-0027 — Completed. Builds on the Current Work model and structured `project-status.json` fields FM-0027 introduced.
- **Acceptance Criteria:**
  - `npm run dashboard:update` exists and writes only calculated fields; `npm run dashboard:check` validates without writing and fails on stale calculated fields or hard integrity errors.
  - Active work is determined from explicit ticket status (`in_progress`/`review`/`blocked`); no next planned ticket is auto-selected; multiple active tickets require an explicitly selected primary or produce an integrity warning.
  - The current milestone is validated to match the active ticket's milestone.
  - Milestone and overall progress are calculated deterministically (completed ÷ total scoped tickets, overall = equal-weighted mean of milestone completion), clamped to 0–100, and documented in `docs/MISSION_CONTROL.md`.
  - Project health distinguishes `passing`/`failing` from `unknown`/`not_configured`, never claiming GitHub/Vercel/Supabase healthy without evidence.
  - Integrity problems (missing/duplicate/mislinked records, out-of-range progress, completed-without-completedAt, Markdown/JSON count discrepancies, release/decision reference gaps) are detected and rendered in Mission Control.
  - Running `dashboard:update` repeatedly with no source change produces no file changes.
  - The future-ticket Definition of Done is added to `.cursor/rules/formetrix.mdc` and `docs/MISSION_CONTROL.md`.
  - FM-0028 is shown as the active current ticket during implementation and Completed afterward, with no next ticket auto-activated.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass.
  - Verified at `http://localhost:3000/internal/project-dashboard` via server requests and rendered-markup assertions; a full interactive browser session was not available in this environment (same caveat as FM-0026A).

---

## Milestone 1: Authentication

### FM-0007 — Design the Initial Core Database Schema

- **Priority:** High
- **Status:** Completed
- **Description:** Architecture-only design of the foundational database schema (User, Organization, OrganizationMember, Property, PropertyWorkspace) as `docs/DATABASE_SCHEMA.md` — entities, fields, relationships, cardinality, ownership/tenancy, and future extension points, with a Mermaid ER diagram. No SQL, Prisma, migrations, live tables, Supabase connection, or authentication code.
- **Dependencies:** FM-0005 — not a blocker for this ticket: FM-0007 is architecture-only and does not require a live Supabase project. Implementation (schema, migrations) is deferred to a later ticket once FM-0005 is provisioned.
- **Acceptance Criteria:**
  - `docs/DATABASE_SCHEMA.md` exists documenting the core entities (User, Organization, OrganizationMember, Property, PropertyWorkspace) with purpose, fields, data types, required/optional, primary key, foreign keys, unique constraints, and future extension points.
  - Relationships, cardinality, and ownership/tenancy rules are documented and consistent with the founder-approved domain model (FD-0002–FD-0005) and FORMETRIX.md.
  - A Mermaid ER diagram is included.
  - `PropertyWorkspace` is defined as the evaluation surface that future modules (Parcel, Zoning, Constraints, Assumptions, Financial, Recommendation, Documents, Activity) attach to — extension points only, those modules not designed.
  - No SQL, Prisma schema, Supabase migrations, live tables, or authentication code were produced; the model is normalized, multi-tenant, and production-ready.

### FM-0008 — Design Authentication & Organization Architecture

- **Priority:** High
- **Status:** Completed
- **Description:** Architecture and UI planning for authentication and organization management — sign-in/up, password reset, email verification, organization creation/invitation/switching, membership roles (Owner/Admin/Member/Viewer), and account settings — documented as `docs/AUTH_FLOW.md`. No Supabase Auth configuration, OAuth providers, migrations, or React components.
- **Dependencies:** FM-0007 — Completed. Builds on the User, Organization, and OrganizationMember schema.
- **Acceptance Criteria:**
  - [x] `docs/AUTH_FLOW.md` exists covering sign-in, sign-up, password reset, email verification, organization creation, invitation, switching, membership roles, and account settings.
  - [x] Roles Owner, Admin, Member, and Viewer are defined with permissions, responsibilities, and future expansion.
  - [x] Complete user journeys are documented with flow or sequence diagrams (new account → org → invite → join → multi-org → switch).
  - [x] UI planning includes screen list, navigation, form fields, validation, error/empty states, and future MFA — no React components implemented.
  - [x] Security considerations and future provider compatibility (Supabase Auth, Google/Microsoft, magic links, SSO) are documented; no providers or Auth implemented.

### FM-0009 — Implement Supabase Session Refresh Middleware and Protected Routes

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Implement authentication session infrastructure — root middleware that refreshes Supabase sessions via the existing `updateSession` utility, centralized protected-route policy, verified server-side user resolution, and safe redirect behavior. No sign-up/sign-in forms, OAuth, migrations, or role enforcement.
- **Dependencies:** FM-0008 — Completed. AUTH_FLOW.md defines redirect targets and session expectations.
- **Acceptance Criteria:**
  - [x] Root middleware exists, uses `src/lib/supabase/middleware.ts` `updateSession`, and refreshes Supabase sessions with an appropriate matcher.
  - [x] Protected-route policy is centralized; unauthenticated access redirects safely to `/auth/sign-in` with an open-redirect-safe return path.
  - [x] Verified server-side authenticated-user resolution exists with typed results (authenticated / unauthenticated / unconfigured / error).
  - [x] Public routes and static assets remain accessible; unconfigured Supabase does not crash public pages or silently bypass auth.
  - [x] No sign-up/sign-in feature, OAuth, migrations, or role-based authorization was implemented.

### FM-0010 — Implement Organization and Workspace Membership Model

- **Priority:** Medium
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Implement foundational organization-membership data model — `user_profiles`, `organizations`, `organization_memberships` migrations with RLS, typed server access helpers, role hierarchy, and safe V1 active-organization context. No onboarding/invitation UI; migrations are not applied to a live project.
- **Dependencies:** FM-0007, FM-0008, FM-0009 — Completed.
- **Acceptance Criteria:**
  - [x] Migration-ready SQL exists for `user_profiles`, `organizations`, and `organization_memberships` with constraints, indexes, and updated-at handling.
  - [x] RLS policies (or clearly separated SQL) cover profile self-access, org visibility for active members, and authorized membership management without self-elevation.
  - [x] Typed server helpers exist for profile, current organization, membership/role checks, and listing organizations with explicit result types.
  - [x] Active organization selection is safe for V1 (one active context); role hierarchy and slug validation are tested; no onboarding/invitation UI or live migration apply.

### FM-0006A — Implement Production Authentication UI

- **Priority:** High
- **Status:** Completed
- **Owner:** Claude Fable 5
- **Description:** Replace the placeholder auth routes with working Supabase authentication flows — sign-in, sign-up, forgot password, reset password, sign-out, email-verification handling, safe `next` return paths — plus a minimal first-login organization setup that creates the Organization, the owner Membership, and the active-organization context. No invitations or organization switching.
- **Dependencies:** FM-0009 — Completed (session middleware, route policy, return-path safety); FM-0010 — Completed (membership model, RLS, typed access helpers); FM-0005 — Completed (hosted Supabase project with migrations applied).
- **Acceptance Criteria:**
  - Sign-in accepts email + password with show/hide, validation, friendly errors, and preserves a sanitized `next` return path. — Met; verified by replaying real form posts against a running server: wrong password renders "Email or password is incorrect.", an empty password renders "Enter your password.", correct credentials return HTTP 303, and `?next=/property/demo/zoning` round-trips while `?next=https://evil.example` is discarded down to `/properties`.
  - Sign-up collects full name, email, password, confirmation, and terms, creates the Supabase Auth user, and shows the email-verification state when confirmation is required. — Met for every field validation, the verification panel, and the enumeration-safe response to an already-registered address. **Stated plainly:** the "a brand-new row appears in `auth.users`" step was not directly observed through the form — see Notes.
  - Forgot password sends a reset email using the configured production/local redirect URL and shows an enumeration-safe success state. — Met; an address with no account renders the same "Check your email" panel as one with an account, and a malformed address is rejected on the field.
  - Reset password validates the recovery session, updates the password, and routes onward; sign-out clears the session and returns to sign-in. — Met; a real recovery token from `admin/generate_link` was exchanged at `/auth/confirm` (307 → `/auth/reset-password`), the form set a new password (303), the rotated password then authenticated while the old one was rejected, and a mismatched confirmation was refused before any update. Sign-out returned 303 to `/auth/sign-in`, and the prior session was subsequently rejected.
  - After authentication the user profile is resolved server-side: no organization sends the user to organization setup, otherwise to `next` or `/properties`. — Met; with membership rows removed, sign-in returned 303 → `/onboarding/organization`; with an organization present it returned 303 → `/properties`.
  - Organization setup creates the Organization, an owner Membership, and sets the active organization — no invitations, no organization switching. — Met; the form action produced `role=owner`, `status=active`, and `active_organization_id` set, verified by querying the hosted database. A taken URL, an empty URL, and a too-short name each render on the correct field; a second organization is refused as `already_member`.
  - Security posture is preserved: verified server-side auth, no trusted client user ids, sanitized return paths, no service-role key exposure, no weakened middleware. — Met; the organization RPC derives its actor from `auth.uid()` (an anonymous caller receives `unauthenticated`), return-path validation now rejects every `/auth/*` path, no service-role key is referenced on any user-facing path, and middleware's protected-route behavior is unchanged apart from adding `/onboarding/*`.
  - Validation suite passes (`test`, `lint`, `typecheck`, `format:check`, `build`, `dashboard:update`, `dashboard:check`, `dashboard:health`) and the flows are verified against a running server. — Met.
- **Notes:**
  - **Sign-up user creation, unobserved and why.** Every test address available was undeliverable — `formetrix.ai` has no DNS record at all, so Supabase rejects it as an invalid address (surfaced correctly as "Enter a valid email address."), and the hosted project's built-in SMTP allows 2 emails per hour, which verification consumed. Attempts after that returned the rate-limit path (surfaced correctly as "Too many attempts."). What _is_ verified: the success branch of `signUpAction` renders the verification panel when Supabase returns a user with no session, and the complete downstream journey — unconfirmed user cannot sign in, confirmation link establishes a session, the profile trigger fires, and the user lands on organization setup — was verified against a user created through the Auth admin API, which inserts into `auth.users` by the same path. Configuring a real SMTP provider would close this gap and is needed before onboarding real users regardless.
  - The `/properties` first-login redirect is delivered in-band (HTTP 200 plus client navigation) rather than as a 3xx, because the root `loading.tsx` streaming boundary fixes the response status before the page's `redirect()` runs — the same App Router constraint recorded in ADR-0026. The primary path (the sign-in Server Action) does return a real 303.
  - Fixed a pre-existing defect found while wiring the browser client: `NEXT_PUBLIC_*` variables were read through a computed `process.env[name]` lookup, which Next.js does not inline into client bundles, so every Client Component saw them as unset. This had been silently disabling the FM-0015 parcel map's client-side `isMapboxConfigured()` check (ADR-0042).
  - Pre-existing migration-history drift, left untouched and reported rather than silently repaired: the four FM-0015/FM-0016 migrations are recorded remotely under different version numbers than their local filenames, so `supabase db push` will fail until someone runs `supabase migration repair`. This ticket's migration was applied directly and recorded as `20260804070000`.
  - Verification fixtures created in the hosted project during this ticket were removed afterward; the project is back to zero users and zero organizations.

---

## Milestone 2: Property Workspace

### FM-0011 — Implement Property and Parcel Database Schema with PostGIS

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Implement foundational PostgreSQL/PostGIS schema for `properties`, shared `parcels`, and `property_parcels` with provenance, spatial indexes, RLS, typed server helpers, and property status transition logic. No Property Workspace UI, Regrid, or Mapbox; migrations are not auto-applied.
- **Dependencies:** FM-0007, FM-0010 — Completed.
- **Acceptance Criteria:**
  - [x] PostGIS-enabled migrations define `properties`, `parcels`, and `property_parcels` with spatial indexes, provenance, and RLS.
  - [x] One Property may link many Parcels; Parcels are shareable across Organizations without exposing private Property data.
  - [x] Typed server helpers and centralized property status transition rules exist with pure tests; no UI/Regrid/Mapbox; migrations not auto-applied.

### FM-0012 — Implement Regrid Parcel Search and Property Creation Service

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Build Regrid API client and server services for parcel search (address/APN/coordinates), parcel import/sync with provenance, and `createPropertyFromParcel` — no UI, Mapbox, or workspace changes.
- **Dependencies:** FM-0011 — Completed.
- **Acceptance Criteria:**
  - [x] Typed Regrid client exists with env validation, error handling, retry, and rate-limit handling.
  - [x] `searchParcels` / `importParcel` / `createPropertyFromParcel` / `refreshParcel` services return typed results, reuse parcels by `(provider, provider_parcel_id)`, and preserve provenance.
  - [x] Focused tests cover duplicates, API failures, rate limits, parcel reuse, and property creation; no UI; live credentials not required for build/tests.

### FM-0013 — Build the Property Workspace (Version 1)

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Replace mock Property Workspace with real service-backed `/properties` and `/property/[id]`: Overview with parcel provenance, timeline, recommendation placeholder, working section nav (Coming Soon for future modules), responsive investor-ready UI. No fake records. Address/location search UI remains out of scope for a later ticket.
- **Dependencies:** FM-0012 — Completed; FM-0029 — Completed (mock shell).
- **Acceptance Criteria:**
  - [x] `/properties` and `/property/[id]` load from Property services with no mock records; empty states when unconfigured or no data.
  - [x] Workspace header, left nav, Overview (facts, parcel card, timeline, recommendation placeholder), PropertyStatusBadge, and responsive layout ship investor-ready Formetrix design.
  - [x] Lazy-load-ready extension points exist for Zoning, Financial, Constraints, Recommendation, Documents, Activity; no Mapbox/zoning engine/AI.

### FM-0014 — Property Dashboard

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Build the primary property overview screen showing what the property is, where it is, and what data is available. Central workspace dashboard with identity, parcel/property summary, data availability, dataset/analysis inventory, recommendation placeholder, timeline, and module quick-nav — real services only; no Mapbox, zoning engine, or financial calculations.
- **Dependencies:** FM-0013 — Completed.
- **Acceptance Criteria:**
  - [x] The dashboard shows what the property is.
  - [x] The dashboard shows where the property is.
  - [x] The dashboard shows what data is available for the property.

### FM-0015 — Mapbox parcel visualization

- **Priority:** Medium
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Install `mapbox-gl` and render live PostGIS parcel geometry on the Property Dashboard — boundary, fit bounds, property marker, street/satellite styles, empty states. No mock parcel data.
- **Dependencies:** FM-0011 — Completed.
- **Acceptance Criteria:**
  - [x] `mapbox-gl` is installed.
  - [x] Parcel geometry renders on a map from live property/parcel data (fit bounds, property marker, street/satellite).
  - [x] The map visualization does not imply unsupported precision; missing geometry/token show honest empty states.

### FM-0029 — Build the Property Workspace Foundation

- **Priority:** High
- **Status:** Completed
- **Description:** Build the first investor-facing product feature: a `/properties` list and a `/property/[id]` workspace, backed by typed mock data only (no Supabase). The workspace shows an Overview panel of 5 cards (Property Facts, Parcel Facts, Development Snapshot, Current Recommendation, Unknowns) plus a left navigation for 9 future sections, 8 of which render a shared Coming Soon stub.
- **Dependencies:** None — deliberately built ahead of FM-0011/FM-0012/FM-0013 (real property/parcel data) on typed mock data only, so the workspace UI and architecture can be proven out before Supabase/PostGIS/Regrid exist.
- **Acceptance Criteria:**
  - `/properties` lists all mock properties and links into each workspace; `/property/[id]` renders the persistent workspace chrome (name, address, parcel/APN, city, state, acres, zoning, status, map placeholder, summary).
  - A left navigation lists all 9 future sections (Overview, Parcel, Zoning, Constraints, Assumptions, Financial, Recommendation, Documents, Activity); only Overview has real content, the other 8 render a shared `ComingSoonPanel` via real, bookmarkable sub-routes rather than client-side tabs.
  - The Overview panel shows exactly 5 cards (Property Facts, Parcel Facts, Development Snapshot, Current Recommendation, Unknowns), every value sourced from typed mock data (`src/features/properties/data/mock-properties.ts`), grounded in `docs/DOMAIN_MODEL.md`'s Property/Parcel/Constraint/Recommendation/Unknown model and its six-category fact taxonomy.
  - Domain components are reusable and hold no duplicated UI (`FactRow` is shared by Property Facts and Parcel Facts cards; `Badge` and `interactiveCardClass` are promoted to `src/components/ui`/`src/lib/utils` per FORMETRIX.md §24, since the properties feature is a second real consumer); no business logic lives in `page.tsx`/`layout.tsx` files.
  - Styling follows the Formetrix Design System: dark mode first, brand colors via theme tokens, 8px-radius cards, Inter for prose and `font-metric` for data emphasis.
  - The workspace already supports Scenario tabs, multiple recommendations, a financial engine, a real map, and documents without redesign: every section is a real route (not a client-side tab), `Recommendation` is modeled as one-of-possibly-many rather than a single hardcoded slot, and `MapPlaceholder` reserves the map's position for FM-0015.
  - Authentication, Supabase, calculations, reports, PDF, and AI are explicitly not implemented.
  - An unknown property id (e.g. `/property/nonexistent`) returns a real HTTP 404, not a 200 with not-found content rendered inside it — this required `generateStaticParams` + `dynamicParams = false` (ADR-0026) to route around a Next.js App Router limitation where the pre-existing root `loading.tsx`'s streaming boundary locks the response status at 200 before a runtime `notFound()` call deeper in the tree can change it.
  - `npm run dashboard:update`, `npm run dashboard:check`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, and `npm run dashboard:health` all pass.
  - Verified at `http://localhost:3000/properties` and `/property/demo` (plus all 3 mock property ids, all 9 sections, and the unknown-id 404 case) via dev/production server requests and rendered-markup assertions; a full interactive browser session was not available in this environment (same caveat as FM-0026A).

### FM-0030 — Secure parcel ingestion RPCs

- **Priority:** High
- **Status:** Completed
- **Owner:** Claude Fable 5
- **Description:** Restrict `upsert_parcel_from_provider` and `upsert_parcel_zoning_from_provider` to the Supabase `service_role`. Both are `SECURITY DEFINER` and bypass RLS, but a configuration audit found `anon` and `authenticated` still hold EXECUTE on the hosted project, so any holder of the publishable key can write shared parcel and zoning reference data. No application or UI behavior changes.
- **Dependencies:** FM-0012 — Completed (created `upsert_parcel_from_provider`); FM-0016 — Completed (created `upsert_parcel_zoning_from_provider`).
- **Acceptance Criteria:**
  - Both ingestion RPCs explicitly `REVOKE EXECUTE` from `public`, `anon`, and `authenticated`, and `GRANT EXECUTE` only to `service_role`. — Met; migration `20260804180000` applies the revoke/grant per overload via a `pg_proc` loop and self-verifies with `has_function_privilege`, raising rather than reporting success if any untrusted role retains access.
  - The hosted project reflects the corrected privileges; `has_function_privilege` reports false for `anon` and `authenticated`. — Met; both report false, and live calls return SQLSTATE `42501` for an anonymous caller (HTTP 401) and for a real signed-in user token (HTTP 403).
  - Parcel import through the server-side service-role client still succeeds, including duplicate reuse. — Met; a live Regrid parcel imported with geometry through the real `importParcel` path, and a repeat import reused the same row (`created=false`) rather than duplicating it. The verification row was deleted afterward; the database is back to zero parcels.
  - An automated regression test fails if a future migration reintroduces `anon`/`authenticated` execute access to an ingestion RPC. — Met; `src/lib/properties/ingestion/rpc-permissions.test.ts`, proven to fail by temporarily reintroducing the original grant and observing the assertion. It also carries an opt-in live probe (`FORMETRIX_LIVE_RPC_CHECK=1`) asserting `42501`, skipped by default so the suite stays offline.
  - No application code, UI, or unrelated migration is changed; the full validation suite passes. — Met; the only source change is the new test file, plus the new migration and management records.
- **Notes:**
  - Root cause: Supabase's default privileges grant EXECUTE on new `public` functions directly to the named `anon`/`authenticated` roles, and `REVOKE ... FROM PUBLIC` does not remove a grant held by a named role. The global default-privilege behavior is deliberately left alone — narrowing it would also strip `authenticated` from functions that must stay callable by signed-in users (`create_organization_with_owner`, and the RLS helpers `is_active_org_member` / `has_org_role` / `can_access_property`). Every future server-only `SECURITY DEFINER` function needs the same explicit revoke (ADR-0043).
  - Found while verifying, out of scope and left unfixed: `normalizeRegridFeatureCollection` reads `collection.features`, but Regrid's live v2 address endpoint returns the FeatureCollection nested under a `parcels` key, so `searchParcels` returns zero candidates against the real API. The unit tests pass because they mock a bare FeatureCollection. Ingestion was therefore verified by normalizing a live Regrid feature directly through `normalizeRegridFeature`.

---

## Milestone 3: Development Intelligence

### FM-0016 — Zoning data model and Zoning Overview

- **Priority:** High
- **Status:** Completed
- **Owner:** Cursor Grok 4.5
- **Description:** Store zoning classification per parcel (normalized municipality, district/code, overlays, uses, dimensional regulations) with multi-provider provenance, and surface a Zoning Overview in the Property Workspace. Never fabricate zoning facts.
- **Dependencies:** FM-0011 — Completed.
- **Acceptance Criteria:**
  - [x] Zoning classification is stored per parcel.
  - [x] A Zoning Overview surfaces the stored classification to the user (district, municipality, uses, dimensional regs, provenance) with honest missing states.

### FM-0017 — Development constraints analysis

- **Priority:** Medium
- **Status:** Backlog
- **Description:** Surface development constraints such as setbacks, FAR, and height limits that bound what can likely be built.
- **Dependencies:** FM-0016
- **Acceptance Criteria:**
  - Setback constraints are surfaced.
  - FAR constraints are surfaced.
  - Height limit constraints are surfaced.

---

## Milestone 4: Financial Intelligence

### FM-0018 — Deterministic financial calculation engine

- **Priority:** High
- **Status:** Backlog
- **Description:** Build a testable, traceable core financial calculation engine, kept separate from presentation.
- **Dependencies:** FM-0011
- **Acceptance Criteria:**
  - Core financial calculations are implemented separately from UI/presentation code.
  - Calculations are covered by automated tests.
  - Calculation outputs are traceable to their inputs.

### FM-0019 — Financial Snapshot and scenario analysis

- **Priority:** Medium
- **Status:** Backlog
- **Description:** Build a Financial Snapshot UI surfacing inputs, methodology, output, and sensitivity for a property's financial viability, including scenario analysis.
- **Dependencies:** FM-0018
- **Acceptance Criteria:**
  - The Financial Snapshot displays input assumptions.
  - The Financial Snapshot displays methodology.
  - The Financial Snapshot displays output and sensitivity.
  - Scenario analysis is supported.

---

## Milestone 5: AI Copilot

### FM-0020 — AI Recommendation module

- **Priority:** High
- **Status:** Backlog
- **Description:** Build an explainable AI Recommendation module that synthesizes facts, calculations, and uncertainty into a pursue/don't-pursue recommendation, citing supporting data.
- **Dependencies:** FM-0017, FM-0019
- **Acceptance Criteria:**
  - The module produces a pursue/don't-pursue recommendation.
  - The recommendation cites supporting data.
  - The recommendation explainably synthesizes facts, calculations, and uncertainty.
