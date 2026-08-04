# Architecture Decision Log

## About This Document

### Purpose

This document is the Architecture Decision Log (ADR log) for Formetrix. It records the significant product, architecture, and engineering decisions made during the life of the project, along with the reasoning behind each one. FORMETRIX.md (Section 25, "Documentation") requires that decisions affecting product scope, architecture, database design, security, external integrations, financial methodology, spatial methodology, or AI behavior be documented. This log is where that documentation lives, so that any human or AI contributor can understand not just what was decided, but why, without relying on memory or chat history.

### How to Maintain This Document

- Both human contributors and AI engineering agents are responsible for keeping this log current. Any contributor who makes or implements a decision in scope (see Purpose above) must add an entry.
- Add a new entry the moment a decision is made, not retroactively and not batched at the end of a work session. If a decision is still under discussion, record it with a status of `Proposed` rather than waiting until it is final.
- Entries are append-only and chronological by Decision ID. Do not renumber, reorder, delete, or rewrite the substance of an existing entry. If a decision changes, add a new entry that supersedes the old one, and update the old entry's `Status` to `Superseded` with a pointer to the new Decision ID.
- `Status` must be one of: `Proposed`, `Accepted`, `Superseded`, or `Deprecated`.
- Every entry must trace back to a real reason. Do not record a decision without the reasoning that produced it, and do not present an assumption as if it were settled fact — this mirrors the fact-versus-assumption discipline FORMETRIX.md requires of the product itself.
- Use the exact field order and labels defined in Structure below. Copy the Template block for new entries and replace every placeholder; do not leave placeholder text in a merged entry.

### Structure

Each entry uses the following fields, in this order:

- **Decision ID** — sequential identifier in the form `ADR-XXXX`.
- **Date** — the date the decision was made, in `YYYY-MM-DD` format.
- **Status** — one of `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- **Decision** — a single-sentence statement of what was decided.
- **Reason** — why the decision was made, including the tradeoffs that led to it.
- **Alternatives Considered** — the other options that were evaluated, as a bulleted list.
- **Impact** — what the decision changes or constrains going forward, in the codebase or the product.

**Template**

```markdown
### ADR-XXXX

- **Date:** YYYY-MM-DD
- **Status:** [Proposed | Accepted | Superseded | Deprecated]
- **Decision:** [One sentence describing what was decided.]
- **Reason:** [Why this decision was made.]
- **Alternatives Considered:**
  - [Alternative one]
  - [Alternative two]
