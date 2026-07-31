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
- **Status:** In Progress
- **Description:** Copy the Founder Pack's governing docs — `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI.md`, and `.cursor/rules/formetrix.mdc` — into this repository so they are version-controlled next to the code that implements them, instead of living only in a separate reference directory. Per the Founder's Repository Root Rule (2026-07-30, see ADR-0016), `platform/` is now the sole canonical repository — this ticket is what makes that true for the documents that previously lived only in the Founder Pack.
- **Dependencies:** None
- **Acceptance Criteria:**
  - `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/UI.md` exist in the platform repository. — Met, content verified to match the source exactly.
  - `.cursor/rules/formetrix.mdc` exists in the platform repository. — Met.
  - The imported files are committed to version control in this repository. — Not yet met; `docs/` and `.cursor/` are present but untracked (`git status`).

### FM-0003 — Commit and push the Next.js application foundation

- **Priority:** High
- **Status:** In Progress
- **Description:** Commit and push the scaffolded App Router foundation — layout, theming, error boundaries, and Supabase/Mapbox integration points — which has been verified locally (lint, typecheck, build, and dev smoke test all pass). Committed locally as `7e0db87` ("FM-0001: Initialize Formetrix foundation"); not yet pushed to GitHub, and further work has landed on top of that commit since (FM-0021).
- **Dependencies:** None
- **Acceptance Criteria:**
  - The App Router foundation (layout, theming, error boundaries, Supabase/Mapbox integration points) is committed to git. — Met (commit `7e0db87`).
  - The commit is pushed to GitHub. — Not yet met; local `main` is ahead of `origin/main` by at least one commit.
  - `npm run lint`, `npm run typecheck`, and `npm run build` pass on the pushed state. — Not yet verifiable until pushed.

### FM-0004 — Set up continuous integration

- **Priority:** Medium
- **Status:** Planned
- **Description:** Add a GitHub Actions workflow that runs `npm run lint`, `npm run typecheck`, and `npm run build` on every pull request, per FORMETRIX.md engineering standards.
- **Dependencies:** FM-0003 — not yet Completed; this ticket can be authored and tested independently, but the workflow only has something to run against once FM-0003's foundation is on GitHub, so it stays Planned rather than In Progress until FM-0003 merges.
- **Acceptance Criteria:**
  - A GitHub Actions workflow file exists that triggers on pull requests.
  - The workflow runs `npm run lint`, `npm run typecheck`, and `npm run build`.
  - A pull request with a failing lint, typecheck, or build step is reported as failing by the workflow.

### FM-0005 — Provision the Supabase project and wire environment variables

- **Priority:** High
- **Status:** Planned
- **Description:** Create the real Supabase project, generate real API keys, and fill in `.env.local` per `.env.example`. This is connection setup only — no schema or auth logic.
- **Dependencies:** FM-0003 — not yet Completed; provisioning the Supabase project itself doesn't require the foundation to be committed first, but wiring its keys into this codebase does, so this stays Planned rather than In Progress until FM-0003 merges.
- **Acceptance Criteria:**
  - A Supabase project is created.
  - Real API keys are generated for the project.
  - `.env.local` is filled in per `.env.example`.
  - No database schema or authentication logic is added as part of this ticket.

### FM-0006 — Connect Vercel deployment for the platform repository

- **Priority:** Medium
- **Status:** Planned
- **Description:** Wire the GitHub repository to a Vercel project so that approved branches deploy automatically.
- **Dependencies:** FM-0003 — not yet Completed; connecting Vercel to the repository can be done in parallel, but the first real deploy requires FM-0003's foundation to be on GitHub, so this stays Planned rather than In Progress until FM-0003 merges.
- **Acceptance Criteria:**
  - The GitHub repository is linked to a Vercel project.
  - Deploys trigger automatically from approved branches.

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

---

## Milestone 1: Authentication

### FM-0007 — Design initial database schema: users, organizations

