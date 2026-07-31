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
- Founder Pack reference materials established as source of product/architecture/database/UI docs (import into this repo tracked as FM-0002)
- Next.js 15 application foundation scaffolded and verified: routing, theming, error handling, Supabase/Mapbox integration points, basic auth structure placeholder
- Formetrix Project Management System created (this directory) (FM-0001)
- Remaining:
  - Import remaining Founder Pack docs into this repository (FM-0002)
  - Commit foundation work to git (FM-0003)
  - CI pipeline (FM-0004)
  - Supabase project provisioned (FM-0005)
  - Vercel deployment connected (FM-0006)

**Status:** In Progress

**Completion %:** 70 — basis: the constitution is adopted, the application scaffold is built and verified (lint/typecheck/build/dev smoke test all pass), and the management system itself is complete; what remains (FM-0002–FM-0006) is operational setup (import, commit, CI, Supabase, Vercel) rather than unbuilt foundation work. This is a qualitative judgment about how much of the milestone's substance is done, not a raw count of the 6 tickets tracked under it (1 of 6 Completed).

---

## Milestone 1: Authentication

**Objective:** Allow a developer to create an account, sign in, and access a workspace, with sessions and data properly scoped per organization.

**Deliverables:**
- Initial database schema: users, organizations (FM-0007)
- Supabase Auth sign-up / sign-in flows (FM-0008)
- Session refresh middleware and protected routes (FM-0009)
- Organization/workspace membership model with Row Level Security (FM-0010)

**Status:** Not Started

**Completion %:** 0

---

## Milestone 2: Property Workspace

**Objective:** Let a developer search for and open a property, seeing verified parcel data and its location on a map — the entry point to the acquisition decision.

**Deliverables:**
- Property/parcel database schema on PostGIS (FM-0011)
- Regrid integration for parcel data ingestion (FM-0012)
- Property Search (FM-0013)
- Property Dashboard (FM-0014)
- Mapbox parcel visualization (FM-0015)

**Status:** Not Started

**Completion %:** 0

---

## Milestone 3: Development Intelligence

**Objective:** Surface what can likely be built on a property — zoning classification and development constraints — so a developer can gauge feasibility.

**Deliverables:**
- Zoning data model and Zoning Overview (FM-0016)
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
