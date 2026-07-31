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