- **Impact:** [What this decision changes or constrains going forward.]
```

---

## Decisions

### ADR-0001

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use Next.js 15 with the App Router as the application framework.
- **Reason:** Required by FORMETRIX.md. Provides server components, file-based routing, and a mature deployment story on Vercel; lets business logic run server-side by default, where secrets and privileged operations belong.
- **Alternatives Considered:**
  - Remix
  - A plain Vite + React single-page app with a separate API server
- **Impact:** All application routes live under `src/app/`; server-only work defaults to Server Components/Route Handlers rather than the client.

### ADR-0002

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use Supabase for authentication, database hosting, and storage.
- **Reason:** Required by FORMETRIX.md. Bundles managed Postgres, auth, storage, and Row Level Security in one platform, reducing the number of vendors a small team has to operate.
- **Alternatives Considered:**
  - Firebase
  - A self-hosted Postgres instance with a hand-rolled auth service
- **Impact:** Auth, schema, and RLS design all follow Supabase's model; `src/lib/supabase/` is the only code that talks to the Supabase SDK directly.

### ADR-0003

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use PostgreSQL (via Supabase) as the system of record for relational data.
- **Reason:** Required by FORMETRIX.md. Mature, strongly consistent, and the natural pairing with PostGIS for this product's spatial workloads.
- **Alternatives Considered:**
  - MySQL
  - A document database (MongoDB)
- **Impact:** Schema work follows normalized relational design; migrations are the only sanctioned way to change schema.

### ADR-0004

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use the PostGIS extension for all parcel and property geometry.
- **Reason:** Required by FORMETRIX.md. Parcel boundaries, zoning overlays, and derived development geometry are inherently spatial; PostGIS is the standard, well-supported extension on Postgres.
- **Alternatives Considered:**
  - A separate dedicated GIS database/service outside Postgres
  - Storing geometry as unstructured JSON and computing spatial relationships in application code
- **Impact:** Source parcel geometry and derived development geometry are stored separately and never overwritten; spatial queries run in the database, not the application layer.

### ADR-0005

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use Mapbox for map rendering and spatial visualization.
- **Reason:** Required by FORMETRIX.md. Strong vector-tile performance and styling control for a professional, minimal map experience, with a straightforward integration path.
- **Alternatives Considered:**
  - Google Maps Platform
  - Leaflet with OpenStreetMap tiles
- **Impact:** `src/lib/mapbox/` is the sanctioned integration point; `mapbox-gl` is installed and used for parcel visualization (FM-0015 / ADR-0038).

### ADR-0006

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use Regrid as the primary external source for parcel data.
- **Reason:** Required by FORMETRIX.md. Provides normalized, nationwide parcel data with consistent attribution, avoiding a patchwork of county-by-county assessor integrations for V1.
- **Alternatives Considered:**
  - Scraping individual county assessor sites
  - Other commercial parcel/property data vendors (e.g. ATTOM, Reonomy)
- **Impact:** Parcel ingestion will be wrapped behind an internal interface so Regrid can be supplemented or replaced later without touching feature code; source attribution and retrieval date are preserved on import.

### ADR-0007

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Use GitHub as the source-control platform.
- **Reason:** Required by FORMETRIX.md. Ubiquitous, integrates directly with Vercel deployments, and matches the branch-PR-review-merge workflow FORMETRIX.md prescribes.
- **Alternatives Considered:**
  - GitLab
  - Bitbucket
- **Impact:** All code changes flow through GitHub pull requests; this repository's remote is github.com/Formetrix/platform.

### ADR-0008

- **Date:** 2026-07-29
- **Status:** Accepted
- **Decision:** Deploy the Next.js application to Vercel.
- **Reason:** Required by FORMETRIX.md. Built by the maintainers of Next.js, so framework features are supported with minimal configuration; deploys directly from approved GitHub branches.
- **Alternatives Considered:**
  - Self-hosted Node server (VM or container platform)
  - Netlify
- **Impact:** Production deployment is not yet connected — see FM-0006.

### ADR-0009

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Treat FORMETRIX.md as the binding project constitution for all product, architecture, and engineering decisions, for both human and AI contributors.
- **Reason:** A company built for the long term needs a single, durable statement of scope and standards that survives any individual conversation or contributor.
- **Alternatives Considered:**
  - Distributed, ad hoc conventions decided per pull request
  - Scope and standards living only in a founder's memory or chat history
- **Impact:** Every decision in this log and every ticket in TICKETS.md is expected to trace back to a section of FORMETRIX.md; conflicts are resolved in its favor.

### ADR-0010

- **Date:** 2026-07-30
- **Status:** Superseded by ADR-0037
- **Decision:** Name the Supabase public API key environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Reason:** Supabase's newer project dashboards and official Next.js example (`vercel/next.js/examples/with-supabase`, checked against the `canary` branch while building FM-0021) have moved to calling this a "publishable" key rather than an "anon" key. Both name the same kind of key: public, safe for the browser, constrained by Row Level Security rather than secrecy. `ANON_KEY` was kept because it was explicitly specified by name in the ticket that requested this configuration, and it remains a fully valid, functional name for this key on Supabase projects that issue one.
- **Alternatives Considered:**
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, matching Supabase's current default naming for newly-created projects
- **Impact:** Superseded during FM-0005: prefer publishable with centralized anon fallback (ADR-0037).

### ADR-0011

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Property, not Parcel, is the primary Version 1 workspace entity — the subject of "should I pursue this property?" A Parcel is a data record Property references, not the workspace itself.
- **Reason:** FORMETRIX.md §1's guiding question is asked about a property, not a parcel; every core module in docs/PRODUCT.md (Search, Dashboard, Parcel Details, Zoning Overview, Development Constraints, Financial Snapshot, AI Recommendation) is scoped to a property. This is the load-bearing distinction the rest of `docs/DOMAIN_MODEL.md` depends on.
- **Alternatives Considered:**
  - Making Parcel the primary workspace entity, with Property as a secondary annotation layer
- **Impact:** All future schema, API, and UI design for Milestone 2 (FM-0011 onward) should treat Property as the entity a user creates and works within, with Parcel(s) attached to it — not the reverse.

### ADR-0012

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Model Property↔Parcel as many-to-many (a Property may reference multiple Parcels; a Parcel may be referenced by multiple Properties), with Parcel data potentially shared/cacheable across Organizations while Property records — and the fact that a given Organization is evaluating a given Parcel — remain strictly Organization-scoped and private.
- **Reason:** Real acquisition opportunities often span multiple legal parcels (assemblage), and a Parcel is externally-sourced land data with no inherent exclusivity to one evaluator. Two Organizations could plausibly evaluate the same physical land independently; nothing about the land record should leak that a competitor is also looking at it.
- **Alternatives Considered:**
  - One-to-many Property→Parcel only (would break for multi-parcel assemblages)
  - Fully siloing Parcel data per Organization, with no sharing/caching (would mean redundant Regrid calls and storage for the same physical land across every Organization that evaluates it)
- **Impact:** Future schema design (FM-0011) should keep Parcel data structurally separate from Property-level access control, so Parcel facts can be shared/cached without exposing which Organizations reference them.

### ADR-0013

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Project is not part of the Version 1 domain model.
- **Reason:** No source document (FORMETRIX.md, docs/PRODUCT.md, docs/ROADMAP.md, docs/DATABASE.md) uses "Project" as a business concept anywhere. The most plausible meaning offered — "an active development effort after acquisition" — overlaps FORMETRIX.md §5's explicitly excluded territory (construction management, property management). Property already serves as the Version 1 workspace (ADR-0011).
- **Alternatives Considered:**
  - Modeling Project now as a placeholder for future post-acquisition tracking
- **Impact:** No Project entity appears in `docs/DOMAIN_MODEL.md`'s Version 1 vocabulary. If post-acquisition execution tracking is built later, it should be scoped and named deliberately at that time.

### ADR-0014

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Harmonize FORMETRIX.md's two fact/assumption/calculation taxonomies (§6's six categories and §16's overlapping-but-differently-worded list) into one six-category model — verified fact, user-provided assumption, Formetrix calculation, Formetrix interpretation, estimated value, uncertain/missing information — used consistently in `docs/DOMAIN_MODEL.md` and recommended for consistent use in future schema, API, and UI work.
- **Reason:** FORMETRIX.md states the same underlying requirement (distinguish fact from assumption from calculation from interpretation) twice, in slightly different words, in two different sections. Left unreconciled, future tickets would each have to independently decide which wording to follow, risking two incompatible taxonomies shipping in different parts of the codebase.
- **Alternatives Considered:**
  - Leaving both wordings as-is and letting each future ticket interpret which applies
- **Impact:** Any future entity or field that expresses confidence/provenance (Assumption, Constraint, Result, Recommendation) should use this six-category model rather than inventing its own scale.

### ADR-0015

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** Adopt Founder Decisions FD-0001 through FD-0009 (`management/FOUNDER_DECISIONS.md`) into `docs/DOMAIN_MODEL.md`. Where they overlap with ADR-0011–ADR-0013, they confirm those decisions rather than superseding them (none of ADR-0011–ADR-0013's substance changed — see `management/FOUNDER_DECISIONS.md` for the product reasoning). Where a founder decision has a specific architectural consequence beyond confirming existing ADRs, it is recorded below rather than duplicating the founder decision's text.
- **Reason:** Product decisions and their architectural consequences are different kinds of record — `management/FOUNDER_DECISIONS.md` owns why the product works this way, this log owns what it requires of the codebase. Bridging them with one entry avoids either duplicating the founder decisions' full text here, or leaving their architectural implications untracked.
- **Alternatives Considered:**
  - Annotating each of ADR-0011–ADR-0014 individually with a footnote (rejected — this document's own rule against rewriting an existing entry's substance argues for a new entry instead)
  - Duplicating the full founder-decision text into this log (rejected — `management/FOUNDER_DECISIONS.md` explicitly forbids this)
- **Impact:** Property's future schema (Milestone 1/2, FM-0007/FM-0011) must include a status/lifecycle field sized for the full lifecycle FD-0004 documents (Discovered → Archived in Version 1; Planning → Completed deferred), even though only the Version 1 statuses are implemented now — this is the one founder decision (FD-0004) with an architectural consequence not already covered by ADR-0011–ADR-0013. All other FD-0001–FD-0009 content confirms existing architecture without changing it.

### ADR-0016

- **Date:** 2026-07-30
- **Status:** Accepted
- **Decision:** `C:\Users\shule\Documents\Soft Projects\Formetrix\Code\platform` (this repository) is the sole canonical Formetrix repository. Every sibling or external directory — including the `Formetrix-Founder-Pack` directory previously used as a reference source for `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI.md`, and `.cursor/rules/formetrix.mdc` — is a historical snapshot only, not an active project reference. No future task reads from, writes to, or synchronizes with any directory outside this repository, without explicit Founder instruction for that specific action.
- **Reason:** Founder directive (2026-07-30): with the governing documents now copied into `docs/` and `.cursor/` (FM-0002), there is no longer a reason for engineering work — human or AI — to reach outside the repository for project context; doing so risks drift between the "reference" copy and the real one, and made it easy for AI agents to cite paths (`docs/PRODUCT.md`, etc.) that didn't actually exist in the repository yet.
- **Alternatives Considered:**
  - Keeping the Founder Pack directory as a live reference indefinitely, treating `platform/docs/` as a synced copy (rejected — two sources of truth for the same content is exactly the drift risk this decision exists to close off)
- **Impact:** `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI.md`, and `.cursor/rules/formetrix.mdc` are now read directly from this repository, not the Founder Pack — see FM-0002. Any future gap between what a ticket references and what actually exists in this repository should be reported, not silently patched by reading an external folder.

### ADR-0017

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** In the project-dashboard data model (`docs/PROJECT_DASHBOARD_ARCHITECTURE.md`), a ticket's `milestoneId` is the authoritative link to its milestone; a milestone's `ticketIds` array is derived — recomputed from scanning tickets, never independently hand-set.
- **Reason:** A bidirectional link that both sides can independently edit is exactly the kind of two-sources-of-truth-for-one-fact problem this project has repeatedly had to catch and fix by hand (FM-0021's missing file, FM-0022's milestone-name mismatch). Picking one authoritative direction and deriving the other removes the possibility of the two disagreeing.
- **Alternatives Considered:**
  - Making both fields independently authored and validating they agree (rejected — validation catches drift after it happens; a single-writer direction prevents it from being possible)
- **Impact:** Any future dashboard/validation tooling must compute `milestones.json`'s `ticketIds` from `tickets.json`, never accept it as direct input.

### ADR-0018

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** `management/data/decisions.json` holds both architecture decisions (ADR-XXXX) and founder decisions (FD-XXXX) in one file, distinguished by a discriminated `kind` field, rather than two separate JSON files.
- **Reason:** The ticket that requested this schema named one `decisions.json` file. Splitting it into two would contradict that without a strong reason; merging the two Markdown documents' _governance_ distinction (who may approve what) into the same file is safe as long as the `kind` field and its associated validation rules keep the two conceptually separate at read time.
- **Alternatives Considered:**
  - Two files (`architecture-decisions.json`, `founder-decisions.json`), mirroring the two Markdown documents exactly (rejected — not what was requested, and the single-file version loses nothing given the `kind` discriminator)
- **Impact:** Any consumer of `decisions.json` must branch on `kind` before assuming which fields are present — `alternativesConsidered`/`impact` only exist for `kind: architecture`; `productImpact`/`deferredImplications` only for `kind: founder`.

### ADR-0019

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** `management/data/activity.json` is an append-only, immutable event log. Entries are never edited or deleted after creation; corrections are made via a new corrective entry.
- **Reason:** This is the same discipline `management/DECISIONS.md` and `management/FOUNDER_DECISIONS.md` already enforce for their own entries ("do not renumber, reorder, delete, or rewrite the substance of an existing entry"), applied to a log instead of a decision register — an audit trail that can be silently rewritten isn't an audit trail.
- **Alternatives Considered:**
  - Allowing in-place correction of activity entries for minor errors (rejected — even a "minor" correction to a log entry undermines the guarantee that the log reflects what was recorded at the time)
- **Impact:** The future validation script (`docs/PROJECT_DASHBOARD_ARCHITECTURE.md` §10) must treat any change to an existing `activity.json` entry's content as a hard validation failure, not a warning.

### ADR-0020

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** In light mode, `--primary`/`--info` resolve to `#0E7490` (a darkened, same-hue variant of the official Electric Cyan `#00D4FF`), not the literal brand hex. The literal `#00D4FF` is preserved as `--primary-accent` for low-opacity fills/tints where contrast math doesn't apply. Dark mode uses the literal brand hex directly.
- **Reason:** Electric Cyan as text or a thin UI stroke on white/Light Gray measures roughly 1.8:1 contrast — far below the 3:1 WCAG AA minimum for UI components, let alone 4.5:1 for text. Shipping the literal hex as light-mode `--primary` would have satisfied the brand brief's letter while failing FM-0026's own accessibility requirement (§14: "sufficient color contrast"). Dark mode needs no adjustment — the same hex reads clearly against Deep Navy, which is the primary branded presentation the brief calls for.
- **Alternatives Considered:**
  - Using the literal `#00D4FF` unconditionally in both themes (rejected — fails contrast in light mode)
  - Using a completely different color family for light-mode interactivity (rejected — breaks brand continuity between themes; a lightness adjustment preserves the hue identity, a hue change doesn't)
- **Impact:** `docs/DESIGN_SYSTEM.md` §2 documents this as the canonical explanation. Any future component that reads "use brand cyan" should use the `--primary`/`--info` tokens (theme-aware) rather than hardcoding `#00D4FF`, except for the specific low-opacity-fill case `--primary-accent` exists for.

### ADR-0021

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** The dashboard's detail-drawer focus trap (`components/details/use-focus-trap.ts`) is hand-rolled — a ~50-line hook — rather than adding a focus-trap dependency (e.g. `focus-trap-react`).
- **Reason:** The full requirement (trap Tab/Shift+Tab within one panel, focus in on open, restore on close, Escape closes) is small, well-understood, and fully covered by native DOM APIs (`querySelectorAll` for focusable elements, a `keydown` listener). FORMETRIX.md §21 asks that a dependency earn its place over an equivalent amount of plain code; one panel type does not.
- **Alternatives Considered:**
  - `focus-trap-react` or a similar library (rejected — meaningfully more surface area and a new dependency for a requirement fully met by ~50 lines already written and tested against this ticket's manual interaction checklist)
- **Impact:** If the dashboard later needs nested drawers, multiple simultaneously-trapped regions, or other edge cases a library handles out of the box, revisit this decision rather than extending the hand-rolled version indefinitely.

### ADR-0022

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** `/internal/project-dashboard` has exactly one server→client boundary: `page.tsx` (a Server Component) loads and validates data, then renders a single Client Component, `ProjectDashboardShell`, which itself renders `DashboardDetailProvider` and every section component from within its own module. `page.tsx` no longer independently authors JSX for client section components and passes that mixed tree as `children` into another Client Component.
- **Reason:** FM-0026A reported `useDashboardDetail must be used within a DashboardDetailProvider` at runtime, despite the tree being structurally wrapped correctly and server-rendering successfully (verified via `curl` during FM-0026 — the crash was not visible in SSR output). Passing Server-Component-authored JSX (mixing nine independent "use client" components) as `children` into another Client Component is valid Next.js, but it is a more advanced composition pattern than necessary here, and is exactly the shape that's fragile under React Fast Refresh in dev mode — editing any one of those nine files independently can leave a stale module reference for the Context. Collapsing to one client boundary removes that failure mode entirely rather than working around a symptom of it.
- **Alternatives Considered:**
  - Leaving the multi-boundary structure and adding a defensive fallback/null-check in `useDashboardDetail()` (rejected — FM-0026A explicitly ruled this out: "do not add a fake fallback context value," "do not modify the hook so it silently works outside the provider" — masking the symptom instead of removing the structural fragility)
  - Restarting the dev server as the fix (rejected — would not address a real, if dev-mode-specific, class of fragility; the next multi-file edit session could reproduce it)
- **Impact:** Any future dashboard section component should be added inside `ProjectDashboardShell`, not authored independently by `page.tsx`. If the dashboard is later split across multiple routes/layouts, each one needing `useDashboardDetail()` should get its own single shell component following this same pattern, not a shared provider spanning multiple independent client boundaries.

### ADR-0023

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Add `tsx` as a dev-only dependency to run repository-management TypeScript scripts (`scripts/*.ts`), and make `scripts/update-dashboard-intelligence.ts` the authoritative writer of all calculated dashboard fields.
- **Reason:** The dashboard-intelligence and health scripts must reuse the exact same typed logic the app renders with (`src/features/project-dashboard/lib`), imported via the `@/` tsconfig path alias. Node 24 strips types natively but does not resolve tsconfig path aliases; `tsx` does, and it is dev-only (never enters the client bundle), so it earns its place under FORMETRIX.md §21. Centralizing calculated-field writes in one script is what removes the hand-maintained drift FM-0028 exists to fix.
- **Alternatives Considered:**
  - Native `node --experimental-strip-types` with relative imports (rejected — the shared `src` modules use the `@/` alias, which Node does not resolve)
  - A dependency-free `.mjs` script duplicating the compute/validate logic (rejected — duplicates business logic, violating FORMETRIX.md §11)
  - `ts-node` (heavier, slower startup than `tsx` for this use)
- **Impact:** `package.json` gains a `tsx` devDependency and `dashboard:update`/`dashboard:check`/`dashboard:health` scripts. Calculated dashboard fields must be produced by the intelligence script, never hand-edited.

### ADR-0024

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Milestone completion is computed as completed tickets ÷ total scoped tickets; overall completion is the equal-weighted mean of milestone completion. This supersedes the earlier acceptance-criteria-mean milestone formula in `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` §5.2.
- **Reason:** FM-0028 adopts the simplest defensible baseline — a ticket either is or isn't done — which also matches the "X of Y tickets completed" label already shown under each milestone bar (the criteria-mean did not). Overall keeps §5.3's equal-weighting per milestone rather than a global completed/total, so Milestone 0's large ticket count doesn't dominate and overstate whole-product progress. This resolves architecture §15.1's open question in favor of the simple ratio. Per-ticket progress keeps the acceptance-criteria ratio for in-progress granularity.
- **Alternatives Considered:**
  - Keeping the acceptance-criteria met-ratio mean at the milestone level (rejected — more complex and diverged from the completed/total label)
  - Global completed/total for overall (rejected — Milestone 0's ticket volume dominates)
- **Impact:** `computeMilestoneProgress` changed; `ProgressExplanationDetail` and `docs/MISSION_CONTROL.md` document the formula. Displayed milestone percentages shift to match the completed/total label.

### ADR-0025

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Local project-health signals distinguish `passing`/`failing` from `unknown`/`not_configured`, and never report an unverified integration (GitHub, Vercel, Supabase) as healthy. Command health (lint/typecheck/formatting/build) is recorded from real runs by `scripts/record-validation-health.ts`; git/deployment/supabase health that cannot be verified locally stays `unknown` or `not_configured`.
- **Reason:** FORMETRIX.md §7 forbids presenting uncertain information as confirmed. A dashboard claiming green health for systems it never checked would violate that. Recording only evidence-backed health, and preferring `unknown`/`not_configured` over invented success, keeps Mission Control trustworthy.
- **Alternatives Considered:**
  - Deriving git health from the hand-recorded `repositoryState` (rejected — that is recorded data, not live evidence)
  - Defaulting integrations to healthy until proven otherwise (rejected — fabricates success)
- **Impact:** `project-status.json` gains a `health` block with a fixed set of states; the Mission Control status panel renders them with text labels, never color alone.

### ADR-0026

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** `/property/[id]` uses `generateStaticParams()` (returning every mock property id) with `dynamicParams = false`, so an unknown id is rejected by the router before rendering starts, rather than relying solely on a runtime `notFound()` call inside the layout/page.
- **Reason:** The root-level `src/app/loading.tsx` wraps every route in a streaming Suspense boundary. Requesting `/property/nonexistent` streamed the not-found UI correctly but the HTTP status locked at 200, not 404 — a documented Next.js App Router limitation (calling `notFound()` after a streamed response has begun cannot change the already-sent status code; see github.com/vercel/next.js/issues/76474). Rejecting the id at the router level, before any rendering or streaming begins, has no such boundary to race against. This is also a reasonable fit for FM-0029's scope: the mock property set is small and fully known at build time, so treating it as static is not premature.
- **Alternatives Considered:**
  - Removing or overriding `loading.tsx` for this route segment (rejected — the boundary is created by the root `loading.tsx` around the entire app tree; a child segment cannot opt out of a parent's streaming boundary)
  - Leaving the route fully dynamic and accepting the HTTP 200 on a not-found id (rejected — an investor-facing route returning success for a request that failed is a real correctness defect, not a cosmetic one)
  - Restructuring the component tree to avoid any `async` work before the `notFound()` check (rejected — already true in this code, and does not address the actual cause, which is the parent streaming boundary, not component ordering)
- **Impact:** `/property/[id]` and its 8 sub-routes are prerendered (`● SSG`) for the 3 known mock ids at build time instead of rendered on demand. When real, Supabase-backed properties replace the mock set (post-FM-0029), this must be revisited — either regenerating static params from the live property list on a build/revalidate cadence, or moving the id-validity check earlier in the routing layer (e.g. a `middleware.ts` check) so the same before-render-starts guarantee holds for a dynamic, non-enumerable id space.

### ADR-0027

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** The core schema (`docs/DATABASE_SCHEMA.md`) introduces **PropertyWorkspace** as a distinct entity, 1:1 with Property in Version 1, that future analysis modules (Parcel links, Zoning, Constraints, Assumptions, Scenario/Financial, Recommendation, Documents, Activity) attach to via `propertyWorkspaceId` — a deliberate refinement of `docs/DOMAIN_MODEL.md` §5.4's "Property is the workspace."
- **Reason:** Keeping Property small and stable (identity, Organization ownership, lifecycle status) while the mutable, module-heavy evaluation data hangs off a separate workspace record avoids overloading Property with every module's foreign key, and lets a Property later hold more than one independent evaluation workspace without migrating every module. It matches the `/property/[id]` workspace already shipped in FM-0029, whose nine sections are exactly these extension points. PropertyWorkspace is not a Project (ADR-0013): it carries no lifecycle or ownership, only evaluation attachment.
- **Alternatives Considered:**
  - Attaching every module directly to Property (rejected — overloads the core record and blocks multiple evaluations per Property without a later migration)
  - Treating Property itself as the only workspace, per the literal DOMAIN_MODEL §5.4 wording (rejected — both the FM-0007 brief and the shipped FM-0029 UI treat the evaluation surface as a distinct "workspace")
- **Impact:** `docs/DATABASE_SCHEMA.md` defines PropertyWorkspace; `docs/DOMAIN_MODEL.md` §4/§5.4a add it to the vocabulary. Every future analysis-module ticket FKs to `propertyWorkspaceId` and carries `organizationId` for RLS.

### ADR-0028

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** User↔Organization membership is modeled as a many-to-many join (**OrganizationMember**) with a composite unique `(organizationId, userId)`; Version 1's one-organization-per-user rule (FD-0002) is enforced at the application layer, not by the schema. Parcel-specific facts (APN, acreage, zoning) are modeled on the future **Parcel** record, not duplicated onto Property.
- **Reason:** A join table is the correct multi-tenant SaaS structure and is what the FM-0007 brief asks for ("one user may belong to multiple organizations"); shaping it for multi-org now means enabling that later is an app-policy change, not a migration, while FD-0002's V1 single-org rule is honored by allowing only one `active` membership per user. Placing APN/acreage/zoning on Parcel (not Property) follows ADR-0011/ADR-0012 (Property↔Parcel is many-to-many, Parcel is the shareable land record) and matches the shipped FM-0029 `Parcel` type; putting them on Property would be lossy for multi-parcel properties and create a second source of truth.
- **Alternatives Considered:**
  - A flat `organizationId` column on User (rejected — cannot represent invite-before-accept, a membership ending, or future multi-org without a breaking change)
  - Duplicating `parcelNumber`/`acreage`/`zoning` onto Property as the brief's field list suggests (rejected — violates normalization and ADR-0012; a Property can span multiple parcels)
- **Impact:** OrganizationMember carries `role` (stored, unenforced in V1) and `status` (`invited`/`active`/`revoked`); Property omits parcel-owned fields and reaches them through its workspace's Parcel links.

### ADR-0029

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Organization membership roles are the closed set `owner` | `admin` | `member` | `viewer`, with permissions and responsibilities defined in `docs/AUTH_FLOW.md`; invite flows may grant `admin`/`member`/`viewer` only (ownership transfer is a separate Owner action).
- **Reason:** FM-0008 requires a concrete role model for authentication/organization architecture. Four roles cover org lifecycle (Owner), team administration (Admin), day-to-day evaluation work (Member), and read-only stakeholder access (Viewer) without inventing fine-grained grants yet. Adding `viewer` extends the earlier three-value sketch in `DATABASE_SCHEMA.md` so schema and auth design stay aligned before migrations land.
- **Alternatives Considered:**
  - Only `owner`/`member` (rejected — insufficient for admin vs read-only stakeholders)
  - Fully custom permission grants from day one (rejected — overbuilds V1; FD-0002 defers fine-grained permissions)
  - Deferring all role definitions until enforcement (rejected — invite UX and RLS design need a stable enum now)
- **Impact:** `OrganizationMember.role` includes `viewer`; UI/API capability matrices and future RLS policies follow AUTH_FLOW §3; module-scoped grants remain a later expansion on top of these four roles.

### ADR-0030

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Authenticated requests that touch business data resolve an **active organization** from a persisted user preference (falling back to the user's sole active membership); organization switching updates that preference and reloads org-scoped context. Under FD-0002's V1 one-org policy the preference is always that single membership; multi-org switching UI appears only when multiple active memberships are allowed.
- **Reason:** ADR-0028 already shapes membership as many-to-many. Without an explicit active-org context, multi-org (and even invite-accept edge cases) would ambiguously scope queries. Separating "which orgs am I in" from "which org am I working in" matches standard SaaS tenancy and keeps FD-0002's single-org rule as an application constraint rather than a schema one.
- **Alternatives Considered:**
  - Inferring org solely from URL path with no preference (rejected — deep links still need a default; shell chrome needs a current org)
  - Storing active org only in client memory (rejected — breaks refresh and server-side RLS context)
  - Requiring org id on every route with no global preference (rejected — poor UX for list/home surfaces)
- **Impact:** Auth implementation and middleware must establish session + `activeOrganizationId` before Property routes; org switcher behavior is specified in `docs/AUTH_FLOW.md` §5–§6.

### ADR-0031

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** `/internal/project-dashboard` (Mission Control) remains accessible without authentication for now; application workspace routes (`/properties`, `/property/*`, `/settings`, `/organization/*`) require a verified Supabase session when Auth is configured.
- **Reason:** Mission Control is an internal engineering surface driven by local `management/data/*.json`, used continuously during development and ticket workflow. Gating it behind Auth before sign-in forms exist would block the project's own operating loop. Application product routes must still be protected so workspace data is never silently exposed. The policy is an explicit temporary exception (`INTERNAL_DASHBOARD_REQUIRES_AUTH = false`), not an accidental public product surface.
- **Alternatives Considered:**
  - Require Auth for Mission Control immediately (rejected — no sign-in UI yet; would strand local workflow)
  - Leave all routes public until forms ship (rejected — Property workspace would be unprotected by default)
  - Hard-code a local-only IP/host check (rejected — brittle across machines/tunnels; Auth is the eventual control)
- **Impact:** Documented in `docs/AUTH_FLOW.md` §12 and `src/lib/auth/routes.ts`. A later ticket may flip `INTERNAL_DASHBOARD_REQUIRES_AUTH` (or add a separate internal auth gate) before any non-local deployment exposes Mission Control.

### ADR-0032

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Ship migration-ready tables `user_profiles`, `organizations`, and `organization_memberships` where profile `id` equals `auth.users.id` (TypeScript `authUserId` aliases `id`); membership statuses are `invited` \| `active` \| `suspended` \| `removed`; V1 enforces at most one `active` membership per user via a partial unique index; active org preference is stored on `user_profiles.active_organization_id` and always re-verified against memberships; RLS uses small `SECURITY DEFINER` helpers (`is_active_org_member`, `has_org_role`) plus a trigger that blocks self role changes.
- **Reason:** FM-0010 needs concrete DDL and access helpers without expanding into onboarding UI. Keeping profile PK = Auth id avoids a second identity map. Expanding statuses beyond the FM-0007 `revoked` sketch adds temporary suspension without inventing a second table. A partial unique index encodes FD-0002 in the database while leaving the join table multi-org-ready. SECURITY DEFINER membership checks avoid circular RLS (memberships policies that need to read memberships). Self-role-change trigger + app helpers prevent privilege escalation even if a client crafts an update.
- **Alternatives Considered:**
  - Separate `auth_user_id` column distinct from profile `id` (rejected — unnecessary join and drift risk for 1:1 profiles)
  - Keeping only `invited`/`active`/`revoked` (rejected — ticket requires suspended/removed; `removed` clarifies soft-delete vs invite revoke)
  - Enforcing one-org only in application code (rejected alone — DB index is a hard safety net for V1; can be dropped later)
  - RLS without definer helpers (rejected — circular policy dependencies on `organization_memberships`)
- **Impact:** SQL under `supabase/migrations/`; TypeScript helpers under `src/lib/organizations/`; `docs/DATABASE_SCHEMA.md` and `docs/AUTH_FLOW.md` updated. Migrations are never auto-applied. Multi-org switching UI remains deferred (FD-0002).

### ADR-0033

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Store parcel source boundaries as `geometry(MultiPolygon, 4326)` with a companion `geometry(Point, 4326)` centroid (auto-synced), keep Property `latitude`/`longitude` as an optional non-authoritative display pin, link Properties to shared Parcels via `property_parcels` (m:n, at most one primary per Property), and use provider-scoped identity `(provider, provider_parcel_id)` with JSONB `raw_source_metadata` for provenance — without implementing derived development geometry or Regrid ingestion in this ticket.
- **Reason:** FM-0011 needs a nationally scalable PostGIS model that matches FD-0005/ADR-0012 (shared Parcel, private Property). EPSG:4326 is the web-map default and avoids state-plane fragmentation for a multi-jurisdiction product. MultiPolygon covers multiparts; centroid supports map pins when a Property has no manual lat/lng. Linking at Property (not only Workspace) lets intake attach land before analysis modules exist. Provider+id uniqueness preserves Regrid and future providers without treating APN as globally unique.
- **Alternatives Considered:**
  - `geography` type instead of `geometry` (rejected for V1 — geometry + explicit 4326 is simpler for GIST and ST_IsValid; geography can be revisited for geodesic area later)
  - Simple `Polygon` only (rejected — real parcels are often multiparts)
  - Authoritative geometry only on Property (rejected — violates Parcel shareability and FORMETRIX.md §14 source vs derived separation)
  - Join only via PropertyWorkspace (rejected for now — blocks Property-before-parcel and before workspace table)
- **Impact:** Migrations `20260731210000`–`20260731210200`; helpers in `src/lib/properties/`; docs updated. Derived site/building footprints remain future work. Regrid writes through service-role ingestion (FM-0012).

### ADR-0034

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Ingest Regrid parcels through a typed server-only client (`src/lib/regrid`) and service-layer upsert keyed by `(provider, provider_parcel_id)` via a `service_role`-only RPC (`upsert_parcel_from_provider`), then create Organization Properties and `property_parcels` links with typed Result unions — without shipping search UI, maps, or workspace wiring.
- **Reason:** FM-0012 is the first real data-ingestion path. Provider-scoped identity avoids APN collisions; service-role writes match FM-0011 RLS (authenticated users cannot mutate shared parcels). An RPC accepts GeoJSON and stores MultiPolygon 4326 so PostgREST does not need ad-hoc geometry casting. Injectable fetch/store keeps CI free of live Regrid credentials while preserving retry/rate-limit behavior.
- **Alternatives Considered:**
  - Authenticated client inserts into `parcels` (rejected — violates shared-parcel RLS design and would require open write policies)
  - Store geometry only inside `raw_source_metadata` (rejected — blocks PostGIS queries and map readiness)
  - Soft-fail duplicates by always inserting new parcel rows (rejected — ticket requires reuse by provider id)
- **Impact:** Migration `20260731220000_upsert_parcel_from_provider.sql`; modules under `src/lib/regrid/` and `src/lib/properties/ingestion/`; env `REGRID_API_TOKEN`; docs/README updated. UI search remains a later ticket; Property Workspace UI is FM-0013.

### ADR-0035

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Ship the Version 1 Property Workspace as a dynamic, service-backed App Router surface (`/properties`, `/property/[id]`) that reads only live Property/Parcel/Organization data, uses empty states instead of mock records, keeps future analysis sections as lazy-load-ready Coming Soon modules, and centralizes status display in `PropertyStatusBadge` backed by `@/lib/properties` status labels.
- **Reason:** FM-0013 is the first investor-demo application screen. Mock data from FM-0029 proved the shell; continuing to show invented properties would violate FORMETRIX.md honesty rules once ingestion exists. Dynamic rendering replaces ADR-0026's static mock params because property ids are no longer a closed build-time set. Module registry imports keep the shell stable while Zoning/Financial/AI remain unimplemented.
- **Alternatives Considered:**
  - Keep mock properties when Supabase is empty (rejected — invents investor-facing records)
  - Block all workspace routes until Regrid + search UI ship (rejected — Overview can show an imported Property without search)
  - Single-page client tabs without routes (rejected — bookmarkable sections and lazy module boundaries)
- **Impact:** Removed `mock-properties.ts`; workspace under `src/features/properties/`; ADR-0026 static-param approach superseded for live ids. Mapbox/zoning/financial/AI remain out of scope.

### ADR-0036

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Treat `/property/[id]` Overview as the Property Dashboard — a composition of identity/location, data-availability inventory, dataset/analysis status, summaries, timeline, recommendation placeholder, and module quick-nav — derived only from live `WorkspaceView` helpers (`buildDashboardInventory`), with future modules explicitly marked `not_built` rather than stubbed with fake values.
- **Reason:** FM-0014 requires the primary screen to show what the property is, where it is, and what data is available. Extending the FM-0013 Overview avoids a second competing home surface. Honest `not_built`/`missing` states keep investors from mistaking empty zoning/financial slots for completed analysis.
- **Alternatives Considered:**
  - Separate `/property/[id]/dashboard` route (rejected — splits the default landing)
  - Hard-coded “available” chips for future modules (rejected — invents capability)
  - Defer availability UI until zoning ships (rejected — ticket acceptance needs “what data is available” now)
- **Impact:** `PropertyDashboard` + `dashboard-availability` under `src/features/properties/`; nav label Overview → Dashboard. Mapbox/zoning/financial engines remain later tickets.

### ADR-0037

- **Date:** 2026-07-31
- **Status:** Accepted
- **Decision:** Prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as the public Supabase API key env name; accept legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` only when publishable is unset, via one resolver (`resolveSupabasePublicKey`). Do not require both or invent a third convention. Mark anon-only setups for future cleanup once all environments use publishable.
- **Reason:** FM-0005 and current Supabase dashboards/docs use “publishable”; ADR-0010’s anon-only name created a conflicting convention. Centralized fallback keeps older `.env.local` files working without dual-key confusion.
- **Alternatives Considered:**
  - Keep anon-only (ADR-0010) — rejected; mismatches official naming
  - Require both names — rejected; two conflicting sources of truth
  - Hard cutover with no fallback — rejected; breaks existing local env files abruptly
- **Impact:** `.env.example`, `env.ts`, `config.ts`, health-check, and unconfigured auth screen document publishable first; service-role remains `SUPABASE_SERVICE_ROLE_KEY` (server-only).

### ADR-0038

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Render Property Dashboard parcel maps with `mapbox-gl`, sourcing boundary GeoJSON from PostGIS via `parcel_geometries_geojson` (`ST_AsGeoJSON`). Fit bounds to the live boundary; show a property display pin when lat/lng exist, otherwise the parcel centroid; offer street and satellite basemaps; show empty states when the Mapbox token or geometry is missing. Never invent mock parcel outlines. Surface an honest precision caption from provider `geometryQuality`.
- **Reason:** FM-0015 requires the first real map feature without implying false survey precision. PostgREST’s default geometry encoding is not Mapbox-ready; a SECURITY INVOKER RPC keeps RLS intact while returning GeoJSON.
- **Alternatives Considered:**
  - Client-side EWKB parsing (rejected — fragile, duplicates PostGIS)
  - Leaflet / Google Maps (rejected — ADR-0005 commits to Mapbox)
  - Mock GeoJSON fixtures when parcels are empty (rejected — invents land records)
- **Impact:** `mapbox-gl` dependency; `ParcelMap` / `ParcelMapCard` on the Property Dashboard; migration `20260804050000_parcel_geometry_geojson.sql`. Zoning overlays remain later tickets.

### ADR-0039

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Model zoning as normalized, parcel-linked reference data (municipality, district/code, overlays, land uses, dimensional regulations) with multi-provider identity and provenance on `parcel_zoning`. Surface a full Zoning Overview on the Property Dashboard and `/property/[id]/zoning` from live rows only. Unknown fields stay null / “Not available”; never invent classifications. Trusted writes go through `upsert_parcel_zoning_from_provider` (service_role).
- **Reason:** FM-0016 requires stored classification per parcel and an Overview UI. Attaching to Parcel (not Property) matches ADR-0012. Normalization + provider keys allow future zoning providers without redesign. Explicit units and null-as-unknown avoid false precision that would mislead investors.
- **Alternatives Considered:**
  - Free-text zoning string on Parcel (rejected — not queryable; blocks overlays/uses)
  - Property-owned zoning only (rejected — parcels are shareable land records)
  - Seed demo zoning for empty DBs (rejected — invents land-use law)
- **Impact:** Migrations `20260804060000`–`20260804060200`; `src/lib/zoning/`; `ZoningOverview` on Dashboard + zoning module. FM-0017 constraints analysis builds on these regulations.

### ADR-0040

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Implement every authentication flow as a Next.js Server Action posting from a plain `<form>`, rather than calling `supabase.auth.*` from the browser. Credentials are validated server-side by `src/lib/auth/validation.ts` before any Supabase call, and failures are rendered through a shared `AuthFormState`.
- **Reason:** FM-0006A. The password never enters client JavaScript, and `@supabase/ssr` writes the session cookies through Next's cookie store in the same round-trip — a browser-side sign-in updates the browser's copy of the session while the server only learns about it on some later request. Progressive enhancement (forms that work without JavaScript) falls out of the same choice, and was what allowed the flows to be verified end-to-end by replaying real form posts.
- **Alternatives Considered:**
  - Client-side `signInWithPassword` + `onAuthStateChange` (rejected — splits session ownership between browser and server; password enters the client bundle)
  - Route Handlers with `fetch` from the client (rejected — reimplements what a form action already does, and loses no-JS operation)
  - NextAuth/Auth.js in front of Supabase (rejected — ADR-0002 makes Supabase Auth the sole identity boundary; a second layer duplicates session state)
- **Impact:** `src/features/auth/` (actions + components), `src/lib/auth/` (validation, messages, redirect URLs, post-auth routing). `AuthProvider` still subscribes to `onAuthStateChange`, but only so the header can show a signed-in state — it is documented as presentation, never an authorization gate.

### ADR-0041

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Create the Organization, its owner Membership, and the user's `active_organization_id` in one `SECURITY DEFINER` function, `public.create_organization_with_owner(text, text)`, which derives its actor from `auth.uid()` and returns a status object rather than raising. Provision `user_profiles` from an `on_auth_user_created` trigger on `auth.users`, with an application-side `ensureUserProfile()` repair path.
- **Reason:** FM-0006A first-login setup. As three separate RLS-scoped client writes, a failure after the first one strands an Organization with no owner — a row nobody can subsequently administer without the service-role key. Returning `slug_taken` / `already_member` / `invalid_slug` as data lets the form put the message on the right field instead of parsing SQLSTATEs out of an exception. The trigger guarantees no signed-in user can exist without a profile; the trigger deliberately swallows its own errors so a profile problem can never surface to a new user as "Database error saving new user".
- **Alternatives Considered:**
  - Three sequential client calls under RLS (rejected — non-atomic; orphan organizations)
  - Service-role client in a Server Action (rejected — needs `SUPABASE_SERVICE_ROLE_KEY` on a user-facing path and bypasses RLS for an operation the user is entitled to perform anyway)
  - Application-only profile creation, no trigger (rejected — leaves users created through the dashboard or admin API without a profile)
- **Impact:** Migration `20260804070000_auth_profile_and_organization_setup.sql`; `/onboarding/organization`; `src/features/auth/actions/organization-setup.ts`. The V1 one-active-membership rule (FD-0002) is enforced in the function and by the existing unique index. Invitations and organization switching stay out of scope.

### ADR-0042

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Read every `NEXT_PUBLIC_*` variable through a static `process.env.NEXT_PUBLIC_X` member access (`PUBLIC_ENV_READERS` in `src/lib/env.ts`, `defaultPublicKeyEnv()` in `src/lib/supabase/public-key.ts`) instead of the computed `process.env[name]` lookup used previously.
- **Reason:** Next.js substitutes public env vars into client bundles by textual replacement of `process.env.NEXT_PUBLIC_X`; a computed lookup is left untouched and evaluates to `undefined` in the browser. The previous helpers therefore reported _every_ public variable as unset in any Client Component. Confirmed by inspecting the built chunks: after the change the Supabase URL, publishable key, and Mapbox token appear inlined and no `process.env` reference survives. This had also been silently disabling the FM-0015 parcel map, whose `isMapboxConfigured()` check runs client-side — it was never caught because that ticket could only verify server-rendered markup.
- **Alternatives Considered:**
  - Passing public values from Server Components as props (rejected — threads configuration through every component that needs it, for a problem the bundler already solves)
  - Keeping dynamic access and reading config only on the server (rejected — the browser Supabase client and the map genuinely need these values)
- **Impact:** `src/lib/env.ts`, `src/lib/supabase/public-key.ts`. Any future public variable must be added to `PUBLIC_ENV_READERS` to be visible in the browser; the server-only `readServerEnv` path is unchanged.

### ADR-0043

- **Date:** 2026-08-04
- **Status:** Accepted
- **Decision:** Grant EXECUTE on `upsert_parcel_from_provider` and `upsert_parcel_zoning_from_provider` to `service_role` only, revoking explicitly from `public`, `anon`, **and** `authenticated`. The revoke/grant is applied by looping over `pg_proc` by function name so every overload is covered, and the migration self-verifies with `has_function_privilege`, raising rather than reporting success if any untrusted role retains access.
- **Reason:** FM-0030. Both functions are `SECURITY DEFINER` and bypass RLS — they are the only write path into `public.parcels`, which grants `authenticated` no INSERT/UPDATE policy at all. The original migrations ended with `revoke all ... from public`, which reads as "service role only" but is not: Supabase's default privileges grant EXECUTE on new functions in `public` directly to the named `anon`/`authenticated` roles, and `REVOKE ... FROM PUBLIC` does not touch a grant held by a named role. An audit confirmed `has_function_privilege('anon', ...)` was true on the hosted project, so any holder of the publishable key could insert or overwrite shared parcel and zoning reference data — the fabricated-land-record scenario FORMETRIX.md §7 forbids.
- **Alternatives Considered:**
  - Narrowing Supabase's global default privileges via `ALTER DEFAULT PRIVILEGES` (rejected — would also strip `authenticated` from functions that must stay callable by signed-in users: `create_organization_with_owner` and the RLS helpers `is_active_org_member` / `has_org_role` / `can_access_property`)
  - Relying on each function's internal validation (rejected — validation rejects malformed input, not unauthorized callers; a well-formed hostile payload would still have been written)
  - Moving ingestion behind a Next.js Route Handler and leaving the grants (rejected — the database boundary, not the application, is what must hold when the key leaks)
- **Impact:** Migration `20260804180000_secure_ingestion_rpc_permissions.sql`. No application code or UI changed; the service-role ingestion path is unaffected and was re-verified end to end against live Regrid data. `src/lib/properties/ingestion/rpc-permissions.test.ts` fails the build if a future migration re-grants either function to `anon`/`authenticated`, and carries an opt-in live probe (`FORMETRIX_LIVE_RPC_CHECK=1`) asserting SQLSTATE 42501 from a publishable-key caller. Every future `SECURITY DEFINER` function intended to be server-only needs the same explicit revoke — the default-privilege behavior remains global.