- **Priority:** High
- **Status:** Backlog
- **Description:** Design the baseline relational schema for user accounts and organizations/workspaces, with migrations.
- **Dependencies:** FM-0005
- **Acceptance Criteria:**
  - A schema for users exists.
  - A schema for organizations/workspaces exists.
  - Migrations are provided for the schema.

### FM-0008 — Implement Supabase Auth sign-up and sign-in flows

- **Priority:** High
- **Status:** Backlog
- **Description:** Implement real authentication UI and logic for sign-up and sign-in using `@supabase/ssr`, replacing the current `AuthProvider` placeholder.
- **Dependencies:** FM-0007
- **Acceptance Criteria:**
  - Sign-up flow is implemented using `@supabase/ssr`.
  - Sign-in flow is implemented using `@supabase/ssr`.
  - The placeholder `AuthProvider` is replaced by the real implementation.

### FM-0009 — Implement session refresh middleware and protected routes

- **Priority:** High
- **Status:** Backlog
- **Description:** Implement Next.js middleware that keeps Supabase sessions fresh and gates authenticated routes.
- **Dependencies:** FM-0008
- **Acceptance Criteria:**
  - Middleware refreshes Supabase sessions.
  - Protected routes are inaccessible to unauthenticated users.
  - Authenticated users can access gated routes.

### FM-0010 — Implement organization/workspace membership model

- **Priority:** Medium
- **Status:** Backlog
- **Description:** Implement Row Level Security policies that scope data access to the signed-in user's organization.
- **Dependencies:** FM-0007
- **Acceptance Criteria:**
  - Row Level Security policies exist that scope data access by organization.
  - A user can access data only within their own organization.

---

## Milestone 2: Property Workspace

### FM-0011 — Property and parcel database schema on PostGIS

- **Priority:** High
- **Status:** Backlog
- **Description:** Design a spatial schema for properties/parcels, keeping source geometry separate from derived development geometry.
- **Dependencies:** FM-0007
- **Acceptance Criteria:**
  - A PostGIS-based schema exists for properties/parcels.
  - Source geometry is stored separately from derived development geometry.

### FM-0012 — Regrid API integration for parcel data ingestion

- **Priority:** High
- **Status:** Backlog
- **Description:** Build a wrapped integration that pulls parcel data from Regrid and preserves source attribution and retrieval date.
- **Dependencies:** FM-0011
- **Acceptance Criteria:**
  - Parcel data can be pulled from Regrid through a wrapped integration.
  - Source attribution is preserved for ingested parcel data.
  - Retrieval date is preserved for ingested parcel data.

### FM-0013 — Property Search

- **Priority:** High
- **Status:** Backlog
- **Description:** Build a search UI that lets a developer find a property/parcel by address or location.
- **Dependencies:** FM-0012
- **Acceptance Criteria:**
  - A user can search for a property/parcel by address.
  - A user can search for a property/parcel by location.

### FM-0014 — Property Dashboard

- **Priority:** High
- **Status:** Backlog
- **Description:** Build the primary property overview screen showing what the property is, where it is, and what data is available.
- **Dependencies:** FM-0013
- **Acceptance Criteria:**
  - The dashboard shows what the property is.
  - The dashboard shows where the property is.
  - The dashboard shows what data is available for the property.

### FM-0015 — Mapbox parcel visualization

- **Priority:** Medium
- **Status:** Backlog
- **Description:** Install `mapbox-gl` — deliberately deferred during the foundation pass — and render parcel geometry as the first real map feature, without implying false precision.
- **Dependencies:** FM-0011
- **Acceptance Criteria:**
  - `mapbox-gl` is installed.
  - Parcel geometry renders on a map.
  - The map visualization does not imply a level of precision the underlying data does not support.

---

## Milestone 3: Development Intelligence

### FM-0016 — Zoning data model and Zoning Overview

- **Priority:** High
- **Status:** Backlog
- **Description:** Store zoning classification per parcel and surface it in a Zoning Overview.
- **Dependencies:** FM-0011
- **Acceptance Criteria:**
  - Zoning classification is stored per parcel.
  - A Zoning Overview surfaces the stored classification to the user.

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
