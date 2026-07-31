# Changelog

## About This Document

### Purpose

This document is the version-by-version changelog for the Formetrix platform repository. It records what was actually built, in the order it happened, so that anyone reviewing the project — founder, future team member, or AI engineering agent — can trace what exists in the codebase back to when and why it arrived, without relying on memory or on git history alone.

### How to Maintain This Document

- Add a new entry the moment a notable, verified change lands — in the working tree or in a commit — not retroactively and not in advance of the work actually being done.
- Either the founder or an AI engineering agent may add an entry, but it must describe only work that has actually happened, consistent with the FORMETRIX.md rule against fabricating status or functionality.
- Group entries under a version heading using the standard Added / Changed / Fixed categories; omit any category with nothing to report for that version.
- If the state of the codebase differs from the state of git history — for example, verified work exists in the working tree but has not yet been committed — say so explicitly in the version's entry rather than implying the two are in sync.
- New version sections are added above older ones, so the most recent version is always at the top, directly under this section.
- Reference the related ticket (FM-XXXX) or decision (ADR-XXXX) ID in parentheses at the end of an entry whenever the change traces to one.
- Use the exact field order and heading levels shown in the Structure section below for every entry.

### Structure

Each version entry uses the following fields, in this order:

- **Version header** — `## [version] - date or date range`, using the version number and the date(s) the work in that version covers.
- **Note** (optional) — a plain-sentence callout used when the state of git history needs to be stated explicitly, such as work being verified but not yet committed.
- **Category groups** — one or more of `### Added`, `### Changed`, `### Fixed`, each followed by a bullet list; omit any category with no entries for that version.
- **Entry** — one bullet line per change, with a related ticket/decision ID in parentheses where applicable.

**Template**

```markdown
## [X.Y.Z] - [YYYY-MM-DD or date range]

**Note:** [State plainly if git history and working-tree state diverge, or omit this line]

### Added

- [Describe the change in one line.] ([FM-XXXX] or [ADR-XXXX] if applicable)

### Changed

- [Describe the change in one line.] ([FM-XXXX] if applicable)

### Fixed

- [Describe the change in one line.] ([FM-XXXX] if applicable)
```

---

## [0.1.0] - 2026-07-29 to 2026-07-30 (Unreleased)

**Note:** The foundation and management-system work below was committed locally as `7e0db87` ("FM-0001: Initialize Formetrix foundation"), but that commit has not been pushed to GitHub yet — local `main` is ahead of `origin/main`. The Supabase application foundation entry below (FM-0021) was built on top of that commit and, as of this note, is itself still uncommitted in the working tree. See FM-0003.

### Added

- Repository created on GitHub (Formetrix/platform).
- Founder Pack established as the source constitution and initial product, architecture, database, and UI reference docs. It is maintained alongside this repository for now; importing it into platform/docs is tracked as FM-0002.
- FORMETRIX.md adopted into the platform repository as the binding project constitution (ADR-0009).
- Next.js 15 application foundation scaffolded and verified: App Router structure, TypeScript, Tailwind CSS v4, ESLint/Prettier, Supabase client placeholders, Mapbox integration placeholder, dark/light theming, error boundaries, loading states, and a basic auth structure placeholder.
- Formetrix Project Management System created (management/): MILESTONES.md, TICKETS.md, DECISIONS.md, MEETINGS.md, CHANGELOG.md (FM-0001).
- Configured Supabase application foundation: browser client, server client, a dormant session-refresh middleware utility, centralized environment-variable validation, and a manually-invoked health-check utility, all under `src/lib/supabase/`. No live Supabase project is connected and no authentication, tables, or Row Level Security were added (FM-0021; see TICKETS.md's note on that ticket's ID and ADR-0010).
- Defined the initial conceptual domain model (`docs/DOMAIN_MODEL.md`): Organization, User, Membership, Property, Parcel, Scenario, Assumption, Analysis, Constraint, Result, Recommendation, Report, and Data Source, with explicit Version 1 boundary recommendations, a conceptual relationship diagram, and blocking/non-blocking open questions for founder review. No schema, migrations, or application code were added (FM-0022; ADR-0011 through ADR-0014).
- Founder domain decisions finalized (FD-0001 through FD-0009): resolved all five previously-blocking Open Questions plus two non-blocking ones, established Property as a long-lived workspace carrying a lifecycle status (Discovered → Archived in Version 1; Planning → Completed explicitly deferred), and finalized the Version 1 domain boundary with no concept left as "Requires founder decision." `docs/DOMAIN_MODEL.md` updated accordingly. No schema, migrations, or application code were added (FM-0023).
- Founder decision log created (`management/FOUNDER_DECISIONS.md`) — the permanent record of product decisions, distinct from the architecture-focused `management/DECISIONS.md` (FM-0023; ADR-0015).
- Founder Pack governing docs (`docs/PRODUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md`, `UI.md`) and `.cursor/rules/formetrix.mdc` copied into this repository, content verified to match the source exactly — not yet committed to git (FM-0002).
- Established `platform/` as the sole canonical Formetrix repository; no external directory, including the former Founder Pack reference folder, is an active project reference going forward (ADR-0016).
