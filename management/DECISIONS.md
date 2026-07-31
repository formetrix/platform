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
- **Impact:** `src/lib/mapbox/` is the sanctioned integration point; no map rendering exists yet (see FM-0015) and `mapbox-gl` is deliberately not installed until it does.

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
- **Status:** Accepted
- **Decision:** Name the Supabase public API key environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Reason:** Supabase's newer project dashboards and official Next.js example (`vercel/next.js/examples/with-supabase`, checked against the `canary` branch while building FM-0021) have moved to calling this a "publishable" key rather than an "anon" key. Both name the same kind of key: public, safe for the browser, constrained by Row Level Security rather than secrecy. `ANON_KEY` was kept because it was explicitly specified by name in the ticket that requested this configuration, and it remains a fully valid, functional name for this key on Supabase projects that issue one.
- **Alternatives Considered:**
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, matching Supabase's current default naming for newly-created projects
- **Impact:** `.env.example`, `src/lib/env.ts`, and everything under `src/lib/supabase/` read `NEXT_PUBLIC_SUPABASE_ANON_KEY`. When the real Supabase project is provisioned (FM-0005), check which key name its dashboard actually issues — if it's a "publishable" key, either rename this variable or map it explicitly rather than assuming the two are interchangeable in every SDK code path.

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
