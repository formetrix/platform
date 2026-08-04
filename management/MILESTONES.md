# Milestones

## About This Document

### Purpose

This document tracks Formetrix's major product milestones, from initial repository setup through the full Version 1 scope defined in FORMETRIX.md (Section 4): helping a real estate developer decide whether to pursue a property. It exists to give humans and AI engineering agents one authoritative, ordered view of what has shipped, what is in progress, and what remains, so that day-to-day work stays traceable to the product's actual state and aligned with the guiding question in FORMETRIX.md (Section 29).

### How to Maintain This Document

- Both humans and AI engineering agents are responsible for keeping this file current. Any agent that completes, starts, or blocks a deliverable tied to a milestone must update that milestone's entry as part of the same change, not in a later pass.
- Update a milestone's **Status** and **Completion %** the moment its underlying deliverables change state, not retroactively at the end of a work session or sprint.
- **Completion %** must reflect deliverables actually completed, not estimated effort or time elapsed.
- Milestones are not reordered, renumbered, or renamed once defined. If scope for a milestone changes, revise its Objective or Deliverables and note the change; do not silently rewrite history.
- New milestones are appended to the end of the ordered list. Milestone numbers are never reused.
- Every deliverable bullet should reference the ticket ID it is tracked under in TICKETS.md (for example, `(FM-0001)`). If a deliverable does not yet have a ticket, state that explicitly rather than leaving it unreferenced.
- **Status** must be one of: `Not Started`, `In Progress`, `Blocked`, `Complete`.
- Changes to this file are committed to GitHub with a clear commit message, consistent with the Git Workflow in FORMETRIX.md (Section 22).

### Structure

Each milestone entry uses the following fields, in this order:

- **Heading** — `## Milestone [N]: [Name]`
- **Objective** — one to two sentences describing the outcome this milestone delivers for the primary user.
- **Deliverables** — bulleted list of the concrete artifacts and tickets that make up the milestone.
- **Status** — one of `Not Started`, `In Progress`, `Blocked`, `Complete`.
- **Completion %** — integer from 0 to 100, reflecting deliverables actually completed.

**Template:**

```
## Milestone [N]: [Milestone Name]

**Objective:** [One to two sentences describing what this milestone enables for the user.]

**Deliverables:**
- [Describe deliverable] ([FM-XXXX])
- [Describe deliverable] ([FM-XXXX])

**Status:** [Not Started | In Progress | Blocked | Complete]

**Completion %:** [0-100]
```

---

## Milestone 0: Repository Foundation

**Objective:** Establish the technical and organizational foundation the product will be built on — repository, constitution, engineering standards, application shell, and the project management system itself — before any business feature work begins.

**Deliverables:**

- Repository initialized on GitHub (Formetrix/platform)
- FORMETRIX.md adopted as the binding project constitution (ADR-0009)
- Founder Pack governing docs (`docs/PRODUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md`, `UI.md`) and `.cursor/rules/formetrix.mdc` imported into this repository and committed (FM-0002)
- Next.js 15 application foundation scaffolded, verified, committed, and pushed to `origin/main` as `92d0b03` (FM-0003)
- Formetrix Project Management System created (this directory) (FM-0001)
- Supabase application foundation configured: browser/server/middleware clients, config validation, manual health check — not connected to a live project (FM-0021)
- `platform/` established as the sole canonical repository — no external directory (including the former Founder Pack reference folder) is an active project reference going forward (ADR-0016)
- Project Control Dashboard architecture designed (FM-0024) and MVP built at `/internal/project-dashboard` (FM-0025), populated from real `management/data/*.json`
- Formetrix brand system and reusable interactive detail-drawer system applied to the dashboard (FM-0026)
- Dashboard `DashboardDetailProvider` runtime error fixed by consolidating to a single client-boundary shell; verified stable via production build and repeated fresh dev requests (FM-0026A)
- Current Work focus and Project Codes legend added to the dashboard (FM-0027)
- Dashboard Intelligence Automation MVP: deterministic `dashboard:update`/`dashboard:check`/`dashboard:health` scripts, project-health signals, and a Definition of Done (FM-0028)
- Remaining:
  - CI pipeline (FM-0004)
  - Supabase project provisioned (FM-0005)
  - Vercel deployment connected (FM-0006)
  - Committing this milestone's own most recent work (FM-0024 through FM-0028) — verified locally, not yet committed

**Status:** In Progress

**Completion %:** 80 — **computed**, not hand-set, per `docs/MISSION_CONTROL.md` §4 (completed ÷ total scoped tickets): 12 of the 15 tickets under this milestone are complete (`management/data/project-status.json` is the live source, recomputed by `npm run dashboard:update`). Do not edit this figure by hand; recompute from `management/data/tickets.json` instead.

---

## Milestone 1: Authentication

**Objective:** Allow a developer to create an account, sign in, and access a workspace, with sessions and data properly scoped per organization.

**Deliverables:**

- Initial database schema: users, organizations (FM-0007)
- Authentication & organization architecture (`docs/AUTH_FLOW.md`) (FM-0008)
- Session refresh middleware and protected routes (`src/middleware.ts`) (FM-0009)
- Organization/workspace membership model with RLS (`supabase/migrations`) (FM-0010)
- Production authentication UI and first-login organization setup (FM-0006A)

**Status:** Complete

**Completion %:** 100

---

## Milestone 2: Property Workspace

**Objective:** Let a developer search for and open a property, seeing verified parcel data and its location on a map — the entry point to the acquisition decision.

**Deliverables:**

- Property/parcel database schema on PostGIS (`supabase/migrations`) (FM-0011)
- Regrid integration for parcel data ingestion (FM-0012)
- Property Search (FM-0013)
- Property Dashboard (FM-0014)
- Mapbox parcel visualization (FM-0015) — Completed

**Status:** Not Started

**Completion %:** 100 (computed from scoped tickets; milestone status remains until Founder closes M2)

---

## Milestone 3: Development Intelligence

**Objective:** Surface what can likely be built on a property — zoning classification and development constraints — so a developer can gauge feasibility.

**Deliverables:**

- Zoning data model and Zoning Overview (FM-0016) — Completed
- Development constraints analysis: setbacks, FAR, height limits (FM-0017)

**Status:** Not Started

**Completion %:** 0

---

## Milestone 4: Financial Intelligence

**Objective:** Give a developer a traceable, assumption-explicit view of whether a property is financially viable.

**Deliverables:**

- Deterministic, testable financial calculation engine (FM-0018)
- Financial Snapshot UI with scenario/sensitivity analysis (FM-0019)

**Status:** Not Started

**Completion %:** 0

---

## Milestone 5: AI Copilot

**Objective:** Synthesize verified facts, calculations, and known unknowns into an explainable recommendation on whether to pursue a property.

**Deliverables:**

- AI Recommendation module with explicit fact/assumption/uncertainty separation and source citation (FM-0020)

**Status:** Not Started

**Completion %:** 0
